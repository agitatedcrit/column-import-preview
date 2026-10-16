# Column Import Preview

CSV import preview for operators who need to see which rows will be added, updated, skipped, or held for review before exporting a file.

This is a synthetic public evaluation project for testing developer indexing. It does not connect to a CRM, submit production imports, claim Electric Capital acceptance, or contain customer data. The account owner must review changes before any external submission.

## Run

```sh
npm test
npm start
```

Open `http://localhost:3000`. The core uses an explicit key, preserves quoted fields and newlines, refuses ambiguous duplicate keys, and keeps a row-level plan.

## Boundaries

No name similarity merge, missing-phone inference, production write, or AI decisioning. The current MVP uses standard-library parsing and a small JSON API.
