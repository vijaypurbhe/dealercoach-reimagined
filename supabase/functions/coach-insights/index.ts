// Coach Insights edge function — calls Lovable AI Gateway with structured tool output.
// The client posts a pre-built data packet (dealer + peers summary). The system prompt
// stays here on the server.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are an AI coach for Mitsubishi Motors district managers. Help them shift from auditing to coaching dealers. Be specific, ground every claim in the provided data, and reference peer best practices. Avoid generic advice.`;

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
}];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { packet } = await req.json();
    if (!packet) {
      return new Response(JSON.stringify({ error: "Missing dealer packet" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Analyze this dealer and produce coaching insights.\n\nDATA:\n${JSON.stringify(packet, null, 2)}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "report_insights" } },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits to your Lovable workspace." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await resp.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      return new Response(JSON.stringify({ error: "AI did not return structured insights" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(args, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("coach-insights error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
