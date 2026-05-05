## Change

Remove MuleSoft from the integration layer. Use native Salesforce connectors to SQL Server instead:
- **Salesforce Connect with OData 4.0 adapter** for real-time virtualization of SQL Server (External Objects)
- **Heroku Connect is not applicable** (Postgres only) — call out explicitly
- **Data Loader / Bulk API + scheduled Apex** for nightly batch history loads
- **Named Credentials + External Services** for any callable SQL-fronted REST endpoints (lightweight wrapper deployed on customer's existing IIS/.NET if needed for write-back or stored proc invocation)

## Impact on team

- Drop the 2× MuleSoft/SQL integration developers
- Add 1× Salesforce Integration Developer (Salesforce Connect / OData / Apex async)
- Keep 1× SQL Server developer (on customer side or our pod) to expose OData endpoints from SQL Server (via SQL Server's built-in OData support / a thin .NET OData service) and tune queries/indexes
- New pod size: **~8 FTE** (was 9)

## Impact on timeline

- Integration phase shortens from **8w → 6w** (no MuleSoft platform standup, flows, or CloudHub config; OData adapter setup is faster but constrained)
- Overall elapsed timeline: **32w → 30w**

## Impact on cost

| Line | Before | After |
|---|---|---|
| Integration labor | $80,000 (2 devs × 8w) | $48,000 (1 SF int dev + 1 SQL dev × 6w) |
| Total labor | $640,000 | **~$590,000** |
| Contingency (10%) | $64,000 | ~$59,000 |
| **Total** | **$704,000** | **~$649,000** |

Savings: **~$55,000** and **2 weeks**.

## Risks to flag (new/changed)

- **Salesforce Connect query limits**: External Objects have row/query limits (default 100k rows per query, sync limits per hour). Heavy KPI aggregations should be **pre-aggregated in SQL Server views** and exposed as OData entities — not raw fact tables.
- **No Data Cloud / no MuleSoft caching layer**: latency depends entirely on SQL Server response time + network. Mitigation: OData server-side paging, indexed views, Platform Cache for hot lookups.
- **Write-back is harder**: Salesforce Connect supports writeable External Objects only with OData 4.0 + proper SQL endpoint. Action plan saves, coach chat history, etc. likely live in **native Salesforce objects** synced nightly back to SQL.
- **Agentforce grounding**: still constrained — now grounded via Apex callouts to OData endpoints (no MuleSoft API layer to standardize).

## Deliverables to regenerate

1. `Salesforce_Rebuild_Proposal_v2.docx` — updated architecture section, integration approach, team table, timeline, risks, cost
2. `Salesforce_Rebuild_Cost_Model_v2.xlsx` — updated Assumptions (8 FTE), Role × Phase matrix (swap MuleSoft devs for SF Int Dev + SQL Dev, integration phase 6w), Gantt, totals

Originals (`_v1` equivalents) remain available; new files are versioned `_v2`.

## QA

- Recalculate XLSX formulas, verify zero formula errors, totals tie to ~$590K labor / ~$649K with contingency
- Render DOCX → PDF → images, inspect every page for layout/clipping
