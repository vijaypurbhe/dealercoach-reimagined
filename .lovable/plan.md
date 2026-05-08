
# v4 Plan — License-Aligned Lean Pod Rebuild

## Decisions locked from license review

1. **Base user licenses (Sales/Service Cloud Enterprise+) confirmed available** — no incremental seat cost in proposal. Note as customer-side prerequisite.
2. **Hybrid integration**: Data Cloud Zero-Copy Federation for SQL Server reads (KPIs, history, dealer attributes); Named Credentials + External Services + lightweight Apex for transactional writebacks (action plan saves, coach chat persistence, status updates).
3. **AI grounding**: Agentforce (Default) + Einstein Prompt Templates — both currently active with ample headroom (40 agent seats, 31 prompt templates remaining). No new SKU required.

## License coverage summary (to include in proposal)

**Fully covered by existing entitlement, $0 incremental:**
- Agentforce Default (40), Agentforce Platform User (75K)
- Einstein Prompt Templates (41), Einstein GPT Work Summaries / Search Answers
- Einstein Agent / Agent CWU (80 each)
- Data Cloud (200K credits) + **Remote Data Cloud (200K)** ← powers Zero-Copy
- Business Rules Engine Designer + Runtime, Decision Explainer, Einstein Next Best Action
- Tableau Einstein Included App (40), Analytics View Only Embedded (120), Service Analytics Apps (80)
- Sales Workspace User (41), Service User (40), Knowledge Creation User (40)
- Code Builder, Scale Center, Salesforce API Integration (build phase)

**Customer-side prerequisites (call out, exclude from cost):**
- ~50-60 base Sales/Service Cloud Enterprise+ user seats for DM cohort + execs/admins (confirmed available)
- Salesforce Connect / OData adapter SKU **only required for the writeback path** — verify with account team before build kickoff

**Out of scope / not needed:**
- MuleSoft (already removed)
- Experience Cloud, Commerce, Messaging, FSC Insurance, Visual Remote Assistant
- Agentforce Sales Coach SKU (using Default + Prompt Templates instead)

## Architecture changes vs v3

```text
┌─────────────────────────────────────────────────────────────┐
│  Salesforce (DM Console — Sales/Service Cloud)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ KPI cards    │  │ Action plans │  │ Agentforce Coach │   │
│  │ + dashboards │  │ (BRE rules)  │  │ (Prompt Tmpl)    │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
│         │ reads           │ writes            │ grounding   │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          ▼                 ▼                   ▼
   ┌─────────────┐   ┌──────────────┐   ┌──────────────┐
   │ Data Cloud  │   │ Named Creds  │   │ Data Cloud   │
   │ Zero-Copy   │   │ + External   │   │ DLOs (same   │
   │ → SQL DLOs  │   │ Services     │   │ federation)  │
   └──────┬──────┘   │ → SQL OData  │   └──────────────┘
          │          └──────┬───────┘
          ▼                 ▼
   ┌─────────────────────────────────┐
   │  Customer SQL Server            │
   │  (read views + write endpoints) │
   └─────────────────────────────────┘
```

## Team impact (vs v3)

Pod stays at **5 FTE** but role mix shifts slightly:
- SF Integration Developer's scope rebalances: **less OData scaffolding** (Zero-Copy auto-federates reads), **more Data Cloud DLO modeling + Apex writeback wrappers**
- SQL Server Developer's scope reduces from "build full OData service layer" to **"expose curated views for federation + 4-6 OData write endpoints"**
- Net effect: **~1 week shorter integration phase** (6w → 5w), **~$10K labor savings**

## Timeline impact

- v3: 38 elapsed weeks → **v4: ~37 elapsed weeks**
- AI build phase compresses slightly because grounding via Data Cloud DLOs is faster than Apex-callout grounding (no per-query OData wrapper)

## Cost impact (vs v3)

| Line | v3 | v4 |
|---|---|---|
| Total effort | 6,504 hrs | ~6,304 hrs |
| Labor ($50 blended) | $325,200 | **~$315,200** |
| Contingency (10%) | $32,520 | ~$31,520 |
| **Total** | **$357,720** | **~$346,720** |
| **Salesforce license cost added** | $0 | **$0 (existing entitlement)** |

Savings vs v3: ~$11K. Savings vs v1: ~50%.

## New risks to flag

- **Zero-Copy Federation maturity**: query pushdown to SQL Server has limits on complex joins/aggregations — mitigate with pre-aggregated SQL views (same mitigation as v3)
- **Two integration patterns to maintain** (Zero-Copy reads + OData writes) — slightly higher ops complexity than single-pattern v3
- **Salesforce Connect adapter SKU still required for write path** — flag as customer prerequisite; if not available, fall back to Apex HTTP callouts via Named Credentials (no additional SKU)
- **Agentforce Default vs Sales Coach SKU**: using Default means we build coaching UX rather than getting it OOTB — already factored into v3 hours, no change

## Deliverables to regenerate

1. **`Salesforce_Rebuild_Proposal_v4.docx`** — new sections:
   - Executive license-coverage table (what's covered $0 vs prerequisites)
   - Updated architecture diagram (hybrid Data Cloud + OData)
   - Revised team table (rebalanced integration roles)
   - Updated 37-week timeline
   - Risk register additions

2. **`Salesforce_Rebuild_Cost_Model_v4.xlsx`** — updates:
   - **New tab: `License_Coverage`** — full PSL inventory mapped to project capabilities, with $0 incremental call-out
   - Assumptions tab: note hybrid integration pattern
   - Role × Phase matrix: integration phase 6w → 5w, AI build -1w
   - Totals: $315.2K labor, $346.7K with contingency
   - Comparison block: v1 / v2 / v3 / v4

## QA

- Recalculate XLSX, verify zero formula errors
- Render DOCX → PDF → page images, inspect every page for layout/clipping
- Cross-check license table against source document (Mitsubishi NA PSL export)
