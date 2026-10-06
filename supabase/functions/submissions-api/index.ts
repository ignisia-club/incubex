// Edge Function: submissions-api   (read-only API for Club OS)
//
//   GET /functions/v1/submissions-api
//       ?team_id=INC-12345     optional - return only that team
//       &expires_in=3600       optional - link lifetime in seconds (60 .. 604800, default 3600)
//   Header:  x-api-key: <API_KEY>        (or  Authorization: Bearer <API_KEY>)
//
// Returns every submitted deck:
//   team_id      the team
//   uploaded_at  ISO-8601 upload time (UTC)
//   link_1       temporary signed link to the primary copy (Supabase Storage)
//   link_2       temporary signed link to the backup copy (Backblaze B2), or null if not backed up yet
//   backup_status "success" | "pending" | "failed" | "none"
//   approval_status, file_type
//
// Club OS reads the same items under `entries`, with these names (added alongside the ones above):
//   id, teamId, url (link_1, else link_2), fileName (<team_id>.<ext>), submittedAt
//
// Links are temporary by design: the buckets are private. Call the API again for fresh links.
//
// Secrets:  API_KEY (required), B2_KEY_ID, B2_APP_KEY, B2_BUCKET, B2_ENDPOINT (shared with backup-ppt),
//           ALLOWED_ORIGIN (optional - only needed if a *browser* calls this API)
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by Supabase automatically.)

import { createClient } from "@supabase/supabase-js";
import { AwsClient } from "aws4fetch";

const SOURCE_BUCKET = "incubex-ppts";
const DEFAULT_EXPIRES = 3600;
const MIN_EXPIRES = 60;
const MAX_EXPIRES = 7 * 24 * 3600; // B2 presigned URLs cannot outlive 7 days
const MAX_ROWS = 2000;

const env = (name: string) => {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing secret: ${name}`);
  return v;
};

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

const endpoint = env("B2_ENDPOINT").replace(/^https?:\/\//, "").replace(/\/$/, "");
const b2 = new AwsClient({
  accessKeyId: env("B2_KEY_ID"),
  secretAccessKey: env("B2_APP_KEY"),
  service: "s3",
  region: endpoint.split(".")[1],
});
const b2Bucket = env("B2_BUCKET");
const API_KEY = env("API_KEY");
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "";

function baseHeaders(req: Request): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store", // the response contains live signed links
    "X-Content-Type-Options": "nosniff",
  };
  const origin = req.headers.get("origin");
  if (ALLOWED_ORIGIN && origin && origin === ALLOWED_ORIGIN) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Headers"] = "x-api-key, authorization, content-type";
    h["Access-Control-Allow-Methods"] = "GET, OPTIONS";
    h["Vary"] = "Origin";
  }
  return h;
}

const respond = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: baseHeaders(req) });

// Compare in constant time over equal-length digests so neither content nor length leaks via timing.
async function keyMatches(provided: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(provided)),
    crypto.subtle.digest("SHA-256", enc.encode(API_KEY)),
  ]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

function extractKey(req: Request): string {
  const direct = req.headers.get("x-api-key");
  if (direct) return direct.trim();
  const auth = req.headers.get("authorization") ?? "";
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

async function presignB2(key: string, expires: number): Promise<string> {
  const url = new URL(`https://${endpoint}/${b2Bucket}/${encodeURIComponent(key)}`);
  url.searchParams.set("X-Amz-Expires", String(expires));
  const signed = await b2.sign(url.toString(), { method: "GET", aws: { signQuery: true } } as RequestInit);
  return signed.url;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: baseHeaders(req) });
  }
  if (req.method !== "GET") {
    return respond(req, { error: "Method not allowed. Use GET." }, 405);
  }

  const provided = extractKey(req);
  if (!provided || !(await keyMatches(provided))) {
    return respond(req, { error: "Unauthorized: missing or invalid API key." }, 401);
  }

  // ---- validate query params -------------------------------------------------
  const params = new URL(req.url).searchParams;

  let expires = DEFAULT_EXPIRES;
  if (params.has("expires_in")) {
    const raw = params.get("expires_in") ?? "";
    expires = /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isInteger(expires) || expires < MIN_EXPIRES || expires > MAX_EXPIRES) {
      return respond(req, { error: `expires_in must be a whole number of seconds between ${MIN_EXPIRES} and ${MAX_EXPIRES}.` }, 400);
    }
  }

  let teamFilter: string | null = null;
  if (params.has("team_id")) {
    teamFilter = (params.get("team_id") ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9-]{1,50}$/.test(teamFilter)) {
      return respond(req, { error: "team_id must look like 1003 or INC-12345." }, 400);
    }
  }

  try {
    // ---- read data -----------------------------------------------------------
    let query = supabase
      .from("submissions")
      .select("id, team_id, ppt_url, approval_status, submitted_at, created_at")
      .not("ppt_url", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(MAX_ROWS);
    if (teamFilter) query = query.eq("team_id", teamFilter);
    const { data: subs, error: subsError } = await query;
    if (subsError) throw new Error(`submissions: ${subsError.message}`);

    const rows = subs ?? [];
    const paths = rows.map((r) => r.ppt_url as string);

    const [backupsRes, signedRes] = await Promise.all([
      paths.length
        ? supabase.from("ppt_backups").select("source_path, backup_key, status").in("source_path", paths)
        : Promise.resolve({ data: [], error: null }),
      paths.length
        ? supabase.storage.from(SOURCE_BUCKET).createSignedUrls(paths, expires)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (backupsRes.error) throw new Error(`ppt_backups: ${backupsRes.error.message}`);
    if (signedRes.error) throw new Error(`signed urls: ${signedRes.error.message}`);

    const backupByPath = new Map((backupsRes.data ?? []).map((b) => [b.source_path, b]));
    const signedByPath = new Map((signedRes.data ?? []).map((s) => [s.path, s]));

    // ---- build response ------------------------------------------------------
    const submissions = await Promise.all(rows.map(async (r) => {
      const backup = backupByPath.get(r.ppt_url);
      const signed = signedByPath.get(r.ppt_url);
      const backedUp = backup?.status === "success";
      const link_1 = signed && !signed.error ? signed.signedUrl : null;
      const link_2 = backedUp ? await presignB2(backup!.backup_key, expires) : null;
      const uploaded_at = new Date(r.submitted_at ?? r.created_at).toISOString();
      const file_type = (r.ppt_url.split(".").pop() ?? "").toLowerCase();
      return {
        // Club OS field names
        id: String(r.id),
        teamId: r.team_id,
        url: link_1 ?? link_2,
        fileName: `${r.team_id}.${file_type}`,
        submittedAt: uploaded_at,
        // original field names
        team_id: r.team_id,
        uploaded_at,
        link_1,
        link_2,
        backup_status: backup?.status ?? "none",
        approval_status: r.approval_status ?? "pending",
        file_type,
      };
    }));

    return respond(req, {
      generated_at: new Date().toISOString(),
      links_expire_in_seconds: expires,
      count: submissions.length,
      entries: submissions, // what Club OS reads
      submissions,
    });
  } catch (err) {
    // Log details server-side only; never leak internals to the caller.
    console.error("submissions-api failed:", err);
    return respond(req, { error: "Internal error. Please try again." }, 500);
  }
});
