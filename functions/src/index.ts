import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { callAi, streamAi, dealerDataPacket } from "./ai.js";
// NOTE: dealers data is duplicated server-side. After porting, copy
// src/data/dealers.ts + types.ts into functions/src/data/ as plain JS or
// re-export from a shared module published to your private registry.
import { DEALERS, getDealer } from "./data/dealers.js";

const LOVABLE_API_KEY = defineSecret("LOVABLE_API_KEY");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

const idSchema = z.object({ dealerId: z.string().min(1).max(64) });

app.post("/coach-insights", async (req, res) => {
  try {
    const { dealerId } = idSchema.parse(req.body);
    const dealer = getDealer(dealerId);
    if (!dealer) return res.status(404).json({ error: "Dealer not found" });
    const peers = DEALERS.filter((d) => dealer.peerIds.includes(d.id));
    const packet = dealerDataPacket(dealer, peers);

    const tools = [{
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
                  cause: { type: "string" }, evidence: { type: "string" },
                  confidence: { type: "string", enum: ["low", "medium", "high"] },
                },
                required: ["cause", "evidence", "confidence"],
                additionalProperties: false,
              },
              minItems: 2, maxItems: 4,
            },
            peer_benchmark: { type: "string" },
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" }, rationale: { type: "string" },
                  similar_case: { type: "string" }, expected_lift: { type: "string" },
                  effort: { type: "string", enum: ["low", "medium", "high"] },
                  target_kpi: { type: "string" },
                },
                required: ["title", "rationale", "similar_case", "expected_lift", "effort", "target_kpi"],
                additionalProperties: false,
              },
              minItems: 3, maxItems: 5,
            },
          },
          required: ["headline", "whats_wrong", "root_causes", "peer_benchmark", "actions"],
          additionalProperties: false,
        },
      },
    }];

    const system = "You are an AI coach for Mitsubishi Motors district managers. Help them shift from auditing to coaching dealers. Be specific, ground every claim in the provided data, and reference peer best practices. Avoid generic advice.";
    const user = `Analyze this dealer and produce coaching insights.\n\nDATA:\n${JSON.stringify(packet, null, 2)}`;

    const result = await callAi({
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      tools,
      tool_choice: { type: "function", function: { name: "report_insights" } },
    });
    const call = result?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) return res.status(502).json({ error: "AI did not return structured insights" });
    return res.json(JSON.parse(call.function.arguments));
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e?.message ?? "Server error" });
  }
});

const chatBody = z.object({
  dealerId: z.string().min(1).max(64),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(4000),
  })).min(1).max(40),
});

app.post("/coach-chat", async (req, res) => {
  let body: z.infer<typeof chatBody>;
  try { body = chatBody.parse(req.body); }
  catch { return res.status(400).json({ error: "Invalid request" }); }

  const dealer = getDealer(body.dealerId);
  if (!dealer) return res.status(404).json({ error: "Dealer not found" });
  const peers = DEALERS.filter((d) => dealer.peerIds.includes(d.id));
  const packet = dealerDataPacket(dealer, peers);

  const system = `You are an AI coach helping a Mitsubishi district manager think through one specific dealer's performance. Be conversational, concise, and grounded in the data below. Use markdown for structure when helpful.\n\nDEALER DATA:\n${JSON.stringify(packet)}`;

  try {
    const upstream = await streamAi({
      messages: [{ role: "system", content: system }, ...body.messages],
    });
    if (!upstream.ok || !upstream.body) {
      return res.status(upstream.status).json({ error: "AI service error" });
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "AI error" });
  }
});

export const api = onRequest({ secrets: [LOVABLE_API_KEY], region: "us-central1" }, app);
