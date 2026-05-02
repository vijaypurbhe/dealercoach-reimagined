import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const LOVABLE_API_KEY = defineSecret("LOVABLE_API_KEY");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_INSIGHTS =
  "You are an AI coach for Mitsubishi Motors district managers. Help them shift from auditing to coaching dealers. Be specific, ground every claim in the provided data, and reference peer best practices. Avoid generic advice.";

const tools = [
  {
    type: "function",
    function: {
      name: "report_insights",
      description: "Return a coaching summary with root causes and ranked next-best actions.",
      parameters: {
        type: "object",
        properties: {
          headline: { type: "string" },
          whats_wrong: { type: "string" },
          root_causes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                cause: { type: "string" },
                evidence: { type: "string" },
                confidence: { type: "string", enum: ["low", "medium", "high"] },
              },
              required: ["cause", "evidence", "confidence"],
              additionalProperties: false,
            },
            minItems: 2,
            maxItems: 4,
          },
          peer_benchmark: { type: "string" },
          actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                rationale: { type: "string" },
                similar_case: { type: "string" },
                expected_lift: { type: "string" },
                effort: { type: "string", enum: ["low", "medium", "high"] },
                target_kpi: { type: "string" },
              },
              required: ["title", "rationale", "similar_case", "expected_lift", "effort", "target_kpi"],
              additionalProperties: false,
            },
            minItems: 3,
            maxItems: 5,
          },
        },
        required: ["headline", "whats_wrong", "root_causes", "peer_benchmark", "actions"],
        additionalProperties: false,
      },
    },
  },
];

export const coachInsights = onRequest(
  { secrets: [LOVABLE_API_KEY], cors: true, timeoutSeconds: 60, memory: "512MiB" },
  async (req, res) => {
    res.set(CORS);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST")    { res.status(405).json({ error: "Method not allowed" }); return; }

    try {
      const { packet } = req.body ?? {};
      if (!packet) { res.status(400).json({ error: "Missing dealer packet" }); return; }

      const apiKey = LOVABLE_API_KEY.value();
      if (!apiKey) { res.status(500).json({ error: "LOVABLE_API_KEY is not configured" }); return; }

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_INSIGHTS },
            { role: "user", content: `Analyze this dealer and produce coaching insights.\n\nDATA:\n${JSON.stringify(packet, null, 2)}` },
          ],
          tools,
          tool_choice: { type: "function", function: { name: "report_insights" } },
        }),
      });

      if (resp.status === 429) { res.status(429).json({ error: "Rate limit reached. Please try again shortly." }); return; }
      if (resp.status === 402) { res.status(402).json({ error: "AI credits exhausted." }); return; }
      if (!resp.ok)            { console.error("AI gateway error", resp.status, await resp.text()); res.status(500).json({ error: "AI gateway error" }); return; }

      const json: any = await resp.json();
      const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) { res.status(502).json({ error: "AI did not return structured insights" }); return; }

      res.status(200).type("application/json").send(args);
    } catch (e) {
      console.error("coachInsights error", e);
      res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
    }
  }
);

export const coachChat = onRequest(
  { secrets: [LOVABLE_API_KEY], cors: true, timeoutSeconds: 120, memory: "512MiB" },
  async (req, res) => {
    res.set(CORS);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST")    { res.status(405).json({ error: "Method not allowed" }); return; }

    try {
      const { packet, messages } = req.body ?? {};
      if (!packet || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: "Missing packet or messages" }); return;
      }

      const apiKey = LOVABLE_API_KEY.value();
      if (!apiKey) { res.status(500).json({ error: "LOVABLE_API_KEY is not configured" }); return; }

      const system = `You are an AI coach helping a Mitsubishi district manager think through one specific dealer's performance. Be conversational, concise, and grounded in the data below. Use markdown for structure when helpful.\n\nDEALER DATA:\n${JSON.stringify(packet)}`;

      const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: system }, ...messages],
          stream: true,
        }),
      });

      if (upstream.status === 429) { res.status(429).json({ error: "Rate limit reached." }); return; }
      if (upstream.status === 402) { res.status(402).json({ error: "AI credits exhausted." }); return; }
      if (!upstream.ok || !upstream.body) {
        console.error("AI gateway error", upstream.status, await upstream.text().catch(() => ""));
        res.status(500).json({ error: "AI gateway error" }); return;
      }

      res.status(200);
      res.set("Content-Type", "text/event-stream");
      res.set("Cache-Control", "no-cache, no-transform");
      res.set("X-Accel-Buffering", "no");

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
    } catch (e) {
      console.error("coachChat error", e);
      if (!res.headersSent) {
        res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
      } else {
        res.end();
      }
    }
  }
);
