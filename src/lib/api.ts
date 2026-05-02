// Frontend API client for Firebase Functions backend.
// All endpoints are served behind /api/* (rewritten to the Cloud Function in firebase.json,
// proxied to the emulator in vite.config.ts during local dev).

export interface CoachInsights {
  headline: string;
  whats_wrong: string;
  root_causes: Array<{ cause: string; evidence: string; confidence: "low" | "medium" | "high" }>;
  peer_benchmark: string;
  actions: Array<{
    title: string;
    rationale: string;
    similar_case: string;
    expected_lift: string;
    effort: "low" | "medium" | "high";
    target_kpi: string;
  }>;
}

export async function getCoachInsights(dealerId: string): Promise<CoachInsights> {
  const res = await fetch("/api/coach-insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dealerId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}
