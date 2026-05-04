# C-Level Executive Persona — Dashboard Plan

## Research: What auto OEM execs (VP Sales / VP Aftersales / COO / Network GM) want

Based on how dealer-network platforms (CDK Intelligence Suite, Autologica Scope, NEXERA Executive Insight, Loop for Audi) frame exec views, OEM C-suite leaders care less about any one dealer and more about **network health, variance, and risk concentration**. Common themes:

1. **Network performance vs. plan** — actual vs. target on the 4–6 KPIs that roll up to corporate scorecards (CSI, retention, parts/accessory revenue, warranty leakage), with YoY and MoM trend.
2. **Geographic / regional heatmap** — which regions and districts are hot/cold; click through to district → dealer.
3. **District Manager leaderboard** — ranking DMs by portfolio health, % dealers on-track, coaching cadence (visits completed), action-plan close rate.
4. **Risk & exception list** — top N at-risk dealers driving the largest gap-to-target dollars; "movers" (biggest improvers/decliners MoM).
5. **Program / promotion adoption** — % of dealers participating in active OEM programs.
6. **Forecast vs. budget** — projected parts/accessory revenue vs. annual plan, with shortfall callouts.
7. **AI executive briefing** — one-paragraph "what changed this week across the network" summary, similar to today's District Briefing.

## Proposed direction

Add a **persona switcher** (DM ↔ Executive) in the header. Executive lands on a new `/executive` route with this layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ Header + Persona switch (DM | Executive)                    │
├─────────────────────────────────────────────────────────────┤
│ Network KPI strip:  CSI │ Retention │ Parts $ │ Warranty   │
│   value · vs target · MoM · YoY · % dealers on-track        │
├──────────────────────────────────┬──────────────────────────┤
│ Region heatmap (US map, colored  │ AI Executive Briefing    │
│ by avg health; click → drill)    │ (network-level summary)  │
├──────────────────────────────────┴──────────────────────────┤
│ District Manager leaderboard                                │
│   DM · # dealers · avg score · % on-track · visits · trend  │
├─────────────────────────────────────────────────────────────┤
│ Top risk dealers      │ Top movers (▲/▼ MoM)                │
├─────────────────────────────────────────────────────────────┤
│ Program adoption  │  Parts/Accessory revenue vs plan chart  │
└─────────────────────────────────────────────────────────────┘
```

Drilldown: click a region → filtered DM list; click a DM → their portfolio (today's `/` view scoped to their dealers); click a dealer → existing dealer page. Persona is purely a view layer — same underlying data.

## Technical approach

- **Persona state**: lightweight context (`PersonaProvider`) persisted to `localStorage`; switcher in `AppHeader`.
- **Routes**:
  - `/executive` — new exec dashboard (default landing when persona = exec)
  - `/executive/districts/:dmId` — DM-scoped portfolio (reuses Portfolio with a filter)
  - existing `/` and `/dealers/:id` unchanged for DM persona
- **Data**:
  - Add `districtManagers.ts` seed (5–7 DMs, each owns N dealers; assign `dmId` to each dealer in `dealers.ts`).
  - Add `network.ts` aggregation helpers: `networkKpiRollup()`, `dmLeaderboard()`, `topRisk()`, `topMovers()`, `programAdoption()`.
- **New components** (under `src/components/exec/`):
  - `NetworkKpiStrip`, `RegionHeatmap` (reuse `DistrictMap` colored by aggregate health), `DmLeaderboard`, `RiskList`, `MoversList`, `ProgramAdoptionCard`, `RevenueVsPlanChart` (Recharts).
- **AI briefing**: reuse the existing `coach-insights` edge function pattern with a new `network-briefing` function that summarizes aggregated KPIs (no per-dealer chat).

## What I need you to confirm

1. **Persona scope** — just two personas (DM + Executive), or also a middle "Regional Director" tier?
2. **KPI focus** — keep the existing 6 KPIs at the network level, or do you want exec-only KPIs added (e.g., warranty $ exposure, F&I penetration, fixed absorption %)?
3. **Drilldown model** — should the exec be able to *act* (assign action plans, sign-off) or strictly read/observe with drill-through to the DM view?
4. **AI briefing** — network-wide weekly summary only, or also a chat ("which districts are dragging parts revenue this quarter?")?

Once you confirm, I'll implement the persona switcher, data rollups, exec route, and the components above.
