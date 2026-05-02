// Dev-only Vite plugin: serves /api/coach-insights and /api/coach-chat directly
// using LOVABLE_API_KEY from the environment. This is for previewing inside Lovable
// (where the Firebase Functions emulator is not running). In production, firebase.json
// rewrites /api/** to the deployed Cloud Function and this plugin is not used.

import type { Plugin, Connect } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { DEALERS, getDealer } from "./src/data/dealers";

const ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";

function dealerDataPacket(dealer: any, peers: any[]) {
  const last = dealer.history[dealer.history.length - 1];
  const first = dealer.history[0];
  const lastQuarter = dealer.history.slice(-3);
  const peerLast = peers.map((p: any) => p.history[p.history.length - 1]);
  const peerAvg = (k: string) =>
    peerLast.reduce((s: number, r: any) => s + r[k], 0) / Math.max(1, peerLast.length);
  const kpis = ["retention1y", "retention7y", "partsSales", "accessorySales", "csi", "warrantyLeakage"];
  const snapshot = kpis.map((k) => ({
    kpi: k,
    current: last[k],
    yoyDelta: Math.round((last[k] - first[k]) * 10) / 10,
    last3moAvg: Math.round((lastQuarter.reduce((s: number, p: any) => s + p[k], 0) / 3) * 10) / 10,
    peerAvg: Math.round(peerAvg(k) * 10) / 10,
  }));
  return {
    dealer: {
      name: dealer.name, city: dealer.city, state: dealer.state,
      region: dealer.region, sizeBand: dealer.sizeBand, modelMix: dealer.modelMix,
    },
    kpis: snapshot,
    context: dealer.context,
    recentActions: (dealer.actions ?? []).slice(0, 8).map((a: any) => ({
      date: a.date, title: a.title, category: a.category, outcome: a.outcome, liftPct: a.liftPct,
    })),
    peerHistoricalActions: peers.flatMap((p: any) =>
      (p.actions ?? []).filter((a: any) => a.outcome === "worked").slice(0, 3).map((a: any) => ({
        peer: p.name, title: a.title, category: a.category, liftPct: a.liftPct,
      })),
    ),
  };
}

function readJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

const insightsTool = [{
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

export function devApiPlugin(): Plugin {
  return {
    name: "dev-api",
    configureServer(server) {
      const middleware: Connect.NextHandleFunction = async (req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/")) return next();
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return send(res, 500, { error: "LOVABLE_API_KEY missing in dev environment" });

        try {
          const body = await readJson(req);

          if (url.startsWith("/api/coach-insights")) {
            const dealer = getDealer(body.dealerId);
            if (!dealer) return send(res, 404, { error: "Dealer not found" });
            const peers = DEALERS.filter((d) => dealer.peerIds.includes(d.id));
            const packet = dealerDataPacket(dealer, peers);
            const system = "You are an AI coach for Mitsubishi Motors district managers. Help them shift from auditing to coaching dealers. Be specific, ground every claim in the provided data, and reference peer best practices. Avoid generic advice.";
            const user = `Analyze this dealer and produce coaching insights.\n\nDATA:\n${JSON.stringify(packet, null, 2)}`;
            const upstream = await fetch(ENDPOINT, {
              method: "POST",
              headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [{ role: "system", content: system }, { role: "user", content: user }],
                tools: insightsTool,
                tool_choice: { type: "function", function: { name: "report_insights" } },
              }),
            });
            if (!upstream.ok) {
              const t = await upstream.text();
              return send(res, upstream.status, { error: `AI gateway: ${t.slice(0, 200)}` });
            }
            const json: any = await upstream.json();
            const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
            if (!args) return send(res, 502, { error: "AI did not return structured insights" });
            return send(res, 200, JSON.parse(args));
          }

          if (url.startsWith("/api/coach-chat")) {
            const dealer = getDealer(body.dealerId);
            if (!dealer) return send(res, 404, { error: "Dealer not found" });
            const peers = DEALERS.filter((d) => dealer.peerIds.includes(d.id));
            const packet = dealerDataPacket(dealer, peers);
            const system = `You are an AI coach helping a Mitsubishi district manager think through one specific dealer's performance. Be conversational, concise, and grounded in the data below. Use markdown for structure when helpful.\n\nDEALER DATA:\n${JSON.stringify(packet)}`;
            const upstream = await fetch(ENDPOINT, {
              method: "POST",
              headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [{ role: "system", content: system }, ...(body.messages ?? [])],
                stream: true,
              }),
            });
            if (!upstream.ok || !upstream.body) {
              const t = await upstream.text().catch(() => "");
              return send(res, upstream.status || 502, { error: `AI gateway: ${t.slice(0, 200)}` });
            }
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            const reader = upstream.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              res.write(decoder.decode(value, { stream: true }));
            }
            return res.end();
          }

          return send(res, 404, { error: "Unknown API route" });
        } catch (e: any) {
          return send(res, 500, { error: e?.message ?? "Server error" });
        }
      };
      // Insert BEFORE Vite's built-in proxy so we short-circuit the broken emulator proxy.
      server.middlewares.use(middleware);
    },
  };
}
