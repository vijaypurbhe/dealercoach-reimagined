# Salesforce Rebuild — Timeline & Cost Estimate

Deliverables written to `/mnt/documents/`:
1. `Salesforce_Rebuild_Proposal.docx` — narrative proposal
2. `Salesforce_Rebuild_Cost_Model.xlsx` — editable cost model

## Assumptions baked in

- **Platform**: Salesforce Experience Cloud (LWR template) + Sales/Service Cloud objects, Agentforce + Einstein (Copilot, Prediction Builder, Next Best Action), Tableau-embedded analytics for KPI/heatmaps
- **Backend**: On-prem SQL Server only (no Data Cloud ingestion of raw rows). Integration via **MuleSoft Anypoint** (CDC + REST/OData virtualization for low-latency reads; nightly batch for history)
- **Identity**: SSO via Azure AD / SAML
- **Scope = full feature parity** with current app: persona switcher (Exec/DM), Exec dashboard (KPI strip, region heatmap, DM leaderboard, AI insights, risk/movers, program adoption, revenue vs plan), DM Portfolio, Dealer drilldown (KPI trends, action plans, facility intel modal, peer benchmarks, district map, briefing), Coach Chat
- **Wrap**: SSO, change management, training, UAT, 4-week hypercare
- **Rate**: blended **$50/hr** across all roles, **40 hr/week**
- **Team (~9 FTE Standard pod)**: PM, Solution Architect, BA, UX, 3× SF Developers (LWC/Apex), 1× Einstein/Agentforce specialist, 2× MuleSoft/SQL integration devs, 1× QA

## Timeline (~9 months / ~38 weeks elapsed)

```text
Phase                              Weeks   Calendar
1. Discovery & Design                6     W01–W06
2. Foundation (org, SSO, data model) 4     W05–W08  (overlap)
3. Integration (MuleSoft ↔ SQL)      8     W07–W14
4. Experience Cloud build            12    W09–W20
5. Einstein + Agentforce AI          8     W13–W20
6. Tableau analytics & maps          6     W15–W20
7. System Integration Test           4     W21–W24
8. UAT + change mgmt + training      4     W25–W28
9. Cutover & Hypercare               4     W29–W32
                                    ───
                          Elapsed:   ~32 weeks (~7.5 months) with parallelism
```

## Effort & cost (high level)

Total effort estimate: **~12,800 hours**  →  **~$640,000** at $50/hr blended.

| Workstream | Hours | Cost |
|---|---|---|
| Discovery, design, PM (PM/SA/BA/UX across project) | 2,400 | $120,000 |
| Experience Cloud LWC build (3 devs × 12 wks) | 1,440 | $72,000 |
| Apex / data model / sharing | 1,200 | $60,000 |
| MuleSoft + SQL Server integration (2 devs × 8 wks + ongoing) | 1,600 | $80,000 |
| Einstein + Agentforce (Copilot, Prediction Builder, prompt eng.) | 1,280 | $64,000 |
| Tableau analytics, heatmap, KPI dashboards | 800 | $40,000 |
| QA (full project) | 1,200 | $60,000 |
| SSO, security review, perf, accessibility | 480 | $24,000 |
| SIT + UAT support | 800 | $40,000 |
| Change mgmt, training, documentation | 600 | $30,000 |
| Cutover + 4-week hypercare | 800 | $40,000 |
| **Contingency (~10%)** | — | **~$58,000** |
| **TOTAL labor** | **~12,800** | **~$640,000** |

**Excluded** (pass-through, billed separately): Salesforce licenses (Experience Cloud member, Agentforce conversation credits, Einstein add-ons), MuleSoft subscription, Tableau licenses, Azure AD/SSO, infra for SQL connectivity (private link / VPN).

## Risks called out in the doc

- SQL Server latency to Salesforce (mitigation: MuleSoft caching + OData virtualization)
- Agentforce grounding on a non-Data-Cloud backend (use Prompt Builder with retrieval against MuleSoft APIs)
- Map rendering in LWR (Tableau embed vs custom LWC + Mapbox tradeoff)
- Sandbox/data refresh cadence with on-prem source

## Implementation steps

1. Use the `xlsx` skill to build the cost model with editable assumption cells (rate, hours, contingency %), per-phase rollups, role × phase matrix, and a summary tab.
2. Use the `docx` skill (docx-js) to generate the proposal: exec summary, scope, architecture, phase-by-phase timeline table, effort table, assumptions, risks, exclusions.
3. QA: convert XLSX via recalculate_formulas; convert DOCX → PDF → images and inspect first/last pages.
4. Emit `<lov-artifact>` tags for both files.

After approval I'll switch to build mode and generate both files.