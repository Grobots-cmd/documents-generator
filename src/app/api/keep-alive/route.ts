import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceUrl = process.env.LATEX_SERVICE_URL;
  if (!serviceUrl) {
    return Response.json({ error: "LATEX_SERVICE_URL not configured" }, { status: 500 });
  }

  const start = Date.now();
  try {
    const res = await fetch(`${serviceUrl}/health`, {
      signal: AbortSignal.timeout(10_000),
    });
    const latency_ms = Date.now() - start;
    const body = await res.json();

    return Response.json({
      ok: res.ok,
      status: res.status,
      latency_ms,
      service: body,
      pinged_at: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
        latency_ms: Date.now() - start,
        pinged_at: new Date().toISOString(),
      },
      { status: 502 }
    );
  }
}
