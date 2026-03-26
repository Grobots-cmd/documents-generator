# Project Audit & Implementation Spec
**SRMCEM Robotics Club — Document Generator**
Generated: 2026-03-26

---

## 1. Project Overview

A Next.js 16.2.1 full-stack app for generating official club documents (certificates, letters, write-ups) as PDFs via a LaTeX microservice hosted on Render. Role-based access: Admin, Coordinator, Member. Documents are compiled by an Express + pdflatex service, uploaded to Cloudinary, and logged immutably.

---

## 2. Bugs Found

### 2.1 Critical

**[BUG-01] `auth.ts` exports a duplicate NextAuth handler**
`src/lib/auth.ts` calls `NextAuth(authOptions)` twice — once for the named export and once for `export default`. This creates two separate handler instances, which can cause session inconsistencies.
```ts
// Line at bottom of auth.ts — WRONG
export default NextAuth(authOptions); // second instantiation
```
Fix: remove the `export default` line. The App Router only needs `handler as GET` and `handler as POST`.

---

**[BUG-02] `generateRefNumber` has a race condition**
`src/lib/ref-number.ts` reads `GlobalSettings`, checks the year, then does a separate `update`. Between the read and the write, two concurrent requests can both read the same counter value and produce duplicate reference numbers.
Fix: use a single atomic `$executeRaw` or a Prisma transaction with `SELECT ... FOR UPDATE`, or use a database sequence.

---

**[BUG-03] LaTeX service runs `pdflatex` only once**
`latex-service/index.js` runs `pdflatex` a single time. Documents with cross-references, tables of contents, or `\ref{}` commands will produce incorrect output (unresolved references show as `??`). The comment in the code even says "Run pdflatex twice for proper cross-references" but the second run is never implemented.
Fix: call `runLatex` twice sequentially before reading the PDF.

---

**[BUG-04] `MemberSelect` fetches all members on every page load with no cache invalidation**
`fetchMembers` in `MemberSelect.tsx` always hits `/api/members?status=ACTIVE` with a 30-second stale time. If a member is approved between page loads, the dropdown won't reflect it until the stale window expires. More importantly, the query key `["members"]` is shared across all generate pages — if one page mutates members, all pages get stale data simultaneously.
Fix: add `refetchOnWindowFocus: true` or a manual invalidation trigger, and scope the query key.

---

**[BUG-05] `event-writeup` page sends `institution_full: ""` hardcoded**
In `src/app/(app)/generate/event-writeup/page.tsx`, `institution_full` is sent as an empty string:
```ts
institution_full: "",
```
This means the `{{institution_full}}` placeholder in the template will always be blank. The value should come from `GlobalSettings.institutionFull` (which is already injected server-side in `settingsVars`), so this client-side override is wrong and should be removed from `eventDetails`.

---

**[BUG-06] `admin/members` page links to `/admin/members/import` which doesn't exist**
The Import CSV button links to `/admin/members/import` but there is no page at that route — only an API route at `/api/members/import`. This will 404.
Fix: either create the import page or change the button to open a dialog/modal that posts to the API directly.

---

**[BUG-07] `login/page.tsx` links to `/reset-password` which doesn't exist**
The "Forgot password?" link points to `/reset-password`. There is no such page in the project. The `resetToken` and `resetExpires` fields exist in the schema but the flow is never implemented.
Fix: either implement the reset flow or remove the link until it's built.

---

**[BUG-08] `members/import/route.ts` — `department` column not in `REQUIRED_COLUMNS`**
The import route requires `full_name, roll_number, branch, year, dob, email` but `department` is a required field on the `Member` model (non-nullable `String`). If the CSV doesn't have a `department` column, it silently falls back to `""` (empty string), which passes DB validation but produces bad data.
Fix: add `"department"` to `REQUIRED_COLUMNS`.

---

### 2.2 Medium Priority

**[BUG-09] `quiz-prorate` page doesn't send `memberSubjects` to the API**
The per-member subject mapping (`quizDates[].memberSubjects`) is collected in the form but never included in the `eventDetails` payload sent to `/api/generate`. The LaTeX template for `QUIZ_PRORATE` presumably needs this data to fill per-member subject rows.
Fix: serialize `memberSubjects` into `eventDetails` before the fetch call.

---

**[BUG-10] No middleware / route protection on `(app)` routes**
The `(app)` layout renders the sidebar and content but has no server-side auth check. An unauthenticated user who navigates directly to `/dashboard` will see the page render (briefly) before client-side `useSession` redirects. This is a UX and minor security gap.
Fix: add a `middleware.ts` at the root that protects `/dashboard`, `/generate/*`, and `/admin/*` routes using NextAuth's `withAuth`.

---

**[BUG-11] `cloudinary.ts` returns `secure_url` (permanent) not a signed URL**
`uploadPdfToCloudinary` resolves with `result.secure_url`, which is a permanent public URL. The `getSignedUrl` helper exists but is never called. PDFs are sensitive official documents and should not be permanently publicly accessible.
Fix: either use signed URLs in the generation response, or set `type: "authenticated"` on upload and always serve via signed URLs.

---

**[BUG-12] `ref-number.ts` doesn't handle missing `GlobalSettings` gracefully**
If `GlobalSettings` doesn't exist (fresh DB, no seed run), `counter` stays `1` and no update is made, so every document gets ref number `...0001` forever.
Fix: use `upsert` to create the singleton if it doesn't exist.

---

**[BUG-13] `validators.ts` — `loginSchema` minimum password is 6 chars, `createUserSchema` requires 8**
Inconsistency: a user created with an 8-char password can log in fine, but if someone tries to log in with a 6-char password the login form accepts it while the backend rejects it. Not a security bug per se, but confusing UX.
Fix: align both to 8 characters minimum.

---

**[BUG-14] `AppLayout` has no auth guard — MEMBER role can access generate pages**
The generate routes only check `COORDINATOR | ADMIN` at the API level. A logged-in MEMBER can navigate to `/generate/congratulations` and see the full form. The API will reject the submission, but the UI should not show these pages to MEMBERs.
Fix: check role in the layout or per-page and redirect MEMBERs to a "pending approval" screen.

---

### 2.3 Low Priority

**[BUG-15] `next.config.ts` is empty**
No `images` domains, no `headers`, no `rewrites`. At minimum, Cloudinary's domain should be added to `images.remotePatterns` for future use, and security headers (CSP, X-Frame-Options) should be set.

---

**[BUG-16] `latex-service` has no `helmet` or rate limiting**
The Express service has no security middleware. If the `API_KEY` env var is not set, the service is completely open. Even with a key, there's no rate limiting to prevent abuse.

---

**[BUG-17] `prisma/seed.ts` not reviewed but `GlobalSettings` singleton may not be seeded**
If the seed doesn't create the `GlobalSettings` singleton, the generate API will return `500: "Global settings not configured"` on a fresh deployment.

---

## 3. Improvements & Missing Features

### 3.1 High Value

- **Password reset flow** — `resetToken` / `resetExpires` fields exist but the entire flow (request email → send token → verify → update password) is unimplemented. `RESEND_API_KEY` and `EMAIL_FROM` env vars are defined but unused.
- **Route middleware** — Add `middleware.ts` for auth-based redirects instead of relying on client-side session checks.
- **Pagination UI** — The audit log API supports pagination (`page`, `limit`) but no UI exists for it. The admin members page also has no pagination.
- **Template editor UI** — There's no admin page to view/edit LaTeX templates. The API exists but there's no frontend for it.
- **Settings page** — No UI for `GlobalSettings` management despite the API being complete.
- **Users/Coordinators management page** — `/api/users` is complete but no admin UI exists.
- **"Recent Documents" on dashboard** — The section renders a static empty state. It should query `/api/audit-log` and show the last 5 documents.

### 3.2 Medium Value

- **`generateBoth` flag on event write-up** — The form has a `generateBoth` checkbox (generate EN + HI simultaneously) but the API only handles one `docType` per request. Either implement parallel generation or remove the checkbox.
- **Individual letters for late-stay** — `individualLetters` boolean exists in the schema but is never used in the API call.
- **Member profile page** — Members can register but have no way to update their subjects or profile after registration.
- **Audit log UI** — No page exists to view generation history despite the API being complete.
- **CSV import UI** — The import API is solid but there's no frontend page.

### 3.3 Low Value

- **Design system alignment** — `MASTER.md` specifies a red/gold light theme but the app uses a dark cyan/blue theme. The design system file appears auto-generated and doesn't match the actual implementation. Either update the design system doc or align the app.
- **`lucide-react@1.7.0`** — This is an unusually high version number (latest stable as of early 2026 is ~0.460). Verify this resolves correctly; it may be a pre-release.
- **`@base-ui/react`** — Installed but not used anywhere in the codebase. Remove to reduce bundle size.
- **`nodemailer`** — Installed but unused (Resend API is configured instead). Remove.
- **`tw-animate-css`** — Installed but usage not confirmed. Audit and remove if unused.

---

## 4. LaTeX Service Keep-Alive API — Implementation Spec

### 4.1 Problem

Render's free tier spins down instances after ~15 minutes of inactivity. The LaTeX service at `LATEX_SERVICE_URL` needs periodic traffic to stay warm. The `/health` endpoint is the right target — it's lightweight (no DB, no disk I/O, just `{ status: "ok" }`).

### 4.2 Solution

Add a Next.js API route `/api/keep-alive` that:
1. Pings `LATEX_SERVICE_URL/health` with a GET request
2. Returns the result (status + latency)
3. Is called on a schedule via a **Vercel Cron Job** every 10 minutes

### 4.3 Files to Create / Modify

#### `src/app/api/keep-alive/route.ts` (new)

```ts
import { NextResponse } from "next/server";

export const runtime = "edge"; // lightweight, fast cold start

export async function GET(req: Request) {
  // Protect from arbitrary external calls — Vercel sends this header on cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceUrl = process.env.LATEX_SERVICE_URL;
  if (!serviceUrl) {
    return NextResponse.json({ error: "LATEX_SERVICE_URL not configured" }, { status: 500 });
  }

  const start = Date.now();
  try {
    const res = await fetch(`${serviceUrl}/health`, {
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });
    const latency = Date.now() - start;
    const body = await res.json();

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      latency_ms: latency,
      service: body,
      pinged_at: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
      latency_ms: Date.now() - start,
      pinged_at: new Date().toISOString(),
    }, { status: 502 });
  }
}
```

#### `vercel.json` (new)

```json
{
  "crons": [
    {
      "path": "/api/keep-alive",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

#### `.env.example` additions

```env
# ─── Cron Security ────────────────────────────────────────────────────────────
CRON_SECRET="your-random-cron-secret-32-chars"
```

### 4.4 Notes

- `CRON_SECRET` must be set in Vercel environment variables and match the value Vercel sends in the `Authorization: Bearer <secret>` header on cron invocations.
- Vercel Cron Jobs are available on the free Hobby plan (max 2 crons, minimum interval 1 minute).
- The `*/10 * * * *` schedule fires every 10 minutes, well within Render's 15-minute spin-down window.
- The route uses `runtime = "edge"` to minimize cold start latency on Vercel's side.
- No auth is needed to hit the LaTeX `/health` endpoint itself (it's already public per `latex-service/index.js` — the API key middleware only applies to `/compile`).

---

## 5. Priority Order for Fixes

| Priority | Item |
|----------|------|
| P0 | BUG-01: Duplicate NextAuth handler |
| P0 | BUG-03: pdflatex single pass |
| P0 | BUG-05: `institution_full` hardcoded empty |
| P0 | BUG-06: Import CSV 404 |
| P0 | BUG-07: Reset password 404 |
| P1 | BUG-02: Ref number race condition |
| P1 | BUG-08: `department` not in required CSV columns |
| P1 | BUG-09: Quiz pro-rate subject mapping not sent |
| P1 | BUG-10: No route middleware |
| P1 | BUG-11: Cloudinary permanent public URLs |
| P2 | BUG-12 through BUG-14 |
| P3 | BUG-15 through BUG-17 |
| — | Keep-alive cron (new feature, ready to implement) |
