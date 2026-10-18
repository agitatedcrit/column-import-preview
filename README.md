# Column Import Preview

Review a complete import batch, resolve held rows and export the approved changes.

Kite agents request an import plan as a paid tool: the output is an auditable row-level plan, not an automatic CRM write.

## Start a project

Requires Node.js 20.11 or newer.

```sh
npm ci
npm test
npm start
# Open http://127.0.0.1:3000
```

Create a named import project, replace the editable example inputs and save your brief. No analysis or payment happens automatically.

## Workflow

Upload current and incoming CSVs, declare an identity column and allowed changes, inspect every add/update/hold, fix held rows, rerun, review and export the merged records. No CRM write occurs.

### Inputs

- **Current records**: Upload or paste a CSV snapshot. The source system is never modified.
- **Incoming batch**
- **Identity column**
- **Columns allowed to change**
- **Required columns**
- **Normalize phone formatting**

### Deliverables

Import-plan CSV, field-change CSV and exact merged-record JSON when there are no held rows. Every completed run also includes an audit JSON with result, input hash, rule version and review decisions. Draft downloads are labeled; release requires current inputs, no blocking issues and an explicit acceptance for every review item.

## What makes this a project workspace

- A named brief and persistent business inputs, not a disposable request.
- Structured forms, source-file import where applicable, business tables and visual previews.
- Immutable analysis runs, scenario duplication, result comparison and historical input restoration.
- Per-item review notes, blocked release for unresolved issues, archived projects and reviewed exports.
- Encrypted local persistence, restart recovery and revision checks that prevent stale edits overwriting newer work.

Project inputs and snapshots remain until removed. Preserve the private `.workspace-data` directory and its encryption key. The application is single-operator and single-process; it has no multitenant accounts or external approval signatures. Default retention limits are 50 projects, 10 runs per project, 64 MB per project and 256 MB overall. See [workspace operations and API](docs/PROJECT-GUIDE.md).

## Kite integration

`npm run check:kite` verifies the configured Kite chain and reads its current block. The service descriptor is at `/kite-service.json`.

Free local analysis returns no payment receipt. With explicitly configured paid mode, a project run prepares a task-bound x402 v2 quote; an operator signs with compatible wallet tooling, the service verifies authorization, computes the business output, requests settlement and delivers only after confirmed success. The workspace collects the delivered result against its saved input hash.

Missing payment configuration fails closed. The task-specific nonce signing extension still requires client interoperability testing. No live wallet-funded payment, stock Passport compatibility, official registry certification or Electric Capital acceptance is claimed. See [Kite setup and verification limits](docs/KITE-INTEGRATION.md).

Remote or paid-mode project management requires a private `WORKSPACE_ACCESS_TOKEN` of at least 32 characters. Bind locally by default, and configure HTTPS before remote use. `.env.example` is a configuration reference; the application does not load it automatically.

## Verification and scope

`npm test` runs business regressions, this project's acceptance tests, project-storage/review/access tests, and payment-state tests with a **fake facilitator**. [Verification record](docs/VERIFICATION.json) distinguishes these from historical live read-only network probes.

All occurrences of a repeated key are held for review. Blank fields preserve prior values. Quoted CSV fields and malformed rows are handled explicitly.

No CRM writes, identity inference, external-system sync or full conflict-resolution UI. Merged records are a downloadable local file. CSV row numbers refer to logical records.

Developed with AI assistance as a Kite integration evaluation project. [Common infrastructure](docs/SHARED-INFRASTRUCTURE.md) is shared across the evaluation repositories; each project has its own business engine, forms, release criteria and exports. Licensed under MIT.
