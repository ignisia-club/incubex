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
3. Run all `supabase/migrations/` files in order (`00_` to `06_`) inside the Supabase SQL editor.
4. Start the app: `npm run dev` (Opens at http://localhost:5173).

### 2. Testing the Upload Portal
Go to `http://localhost:5173/upload`. 
- **Valid Dummy Team IDs:** Use `INC-12345`, `INC-56789`, or `INC-99999` (seeded in migration `02`).
- **Test Upload:** Enter `INC-12345`, upload a PDF, and hit Submit.
- **Test Appeal:** Refresh the page and try entering `INC-12345` again. The system will detect the existing submission and prompt you with the Appeal form instead of the file drop!

### 3. Testing the Admin Dashboard
Go to `http://localhost:5173/admin`.
- **Username:** `admin@ignisia.tech`
- **Password:** `IncubexAdmin2026!`
*(Note: These credentials were securely injected via `pgcrypto` in migration `03`).*

Once inside:
- Try filtering by "Pending" or "Not Submitted".
- Approve or reject a submission.
- Click the "Trash" icon on a submission to reset it, then check the Upload page to see if that team can upload again.
- Click the **Export** button and open the resulting Excel file to test the generated Pitch Deck links.

## Styling System

- `src/styles/portal.css` is a bespoke CSS architecture built directly from the parent site's design tokens (`--ref-*` palette, glass surfaces, capsule styles). 
- **Do not use arbitrary Tailwind classes** (e.g., `pt-40`, `flex-col`) in JSX, as the pre-compiled stylesheet does not include a JIT compiler. Only use the existing `.portal-*` class names to maintain the glowing, dark-glass aesthetic.
