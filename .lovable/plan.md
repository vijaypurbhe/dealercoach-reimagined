# Make the Dealer Coach Demo Stand Out for an OEM District Manager

## What competitors / real OEM tools emphasize

Quick scan of Loop Software, UON Dealer View, pOrbis, DealerBuilt Lightyear, and NCM Associates — the tools OEM field teams actually use. Common themes:

- **Visit / field-rep workflow**: schedule visits, prep packs, capture notes, assign actions, and track follow-through between visits. This is the #1 thing district managers spend their day on and your demo doesn't have it yet.
- **Action plan lifecycle**: not just "Add to plan" — owners, due dates, status (open/in-progress/done), and measured impact after the fact ("did CSI actually move?").
- **Peer benchmarking with rank**: "you're #4 of 8 in region on retention" + percentile bands, not just an average number.
- **Network-level rollup for the DM**: a single "state of my district" view with weighted KPIs, MoM/YoY deltas, and which dealers moved.
- **Forecast / pacing**: month-to-date pace vs. target with projected end-of-month, color-coded.
- **Customer voice**: review themes, NPS verbatims, mystery shop scores — already partially there via `online.recentThemes`, can be expanded.
- **Audit / standards compliance**: facility checklist, brand standards score.
- **AI that's specific**: "if you do X, expected lift Y based on N similar dealers" — you have this; lean into it more visibly.

## Proposed additions (ranked by demo impact)

### 1. District Briefing on the Portfolio page (high impact, visual)
A hero strip above the dealer table showing the DM's morning briefing:
- District health score + trend arrow
- "3 dealers need attention this week" with avatars/initials
- "Top mover" and "Biggest drop" cards
- One-line AI narrative: *"CSI is the dominant risk across your district; 4 of 8 dealers below target."*

### 2. Visit Planner (high impact, unique)
New section/route `/visits`:
- Auto-prioritized visit queue (lowest health + longest since last visit)
- "Prep pack" button per dealer → pre-generated talking points from AI Coach
- Mark visit complete → captures notes and assigned actions

### 3. Action Plan tracker with outcomes (high impact, fills obvious gap)
Promote the existing "Add to plan" from a toggle into a real object:
- Owner, due date, status, target KPI
- After 30/60/90 days show measured KPI delta vs. when action was created
- "Actions that worked across your district" leaderboard — reuses `peerHistoricalActions` from the packet

### 4. Peer rank + percentile chips (medium impact, easy)
On the dealer page, replace flat peer-average text with: rank pill ("#6 of 8 in West"), percentile bar, and gap-to-leader. Already have peer data in `dealerPacket.ts`.

### 5. Pacing & forecast on KPI cards (medium impact, easy)
Each `KpiTrendCard` shows MTD pace, projected EOM, and a target line. Visual: dotted projection extending the sparkline.

### 6. Customer Voice panel (medium impact, demo-friendly)
Expand `context.online` into a card with star rating, review-volume sparkline, theme chips colored by sentiment, and 2-3 mock verbatim quotes. Optional: AI summary "what customers complain about most."

### 7. Compare mode (medium impact)
Select 2-3 dealers from the portfolio → side-by-side KPI comparison with AI commentary on what the leader does differently.

### 8. Export / share (low effort, high perceived polish)
"Email district briefing" and "Export dealer one-pager (PDF)" buttons — even if mocked, they signal this is a real workflow tool. Real PDF export is straightforward with the existing data.

### 9. Anomaly alerts feed (low effort)
Small "What changed this week" feed in the header: "Sunset Mitsubishi CSI dropped 3pts", "Lakeshore parts sales hit new 12-mo high". Computed from existing history.

### 10. Map view of the district (visual flair)
Toggle the portfolio between table and US map; dots colored by health. Uses existing city/state data.

## Recommended scope for next iteration

If you want one focused build, I'd do **#1 District Briefing + #3 Action Plan tracker + #4 Peer rank**. Together they round out the DM persona (network view → drill-in → follow-through) and reuse data you already generate. #2 Visit Planner is the strongest "this is built for me" moment if you have appetite for a second route.

## Technical notes

- All additions are pure frontend on top of the mock data in `src/data/dealers.ts` — no backend changes required.
- Action plan tracker would add a small `useLocalStorage`-backed store for status/owner/due-date so it persists across reloads in the demo.
- District Briefing AI narrative can either be deterministic from the data or a new `coach-district` edge function mirroring `coach-insights`.
- PDF export: `@react-pdf/renderer` or just `window.print()` with a print stylesheet for a one-pager.

## Question before I build

Which slice do you want? Pick any combination:
- A: District Briefing hero on Portfolio
- B: Action Plan tracker with status + measured impact
- C: Visit Planner route
- D: Peer rank + percentile chips
- E: Pacing / forecast on KPI cards
- F: Customer Voice panel
- G: Compare mode
- H: PDF export / share
- I: Map view
