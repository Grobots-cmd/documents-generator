/**
 * Next.js instrumentation hook — runs once when the server starts.
 * 1. Seeds the database if it's empty (safe to run on every cold start).
 * 2. Schedules the LaTeX service keep-alive ping via node-cron.
 * Only runs in the Node.js runtime (not edge).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // ── 1. Auto-seed on first boot ──────────────────────────────────────────
    try {
      const { runSeedIfEmpty } = await import("@/lib/seed-runtime");
      await runSeedIfEmpty();
    } catch (err) {
      console.error("[instrumentation] Seed check failed:", err);
    }

    // ── 2. Keep-alive cron ──────────────────────────────────────────────────
    const serviceUrl = process.env.LATEX_SERVICE_URL;
    if (serviceUrl) {
      const cron = await import("node-cron");
      cron.schedule("*/10 * * * *", async () => {
        const start = Date.now();
        try {
          const res = await fetch(`${serviceUrl}/health`, {
            signal: AbortSignal.timeout(10_000),
          });
          console.log(`[keep-alive] ✓ ${res.status} — ${Date.now() - start}ms`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[keep-alive] ✗ ${msg} — ${Date.now() - start}ms`);
        }
      });
      console.log("[keep-alive] Cron scheduled — pinging LaTeX service every 10 minutes.");
    }
  }
}
