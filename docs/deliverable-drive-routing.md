# Deliverable → Drive Folder Routing Manifest

**Source of truth:** `src/components/ClientPortal.tsx` → `DEL_DROP_FOLDERS` constant.
**Drive root:** `00_Shared_Assets` (`https://drive.google.com/drive/folders/1c0Mcfw6L28OOCjI8qToFET6MB63NRtS0`)
**Owner:** `dtspdigitalmedia@gmail.com`

This doc is the canonical mapping of every Plan C deliverable to the Drive folder where its report or evidence belongs. The `dropFolderFor(id)` helper in the portal reads from this same data so what Lance sees in the portal === what's documented here.

---

## Routing table

### Milestone 1 — Foundation

| ID | Deliverable | Drive folder | Report contents |
|----|-------------|--------------|-----------------|
| `p1-del-0` | Database schema design & deployment | **Docs** | Schema ERD, migration log, RLS policy map, smoke-check results, post-deploy verification screenshots |
| `p1-del-1` | Artist consent pipeline with e-sign | **Docs** | Pipeline architecture diagram, sample signed PDF, sha256 audit trail explanation, sample sync_audit row |
| `p1-del-2` | Auth, roles & tenant scaffolding | **Docs** | Roles diagram, RLS policy enumeration, JWT role-claim explanation, sample admin override scenario |

### Milestone 2 — SEO & Payouts

| ID | Deliverable | Drive folder | Report contents |
|----|-------------|--------------|-----------------|
| `p2-del-0` | SEO article generator engine | **Docs** | Prompt-permutation engine doc, sample CSV (20–50 rows of a real batch), Anthropic cost report for the run |
| `p2-del-1` | Domain auth (DKIM, SPF, DMARC) | **Docs** | Three MXToolbox screenshots, the actual TXT/CNAME record values, the DMARC rollout schedule |
| `p2-del-2` | Stripe Connect payout engine setup | **Docs** | Stripe account-link flow walkthrough, screenshot of test-mode Express account, $1 test-payout receipt |

### Milestone 3 — WooCommerce Integration

| ID | Deliverable | Drive folder | Report contents |
|----|-------------|--------------|-----------------|
| `p3-del-0` | WooCommerce REST API connection | **Docs** | API key provisioning steps, connection test results, sample product GET/POST round-trip log |
| `p3-del-1` | Product push pipeline | **Docs** | Pipeline diagram, sample successful push log, error-case handling examples |
| `p3-del-2` | Order webhook testing & reconciliation | **Docs** | Webhook payload spec, sample order-event reconciliation, idempotency test log |

### Milestone 4 — Marketplace Ingestion & AI

| ID | Deliverable | Drive folder | Report contents |
|----|-------------|--------------|-----------------|
| `p4-del-0` | Etsy/Shopify OAuth ingestion agents | **Docs** | OAuth flow walkthrough, sample ingested-listing log, normalization examples |
| `p4-del-1` | AI listing enhancement (Claude Sonnet) | **Art › References** | 5–10 before/after pairs of listing copy, with the artist's bio and tone guide as input |
| `p4-del-2` | CRM integration (GoHighLevel) | **Docs** | GHL contact-create round-trip log, supervisor MCP tool usage examples, sync_audit sample rows |

### Milestone 5 — Artist Onboarding

| ID | Deliverable | Drive folder | Report contents |
|----|-------------|--------------|-----------------|
| `p5-del-0` | Artist onboarding flow (consent → listing) | **Docs** | End-to-end Playwright recording of onboarding, milestone-1 onboarding metrics |
| `p5-del-1` | Automated payout testing (80/20 split) | **Docs** | Payout reconciliation report for 5+ test transfers, ledger audit |
| `p5-del-2` | SEO article publishing pipeline | **Docs** | Publishing pipeline diagram, first-100-articles publish log, ranking baseline |
| `p5-del-3` | Admin console for marketplace management | **Docs** | Console walkthrough video, role-gated route diagram, screenshot inventory |

### Milestone 6 — Launch & Scale

| ID | Deliverable | Drive folder | Report contents |
|----|-------------|--------------|-----------------|
| `p6-del-0` | Production deployment & monitoring | **Docs** | Deploy runbook, monitoring dashboard URLs, alert routing config |
| `p6-del-1` | Load testing & optimization | **Docs** | Load test scenarios + results, P50/P95/P99 latency table, bottleneck-fix log |
| `p6-del-2` | Artist support documentation | **Docs** | Artist onboarding guide, FAQ, troubleshooting decision tree |
| `p6-del-3` | Analytics dashboard & handoff | **Docs** | Dashboard walkthrough, handoff checklist, post-launch support SLA |

---

## Drive folder URLs (shorthand)

| Folder name | URL |
|-------------|-----|
| Docs | https://drive.google.com/drive/folders/1ivpW8u-gwpUO5B5vqXscCBZPibD_hsim |
| Art › References | https://drive.google.com/drive/folders/1qzACdvDnH1K414f-WBwo6D11soqlqBkU |
| Brand › Guidelines | https://drive.google.com/drive/folders/1uWvOTUftKCBC58VH4kt3dcgpJ7TU11qe |
| Ideas | https://drive.google.com/drive/folders/1Ez58cObbCh4IJTadPn1zQBgl9uuXuqTX |
| Art › Originals | https://drive.google.com/drive/folders/1IKvT0CpxPRBG1-ae38Fg9C3Gx8EI_kTU |

---

## File naming convention

When dropping a report into a Drive folder, name it:

```
{deliverable_id}_{short_slug}_{YYYY-MM-DD}.{ext}
```

Examples:
- `p1-del-0_database_schema_deployment_2026-04-28.md`
- `p2-del-1_dkim_spf_dmarc_verification_2026-05-12.pdf`
- `p4-del-1_listing_enhancement_samples_2026-06-30.zip`

Lance can search by the `pN-del-N` prefix to find any deliverable's report. The date suffix lets us version reports if a deliverable is re-shipped after revisions.

---

## Status as of 2026-04-28

Three deliverables auto-shipped (`p1-del-0`, `p1-del-1`, `p1-del-2`). Their reports are written and live in `WEA_Infra/reports/` ready to upload to the **Docs** folder:

- `p1-del-0_database_schema_deployment_2026-04-28.md`
- `p1-del-1_consent_pipeline_2026-04-28.md`
- `p1-del-2_auth_roles_tenant_2026-04-28.md`

Pete: drop these three files into the `00_Shared_Assets / Docs` folder when convenient. They are also tracked in `WEA_Infra/reports/` so they're under git history alongside the code they describe.
