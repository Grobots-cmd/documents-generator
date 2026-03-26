# Tasks: Keep-Alive Cron + Bug Fixes

- [x] 1. Create `src/app/api/keep-alive/route.ts`
- [x] 2. Create `vercel.json` with cron schedule
- [x] 3. Add `CRON_SECRET` to `.env.example`
- [x] 4. Fix BUG-01: remove duplicate NextAuth handler in `src/lib/auth.ts`
- [x] 5. Fix BUG-03: run pdflatex twice in `latex-service/index.js`
- [x] 6. Fix BUG-05: remove `institution_full: ""` from event write-up page
- [x] 7. Fix BUG-06: replace Import CSV link with inline dialog in admin members page
- [x] 8. Fix BUG-07: remove dead forgot-password link from login page
- [x] 9. Fix BUG-08: add `department` to CSV required columns
- [x] 10. Fix BUG-02: atomic ref number generation via Prisma transaction
- [x] 11. Fix BUG-10: create `src/proxy.ts` for route protection
