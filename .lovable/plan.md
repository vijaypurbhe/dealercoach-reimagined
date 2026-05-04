## What the data contains

- **Dealers_Parts_Sales_Performance.csv** – 2 real dealers (`02042`, `02048` = Birmingham Mitsubishi), monthly `parts_cst` (actual), `parts_obj` (target), `percent_obj`, `uio_utm` (UIO count). History 2013→Apr 2025.
- **Dealers_Accessory_Sales_Performance.csv** – same 2 dealers, monthly `accy_cst`, `accy_obj`, `percent_obj`, `nvr` (new vehicle retail count).
- **KPI_Corrective_Action_Plan.csv** – 28 action-plan entries with `kpi_type`, `root_cause`, `corrective_action`, `expected_result`, `isKpiMet`. KPI types: CSI, Part Sales, Accessory Sales, CPRO Count, PART CPRO, 1 Year Retention, Other.
- **Screenshots** show the legacy CRS UI: side-nav (Dashboard / Parts Performance / KPI Action Plans / Programs / CSI Audit / Franchise / Attachments / Sign-Off), 2×3 grid of **Actual vs Target bar charts** with red bars when missed and green bars when exceeded, and a 3-column form (Root Cause | Corrective Action | Expected Results) above a grid of past entries.

## What I'll build

### 1. Real-data ingestion (no DB; static JSON for demo speed)
- Add `src/data/real/parts.json`, `accessories.json`, `kpiPlans.json` generated from the CSVs (deduped, last 12 months).
- Add `src/data/realDealers.ts` exposing two real dealers (`02042` and `02048 – Birmingham Mitsubishi`) built from real series, slotted into the existing `Dealer` type alongside the synthetic 8 so the rest of the app keeps working.
- Derive `partsSales`, `accessorySales`, `csi` (from KPI plan flag history), and compute `partsPercentObj`, `accyPercentObj` per month for the new chart.

### 2. New "Actual vs Target" bar chart component
- `src/components/app/ActualVsTargetBars.tsx` using Recharts `BarChart`. Two series per month (Actual / Target); Actual bar colored **green when ≥ target, red when < target**, target bar gray. Mirrors the legacy CRS look.
- Drop into Dealer page in a new "Performance vs Target" section showing 6 charts: Part Sales, Accessory Sales, Avg Parts $/CPRO (parts_cst / nvr), CPRO Count (nvr), CSI, FRFT (synthesized for non-real KPIs so all 6 tiles render).

### 3. KPI Improvement Action Plans page (new)
- `src/pages/KpiActionPlans.tsx` route `/dealers/:dealerId/kpi-plans`.
- Top: dropdown "KPI Needing Attention" + 3 textareas (Root Cause / Corrective Action / Expected Results & Timeline) — matches screenshot.
- Bottom: data grid of plans with KPI Type, Contact Date, Contact Month, Root Cause, Corrective Action, status (Met = ✓ green / Not Met = red).
- Seed grid from `kpiPlans.json` for real dealers; new entries are stored in component state (demo only).
- Add link from Dealer page action bar.

### 4. Legacy-style left side-nav on Dealer page (subtle)
- Add a slim secondary nav inside the Dealer page: Dashboard · Parts Performance · KPI Action Plans · Programs · CSI Audit · Franchise/Facility · Attachments · Sign-Off. Only Dashboard, Parts Performance, and KPI Action Plans are wired up; the rest are visible-but-disabled "coming soon" so the demo mirrors the customer's mental model without scope creep.

### 5. Portfolio surface
- Mark the 2 real dealers with a "Real data" pill in the portfolio table and District Map so the SE can demo the difference instantly.

## Files to add
- `src/data/real/parts.json`, `accessories.json`, `kpiPlans.json`
- `src/data/realDealers.ts`
- `src/components/app/ActualVsTargetBars.tsx`
- `src/components/app/DealerSideNav.tsx`
- `src/pages/KpiActionPlans.tsx`

## Files to edit
- `src/data/dealers.ts` – merge real dealers into `DEALERS`
- `src/data/types.ts` – add optional `partsActualVsTarget`, `accyActualVsTarget` series and `kpiPlans` to `Dealer`
- `src/pages/Dealer.tsx` – mount side-nav + Actual-vs-Target section + link to KPI plans page
- `src/App.tsx` – register `/dealers/:dealerId/kpi-plans` route
- `src/pages/Portfolio.tsx` – "Real data" pill on real dealers

## Out of scope (flag for follow-up)
- Persisting new KPI action plans to Lovable Cloud
- Programs / CSI Audit / Franchise / Attachments / Sign-Off screens
- Backfilling the other 8 synthetic dealers with real CSV data (only 2 dealers exist in source)
