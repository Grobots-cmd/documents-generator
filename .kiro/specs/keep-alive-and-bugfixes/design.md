# Design: Keep-Alive Cron + Bug Fixes

## 1. Keep-Alive API

### Route: `src/app/api/keep-alive/route.ts`
- Runtime: `nodejs` (default) — edge runtime excluded because `LATEX_SERVICE_URL` env var access and `AbortSignal.timeout` are both fine on Node.js; edge would add unnecessary constraints
- Method: `GET`
- Auth: reads `Authorization` header from the incoming request, compares to `Bearer ${CRON_SECRET}`
- Flow: fetch `${LATEX_SERVICE_URL}/health` with a 10-second timeout → return latency + body
- Error path: if fetch throws or service returns non-2xx, return `{ ok: false, error, latency_ms }` with status 502

### Cron: `vercel.json`
```json
{ "crons": [{ "path": "/api/keep-alive", "schedule": "*/10 * * * *" }] }
```
Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on cron invocations when `CRON_SECRET` is set in the project environment.

---

## 2. Bug Fix Designs

### BUG-01 — Duplicate NextAuth handler (`src/lib/auth.ts`)
Remove the final `export default NextAuth(authOptions)` line. The App Router only needs the named `GET`/`POST` exports from the `[...nextauth]` route file. The `authOptions` export is used by `getServerSession` elsewhere and is unaffected.

### BUG-03 — Single pdflatex pass (`latex-service/index.js`)
Extract `runLatex` call into a helper and call it twice sequentially before reading the PDF. The second pass resolves `\ref`, `\label`, TOC entries, etc.

### BUG-05 — `institution_full: ""` in event write-up
Remove `institution_full: ""` from the `eventDetails` object in the fetch payload. The server already injects `institution_full` via `settingsVars` from `GlobalSettings`.

### BUG-06 — Import CSV 404
Replace the `<Link href="/admin/members/import">` button with a Dialog that contains a file input and posts `multipart/form-data` directly to `/api/members/import`. Uses shadcn `Dialog` already present in the project.

### BUG-07 — Forgot password 404
Remove the `<a href="/reset-password">` anchor from `login/page.tsx`. A comment is left noting it should be re-added when the reset flow is implemented.

### BUG-08 — Missing `department` in CSV required columns
Add `"department"` to the `REQUIRED_COLUMNS` array in `src/app/api/members/import/route.ts`.

### BUG-02 — Ref number race condition (`src/lib/ref-number.ts`)
Use `prisma.$transaction` with a raw `SELECT ... FOR UPDATE` or restructure to a single atomic `UPDATE ... RETURNING` via `$executeRawUnsafe`. Since Prisma doesn't support `SELECT FOR UPDATE` natively, use `$transaction` with `update` (Prisma serializes writes within a transaction). The year-reset case also uses `upsert` to handle a missing singleton.

### BUG-10 — Route protection (`proxy.ts`)
Create `src/proxy.ts` (Next.js 16 uses `proxy.ts` — `middleware.ts` is deprecated). Export a `proxy` function that:
1. Checks for the NextAuth session cookie (`next-auth.session-token` or `__Secure-next-auth.session-token`)
2. If missing and path matches protected routes, redirects to `/login?callbackUrl=<path>`
3. Matcher excludes `/api/*`, `/_next/*`, `/login`, `/register`, static files

---

## 3. File Change Summary

| File | Change |
|------|--------|
| `src/app/api/keep-alive/route.ts` | New |
| `vercel.json` | New |
| `.env.example` | Add `CRON_SECRET` |
| `src/lib/auth.ts` | Remove duplicate `export default` |
| `latex-service/index.js` | Run pdflatex twice |
| `src/app/(app)/generate/event-writeup/page.tsx` | Remove `institution_full: ""` |
| `src/app/(app)/admin/members/page.tsx` | Replace Link with import Dialog |
| `src/app/login/page.tsx` | Remove dead forgot-password link |
| `src/app/api/members/import/route.ts` | Add `department` to required columns |
| `src/lib/ref-number.ts` | Atomic transaction for counter |
| `src/proxy.ts` | New — route protection |
