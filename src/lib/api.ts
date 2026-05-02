import { supabase } from "@/integrations/supabase/client";
import { getDealer } from "@/data/dealers";
import { buildDealerPacket } from "@/lib/dealerPacket";

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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export async function getCoachInsights(dealerId: string): Promise<CoachInsights> {
  const dealer = getDealer(dealerId);
  if (!dealer) throw new Error("Dealer not found");
  const packet = buildDealerPacket(dealer);

  const { data, error } = await supabase.functions.invoke("coach-insights", { body: { packet } });
  if (error) throw new Error(error.message ?? "Failed to load insights");
  return data as CoachInsights;
}

export async function streamCoachChat(opts: {
  dealerId: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  onDelta: (chunk: string) => void;
}): Promise<void> {
  const dealer = getDealer(opts.dealerId);
  if (!dealer) throw new Error("Dealer not found");
  const packet = buildDealerPacket(dealer);

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/coach-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ packet, messages: opts.messages }),
  });

  if (!resp.ok || !resp.body) {
    let msg = `Chat failed (${resp.status})`;
    try {
      const j = await resp.json();
      if (j?.error) msg = j.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let streamDone = false;

  while (!streamDone) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(json);
        const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (delta) opts.onDelta(delta);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
}
