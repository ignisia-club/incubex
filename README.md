# INCUBEX 2026

Dynamic Single Page Application (SPA) for INCUBEX, Ignisia's national tech launchpad at MIT-WPU, Pune.

## Architecture

The project is a **React + Vite** application with client-side routing (React Router) and a completely secure Supabase backend.

| Route     | Page                     | Access                         |
| --------- | ------------------------ | ------------------------------ |
| `/`       | Landing Page             | Public                         |
| `/upload` | Upload Portal            | Public, gated by valid Team ID |
| `/admin`  | Submissions dashboard    | Supabase Auth login only       |

*(Note: The landing page was relocated; this app serves as the standalone portal for file uploads and management.)*

### Supabase Integration & Security (ACID Compliant)

Supabase handles the Database (PostgreSQL), Storage (S3-compatible), and Auth. The system is heavily locked down:
- **Zero Scraping:** The `teams` and `submissions` tables have strict Row Level Security (RLS). Public users cannot read the tables to scrape data or extract Team IDs. They can only verify if a team exists via a secure RPC (`team_exists`).
- **File Security:** The `incubex-ppts` storage bucket is **private**. Files cannot be downloaded publicly. Admins generate 60-second or 7-day presigned URLs dynamically to view or export files.
- **Strict Validations:** The database explicitly restricts file uploads to `.pdf, .ppt, .pptx` and enforces a strict 25 MB limit at the database level.
- **Migrations:** Database changes live in `supabase/migrations/` and are numbered `00_`, `01_`, etc. *Never edit an existing migration; always add a new numbered file.*

## Key Features

### 1. Upload Portal (`/`)
- Teams upload their pitch decks (max 25MB). 
- Validates Team IDs instantly.
- **Appeals System:** If a team has already submitted a pitch deck, the file-drop area dynamically switches to an "Appeal Form". The team can write a message requesting to resubmit, which is saved to the database for admins to review.

### 2. Admin Dashboard (`/admin`)
- Secure dashboard accessible only via login.
- **Filters & Stats:** Sort views by "All Teams", "Pending", "Approved", "Rejected", or "Not Submitted".
- **Actions:** 
  - Click the **Check** (Approve) or **X** (Reject) to update status (requires confirmation).
  - Click the **Trash** icon to completely reset a team. This deletes the file from the Storage Bucket and removes the database row, resetting their status to "Not Submitted".
- **Appeals:** If a team submitted an appeal, it displays in orange directly beneath their Team ID.
- **Excel Export:** The "Export" button generates an instant `.xlsx` Excel download. It automatically generates 7-day temporary Signed URLs for every pitch deck so you can click them straight from Excel!

---

## How to Test

### 1. Setup
1. Install dependencies: `npm install`
2. Configure environment variables in `.env` (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).
3. Run all `supabase/migrations/` files in order (`00_` to `12_`; `07`-`10` are only needed for the B2 backup) inside the Supabase SQL editor.
   `11_admin_team_management.sql` lets admins add and remove Team IDs from `/admin`;
   `12_accept_any_numeric_team_id.sql` accepts every 4-5 digit Team ID without listing it first.
4. Start the app: `npm run dev` (Opens at http://localhost:5173).

### 2. Testing the Upload Portal
Go to `http://localhost:5173/upload`. 
- **Team IDs:** every 4-5 digit number (`0000`-`9999`, `00000`-`99999`; leading zeros kept) is a valid Club OS Team ID and is
  accepted as-is (migration `12`); its `teams` row is created on first upload. `INC-12345`-style IDs must be listed in `teams`
  (add them from `/admin` → **Teams**).
  Dummy IDs `INC-12345`, `INC-56789` and `INC-99999` are seeded in migration `02`.
- **Test Upload:** Enter `INC-12345`, upload a PDF, and hit Submit.
- **Test Appeal:** Refresh the page and try entering `INC-12345` again. The system will detect the existing submission and prompt you with the Appeal form instead of the file drop!

### 3. Testing the Admin Dashboard
Go to `http://localhost:5173/admin` and sign in with an admin account (a user listed in `public.admins`).
Admin passwords are set in the Supabase SQL editor (migration `03`) and are **never** written in this repo.

Once inside:
- Click **Teams** to add Team IDs, or the bin icon on a team without a submission to remove it.
- Try filtering by "Pending" or "Not Submitted".
- Approve or reject a submission.
- Click the "Trash" icon on a submission to reset it, then check the Upload page to see if that team can upload again.
- Click the **Export** button and open the resulting Excel file to test the generated Pitch Deck links.

## Secondary Backup (Backblaze B2)

Every submitted deck is copied to a Backblaze B2 bucket by the `backup-ppt` Edge Function
(`supabase/functions/backup-ppt`). Files are named after the Team ID and the original extension:
`INC-12345.pdf` for the first upload, `INC-12345_v2.pdf`, `_v3`... if the team re-uploads after an admin reset
(older versions are kept). Each copy is verified in B2 (size check) and logged in `public.ppt_backups`
(migration `07`). Backups survive an admin deleting the submission.

### One-time setup

**Quick path (recommended).** Put the B2 values in `.env.backup.local` (gitignored):
`B2_KEY_ID`, `B2_APP_KEY`, `B2_BUCKET`, `B2_ENDPOINT` (e.g. `s3.us-east-005.backblazeb2.com`), then, with the Supabase CLI
logged in (`supabase login`) to an account that can access the project:

```bash
scripts/setup-backup.sh <project-ref>
```

It links the project, runs migrations `07`-`10`, stores the trigger/cron secrets in Vault, sets the function secrets, deploys
`backup-ppt`, and runs a first sweep. It is safe to re-run.

**What it does / manual equivalent**
1. **B2:** a **private** bucket plus an Application Key **limited to that bucket** (list/read/write files, no delete-version
   rights). Do not use the account Master Application Key: it can delete every bucket and key on the account.
2. **Database:** migrations `07_ppt_backups.sql` (log table), `08_backup_sweep_schedule.sql` (2-hourly retry) and
   `09_backup_on_submit_trigger.sql` (back up on submit) and `10_backup_service_role_grants.sql` (lets the function read
   `submissions` and write the log).
3. **Function secrets + deploy** (`supabase link --project-ref <ref>` first):
   ```bash
   supabase secrets set WEBHOOK_SECRET=<long-random-string> B2_KEY_ID=... B2_APP_KEY=... B2_BUCKET=... B2_ENDPOINT=s3.<region>.backblazeb2.com
   supabase functions deploy backup-ppt --no-verify-jwt
   ```
4. **Vault secrets** (used by both the submit trigger and the cron job; the second must equal `WEBHOOK_SECRET`):
   ```sql
   select vault.create_secret('https://<project-ref>.supabase.co', 'backup_project_url');
   select vault.create_secret('<WEBHOOK_SECRET value>', 'backup_webhook_secret');
   ```
   Until both exist the trigger and the cron job do nothing (a submission is never blocked by the backup).

**How backups are triggered**
- **On submit:** the trigger `trg_backup_ppt_on_submit` (migration `09`) posts each new submission to the function.
- **Every 2 hours:** the `pg_cron` job `incubex-ppt-backup-sweep` (migration `08`, `0 */2 * * *`) calls the function with
  `{"sweep": true}`, which retries anything missing or failed. Check runs with:
  `select status, return_message, start_time from cron.job_run_details order by start_time desc limit 10;`

### Admin dashboard badge
Each submitted deck in `/admin` shows a badge under its "View deck" link: **Backed up** (green, hover shows the B2 file name),
**Backup pending** (amber), **Backup failed** (red, hover shows the error) or **Backup not started** (grey, no log row yet).
The Excel export has a matching "Backup" column. If migration `07` hasn't been run, the badges are simply hidden.

### Checking / retrying
- Status: `select team_id, backup_key, status, error from ppt_backups order by created_at desc;`
- Retry anything missing or failed right now (the schedule above does this automatically every 2 hours):
  ```bash
  curl -X POST https://<project-ref>.supabase.co/functions/v1/backup-ppt \
    -H "x-webhook-secret: <secret>" -H "Content-Type: application/json" -d '{"sweep": true}'
  ```
  A sweep handles up to 20 decks per call; run it again if more remain.

## Club OS API (`submissions-api`)

Integration guide for whoever connects Club OS to INCUBEX. The API is **read-only** and returns, for every team that has
submitted a deck: the Team ID, the upload date/time, and two temporary download links (the primary copy and the backup copy).

### Quick reference

| | |
|---|---|
| **Base URL** | `https://gxftluqkfouxdpcskzdq.supabase.co/functions/v1/submissions-api` |
| **Method** | `GET` (nothing else is accepted) |
| **Auth** | Header `x-api-key: <API_KEY>` (or `Authorization: Bearer <API_KEY>`) |
| **Format** | JSON (`application/json; charset=utf-8`), timestamps are ISO-8601 in **UTC** |
| **Hosted on** | Supabase Edge Functions, same project as the upload portal and database |

**Getting the API key:** ask the INCUBEX admin to send it to you privately (password manager, not chat/email/Git).
It is stored only as the Supabase function secret `API_KEY` and in the admin's gitignored `.env.api.local`.

### Request

```
GET /functions/v1/submissions-api
GET /functions/v1/submissions-api?team_id=INC-12345
GET /functions/v1/submissions-api?expires_in=86400
GET /functions/v1/submissions-api?team_id=INC-12345&expires_in=600
```

| Query parameter | Required | Meaning |
|---|---|---|
| `team_id` | no | Return only this team (case-insensitive, e.g. `inc-12345`). Allowed characters: letters, digits, `-`. Unknown team -> `count: 0`, not an error. |
| `expires_in` | no | Lifetime of `link_1`/`link_2` in **seconds**. Whole number from `60` to `604800` (7 days). Default `3600` (1 hour). |

### Response (`200 OK`)

```json
{
  "generated_at": "2026-10-06T15:44:07.730Z",
  "links_expire_in_seconds": 3600,
  "count": 2,
  "submissions": [
    {
      "team_id": "INC-12345",
      "uploaded_at": "2026-10-06T15:00:02.561Z",
      "link_1": "https://gxftluqkfouxdpcskzdq.supabase.co/storage/v1/object/sign/incubex-ppts/INC-12345_1791298800725.pdf?token=...",
      "link_2": "https://s3.us-east-005.backblazeb2.com/incubexbackupppts/INC-12345.pdf?X-Amz-Expires=3600&...",
      "backup_status": "success",
      "approval_status": "pending",
      "file_type": "pdf"
    },
    {
      "team_id": "INC-56789",
      "uploaded_at": "2026-10-06T12:35:02.481Z",
      "link_1": "https://...",
      "link_2": null,
      "backup_status": "pending",
      "approval_status": "approved",
      "file_type": "pptx"
    }
  ]
}
```

| Field | Type | Meaning |
|---|---|---|
| `generated_at` | string | When this response was produced (UTC). |
| `links_expire_in_seconds` | number | How long the links in **this** response stay valid. |
| `count` | number | Number of items in `submissions`. |
| `submissions[].team_id` | string | Team ID, e.g. `INC-12345`. Unique: one current submission per team. |
| `submissions[].uploaded_at` | string | When the team uploaded the deck (UTC). Use this as the "date/time uploaded". |
| `submissions[].link_1` | string \| null | **Link 1** - temporary signed link to the **primary** copy (Supabase Storage). |
| `submissions[].link_2` | string \| null | **Link 2** - temporary signed link to the **backup** copy (Backblaze B2). `null` until `backup_status` is `success`. |
| `submissions[].backup_status` | string | `success` (backup done), `pending` (in progress), `failed` (will be retried automatically every 2 hours), `none` (not started yet). |
| `submissions[].approval_status` | string | Organisers' review result: `pending`, `approved` or `rejected`. |
| `submissions[].file_type` | string | `pdf`, `ppt` or `pptx`. |

**Club OS fields.** Every item also carries `id`, `teamId`, `url` (`link_1`, else `link_2`), `fileName` (`<team_id>.<ext>`)
and `submittedAt`, and the same array is returned under `entries` as well as `submissions`. Club OS reads those names; the
original fields are unchanged. Club OS calls `GET /functions/v1/submissions-api?expires_in=86400&event=act-incubex` with
`Authorization: Bearer <API_KEY>` (the `event` parameter is ignored).

Notes:
- Results are sorted newest upload first. Teams that have **not** submitted are not listed. Maximum 2000 rows per call (far above the ~80 teams expected).
- Both links point to the **same deck**; `link_2` is simply the independent backup. Prefer `link_1`, fall back to `link_2` if it fails.
- If a team re-uploads after an organiser reset, the API returns only their **current** deck. Older versions stay in the B2 bucket
  (`INC-12345_v2.pdf`, ...) but are not exposed by the API.

### IMPORTANT: links are temporary

The storage buckets are private, so every link is a signed URL that **stops working** after `expires_in` seconds
(then it answers `400`/`401`/`403`). Therefore:
- **Do not store the links** in the Club OS database. Store the **Team ID**, and call this API whenever you need a fresh link.
- To show a "view/download" button, call the API (optionally with `?team_id=`) when the user clicks it and redirect to `link_1`.
- Links are not tied to the API key: anyone holding a link can open it until it expires. Don't log or share them.

### Errors

Error bodies look like `{ "error": "message" }`.

| Status | When | Fix |
|---|---|---|
| `401` | API key missing or wrong | Send the correct `x-api-key` header. |
| `400` | Invalid `team_id` or `expires_in` | See the parameter table above. |
| `405` | Method other than `GET` | Use `GET`. |
| `500` | Unexpected server error (details only in the function logs) | Retry shortly; tell the INCUBEX admin if it persists. |
| `403` with an empty body | Blocked by the Supabase gateway (e.g. a `team_id` containing SQL-like characters) | Send clean Team IDs only. |

### Code examples

**curl**
```bash
curl -H "x-api-key: $INCUBEX_API_KEY" \
  "https://gxftluqkfouxdpcskzdq.supabase.co/functions/v1/submissions-api"
```

**Node.js 18+ (server side)**
```js
const res = await fetch(
  "https://gxftluqkfouxdpcskzdq.supabase.co/functions/v1/submissions-api?expires_in=3600",
  { headers: { "x-api-key": process.env.INCUBEX_API_KEY } }
);
if (!res.ok) throw new Error(`INCUBEX API ${res.status}: ${(await res.json()).error}`);
const { submissions } = await res.json();
for (const s of submissions) {
  console.log(s.team_id, s.uploaded_at, s.link_1, s.link_2);
}
```

**Python**
```python
import os, requests

r = requests.get(
    "https://gxftluqkfouxdpcskzdq.supabase.co/functions/v1/submissions-api",
    headers={"x-api-key": os.environ["INCUBEX_API_KEY"]},
    params={"team_id": "INC-12345"},  # optional
    timeout=30,
)
r.raise_for_status()
for s in r.json()["submissions"]:
    print(s["team_id"], s["uploaded_at"], s["link_1"], s["link_2"])
```

### Security rules for the integrator
- Call the API from the **Club OS server (backend)**. **Never** put the key in browser/mobile code, a public repo, or a front-end bundle:
  anyone who can read the key can list every team's deck.
- Keep the key in an environment variable or secret manager (e.g. `INCUBEX_API_KEY`).
- The API sets `Cache-Control: no-store` - don't cache responses beyond the link lifetime.
- Browser calls are blocked by CORS by default. If Club OS truly must call it from a browser, the admin sets the secret
  `ALLOWED_ORIGIN` to that exact origin, but that exposes the key to visitors, so prefer a server call.
- Suspected leak? The admin rotates the key (below); the old key stops working immediately.

### Troubleshooting
- **Always 401:** header name must be `x-api-key` (case-insensitive); no quotes or spaces/newlines inside the value.
- **`link_2` is `null`:** the backup isn't finished (`backup_status` is `pending`/`failed`/`none`). Use `link_1` and retry later; failed backups are retried every 2 hours.
- **A link downloads an empty/0-byte file or errors:** it's expired or was truncated when copied. Request fresh links and copy the **full** URL
  (browser consoles shorten long strings with `...`, so use code or `curl` instead).
- **Team missing from the list:** they haven't submitted yet (or an organiser reset their submission).

### Operating it (admin)
- **Rotate / set the key:**
  ```bash
  openssl rand -hex 32                                     # generate a new key
  supabase secrets set API_KEY=<new key> --project-ref gxftluqkfouxdpcskzdq
  supabase functions deploy submissions-api --project-ref gxftluqkfouxdpcskzdq --no-verify-jwt
  ```
  Then give the new key to the Club OS integrator and update `.env.api.local`.
- **Code:** `supabase/functions/submissions-api/index.ts`. Logs: Supabase Dashboard -> Edge Functions -> `submissions-api` -> Logs.
- It reads the `submissions` and `ppt_backups` tables with the server-side role (grants in migration `10`) and needs the same B2 function
  secrets as the backup function (`B2_KEY_ID`, `B2_APP_KEY`, `B2_BUCKET`, `B2_ENDPOINT`).

## Styling System

- `src/styles/portal.css` is a bespoke CSS architecture built directly from the parent site's design tokens (`--ref-*` palette, glass surfaces, capsule styles). 
- **Do not use arbitrary Tailwind classes** (e.g., `pt-40`, `flex-col`) in JSX, as the pre-compiled stylesheet does not include a JIT compiler. Only use the existing `.portal-*` class names to maintain the glowing, dark-glass aesthetic.
