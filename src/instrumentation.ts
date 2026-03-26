/**
 * Next.js instrumentation hook — runs once when the server starts.
 * Used to schedule the LaTeX service keep-alive ping via node-cron.
 * Only runs in the Node.js runtime (not edge).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");

    const serviceUrl = process.env.LATEX_SERVICE_URL;
    if (!serviceUrl) {
      console.warn("[keep-alive] LATEX_SERVICE_URL not set — skipping cron.");
      return;
    }

    // Ping every 10 minutes to prevent Render free-tier spin-down
    cron.schedule("*/10 * * * *", async () => {
      const start = Date.now();
      try {
        const res = await fetch(`${serviceUrl}/health`, {
          signal: AbortSignal.timeout(10_000),
        });
        const latency = Date.now() - start;
        console.log(`[keep-alive] ✓ ${res.status} — ${latency}ms`);
      } catch (err) {
        const latency = Date.now() - start;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[keep-alive] ✗ ${msg} — ${latency}ms`);
      }
    });

    console.log("[keep-alive] Cron scheduled — pinging LaTeX service every 10 minutes.");
  }
}
