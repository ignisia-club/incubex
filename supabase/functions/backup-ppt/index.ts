// Edge Function: backup-ppt
//
// Copies every submitted presentation from the private Supabase bucket `incubex-ppts`
// to a Backblaze B2 bucket (S3-compatible API), named after the Team ID:
//   first upload  -> INC-12345.pdf
//   re-upload     -> INC-12345_v2.pdf, INC-12345_v3.pdf, ...   (older versions are kept)
//
// Triggered two ways (both require the `x-webhook-secret` header):
//   1. Database Webhook on INSERT into public.submissions  (automatic, per submission)
//   2. POST {"sweep": true}                                 (retries anything not yet backed up)
//
// Required secrets:  WEBHOOK_SECRET, B2_KEY_ID, B2_APP_KEY, B2_BUCKET, B2_ENDPOINT
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by Supabase automatically.)

import { createClient } from "@supabase/supabase-js";
import { AwsClient } from "aws4fetch";

const SOURCE_BUCKET = "incubex-ppts";
const SWEEP_LIMIT = 20;

const env = (name: string) => {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing secret: ${name}`);
  return v;
};

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

// B2_ENDPOINT looks like "s3.us-west-004.backblazeb2.com" -> region "us-west-004"
const endpoint = env("B2_ENDPOINT").replace(/^https?:\/\//, "").replace(/\/$/, "");
const region = endpoint.split(".")[1];
const bucket = env("B2_BUCKET");
const b2 = new AwsClient({
  accessKeyId: env("B2_KEY_ID"),
  secretAccessKey: env("B2_APP_KEY"),
  service: "s3",
  region,
});

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

type Submission = { team_id: string; ppt_url: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// Constant-time-ish comparison so the secret can't be probed by timing.
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function backupOne({ team_id, ppt_url }: Submission) {
  if (!team_id || !ppt_url) throw new Error("Submission has no team_id / file path");

  const { data: existing } = await supabase
    .from("ppt_backups")
    .select("*")
    .eq("source_path", ppt_url)
    .maybeSingle();
  if (existing?.status === "success") return { team_id, backup_key: existing.backup_key, skipped: true };

  const ext = (ppt_url.split(".").pop() ?? "").toLowerCase();
  if (!MIME[ext]) throw new Error(`Unsupported file extension: .${ext}`);
  const safeTeam = team_id.toUpperCase().replace(/[^A-Z0-9_-]/g, "");

  // Reserve a version number (first upload = v1, re-upload = v2, ...). Retry if two race.
  let row = existing;
  for (let attempt = 0; !row && attempt < 3; attempt++) {
    const { data: latest } = await supabase
      .from("ppt_backups")
      .select("version")
      .eq("team_id", team_id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const version = (latest?.version ?? 0) + 1;
    const backup_key = version === 1 ? `${safeTeam}.${ext}` : `${safeTeam}_v${version}.${ext}`;
    const { data, error } = await supabase
      .from("ppt_backups")
      .insert({ team_id, source_path: ppt_url, version, backup_key })
      .select()
      .single();
    if (!error) row = data;
    else if (error.code === "23505") {
      // either same source_path already inserted (webhook retry) or version race: re-read / retry
      const { data: again } = await supabase.from("ppt_backups").select("*").eq("source_path", ppt_url).maybeSingle();
      if (again) row = again;
    } else throw new Error(`Could not log backup: ${error.message}`);
  }
  if (!row) throw new Error("Could not reserve a backup version");

  try {
    const { data: blob, error: dlError } = await supabase.storage.from(SOURCE_BUCKET).download(ppt_url);
    if (dlError || !blob) throw new Error(`Download from Supabase failed: ${dlError?.message ?? "no data"}`);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (bytes.length === 0) throw new Error("Source file is empty");

    const url = `https://${endpoint}/${bucket}/${encodeURIComponent(row.backup_key)}`;
    const put = await b2.fetch(url, { method: "PUT", body: bytes, headers: { "Content-Type": MIME[ext] } } as RequestInit);
    if (!put.ok) throw new Error(`B2 upload failed (${put.status}): ${(await put.text()).slice(0, 300)}`);

    // Verify: the object must exist in B2 with exactly the same size.
    const head = await b2.fetch(url, { method: "HEAD" } as RequestInit);
    const remoteSize = Number(head.headers.get("content-length"));
    if (!head.ok || remoteSize !== bytes.length) {
      throw new Error(`B2 verification failed (status ${head.status}, size ${remoteSize} vs ${bytes.length})`);
    }

    await supabase
      .from("ppt_backups")
      .update({
        status: "success",
        size_bytes: bytes.length,
        error: null,
        attempts: row.attempts + 1,
        backed_up_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    return { team_id, backup_key: row.backup_key, size_bytes: bytes.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("ppt_backups")
      .update({ status: "failed", error: message.slice(0, 500), attempts: row.attempts + 1 })
      .eq("id", row.id);
    throw err;
  }
}

async function sweep() {
  const [{ data: subs, error: subsError }, { data: done, error: doneError }] = await Promise.all([
    supabase.from("submissions").select("team_id, ppt_url").not("ppt_url", "is", null),
    supabase.from("ppt_backups").select("source_path").eq("status", "success"),
  ]);
  // Never report "nothing to do" when the real problem is that we couldn't read the tables.
  if (subsError || doneError) {
    throw new Error(`Sweep could not read tables: ${(subsError ?? doneError)!.message}`);
  }
  const doneSet = new Set((done ?? []).map((d) => d.source_path));
  const todo = (subs ?? []).filter((s) => !doneSet.has(s.ppt_url)).slice(0, SWEEP_LIMIT);

  const results = [];
  for (const s of todo) {
    try {
      results.push({ ...(await backupOne(s)), ok: true });
    } catch (err) {
      results.push({ team_id: s.team_id, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return { processed: results.length, remaining_estimate: Math.max(0, (subs?.length ?? 0) - doneSet.size - results.filter((r) => r.ok).length), results };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = req.headers.get("x-webhook-secret") ?? "";
  if (!safeEqual(secret, env("WEBHOOK_SECRET"))) return json({ error: "Unauthorized" }, 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  try {
    if (body?.sweep) return json(await sweep());

    // Database Webhook payload: { type: "INSERT", table: "submissions", record: {...} }
    if (body?.type === "INSERT" && body?.table === "submissions" && body?.record) {
      return json({ ok: true, ...(await backupOne(body.record)) });
    }
    return json({ error: "Unsupported payload" }, 400);
  } catch (err) {
    console.error("backup-ppt failed:", err);
    return json({ ok: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
