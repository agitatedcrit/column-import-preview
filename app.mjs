import { fileURLToPath } from 'node:url';
import { start } from './lib/server.mjs';
import { run, validate } from './core.mjs';
export * from './core.mjs';
export const spec = { ...{
  "slug": "column",
  "repo": "column-import-preview",
  "owner": "agitatedcrit",
  "title": "Column Import Preview",
  "purpose": "Preview a CSV import before an agent changes membership records",
  "workflow": "Kite agents request an import plan as a paid tool: the output is an auditable row-level plan, not an automatic CRM write.",
  "colors": [
    "#f5f7fa",
    "#162a43",
    "#2456c5"
  ],
  "required": [
    "existing",
    "incoming"
  ],
  "sample": {
    "existing": "phone,name,company\n13800138000,Lee,Old\n",
    "incoming": "phone,name,company\n13800138000,Lee,New\n13900139000,Sam,Studio\n",
    "contract": {
      "key": "phone",
      "update": [
        "name",
        "company"
      ],
      "required": [
        "name"
      ],
      "normalizePhone": true
    }
  },
  "changed": "All occurrences of a repeated key are held for review. Blank fields preserve prior values. Quoted CSV fields and malformed rows are handled explicitly.",
  "limits": "No CRM writes, identity inference, conflict resolution UI or production import export yet. CSV row numbers refer to logical records.",
  "version": "0.2.0",
  "inputSchema": {
    "type": "object",
    "required": [
      "existing",
      "incoming"
    ],
    "properties": {
      "existing": {
        "type": "string"
      },
      "incoming": {
        "type": "string"
      },
      "contract": {
        "type": "object"
      }
    }
  }
}, run, validate };
if (process.argv[1] === fileURLToPath(import.meta.url)) start(spec);

