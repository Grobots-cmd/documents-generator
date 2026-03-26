# Requirements: Keep-Alive Cron + Bug Fixes

## 1. Keep-Alive API for Render Free Tier

**REQ-01** The system shall expose a `GET /api/keep-alive` route that pings the LaTeX service `/health` endpoint.

**REQ-02** The keep-alive route shall be protected by a `CRON_SECRET` environment variable checked against the `Authorization: Bearer <secret>` header, so arbitrary external callers cannot trigger it.

**REQ-03** The route shall return JSON with: `ok` (boolean), `status` (HTTP status of the health response), `latency_ms` (round-trip time), `service` (the health response body), and `pinged_at` (ISO timestamp).

**REQ-04** A `vercel.json` cron job shall call `/api/keep-alive` every 10 minutes (`*/10 * * * *`) to keep the Render free-tier instance warm.

**REQ-05** The `.env.example` file shall document the `CRON_SECRET` variable.

---

## 2. Bug Fixes

**REQ-06** `src/lib/auth.ts` shall not instantiate `NextAuth` twice. The redundant `export default NextAuth(authOptions)` line shall be removed.

**REQ-07** `latex-service/index.js` shall run `pdflatex` twice sequentially so cross-references and multi-pass macros resolve correctly.

**REQ-08** `src/app/(app)/generate/event-writeup/page.tsx` shall not send `institution_full: ""` in `eventDetails`; the field is already injected server-side from `GlobalSettings` and the client-side override must be removed.

**REQ-09** The admin members "Import CSV" button shall not link to a non-existent page. It shall open an inline dialog/modal that posts directly to `/api/members/import`.

**REQ-10** The "Forgot password?" link on the login page shall be removed (or hidden) until the password-reset flow is implemented, to prevent a dead 404 link.

**REQ-11** `src/app/api/members/import/route.ts` shall include `"department"` in `REQUIRED_COLUMNS` since it is a non-nullable field on the `Member` model.

**REQ-12** `src/lib/ref-number.ts` shall use a Prisma transaction to atomically read-and-increment the counter, eliminating the race condition that can produce duplicate reference numbers.

**REQ-13** A `proxy.ts` file (Next.js 16 convention — replaces deprecated `middleware.ts`) shall protect the `(app)` routes (`/dashboard`, `/generate/*`, `/admin/*`) by redirecting unauthenticated requests to `/login`.
