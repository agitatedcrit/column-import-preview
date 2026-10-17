import { insist } from './lib/validation.mjs';
export function parseCsv(source) {
  insist(typeof source === 'string' && Buffer.byteLength(source) <= 5000000, 'CSV must be UTF-8 text under 5 MB');
  const rows = []; let row = [], field = '', quoted = false, closed = false;
  const push = () => { row.push(field); field = ''; closed = false; };
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === '"') { insist(!field && !closed, 'Unexpected quote'); quoted = true; }
    else if (c === ',') push();
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && source[i + 1] === '\n') i++;
      push(); if (row.some(v => v !== '')) rows.push(row); row = [];
    } else { insist(!closed, 'Text after closing quote'); field += c; }
  }
  insist(!quoted, 'Unclosed quoted field');
  if (field || closed || row.length) { push(); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows.shift(); headers[0] = headers[0].replace(/^\uFEFF/, '');
  insist(headers.length <= 20 && new Set(headers).size === headers.length && headers.every(Boolean) && !headers.includes('__row'), 'Invalid or duplicate CSV headers');
  insist(rows.length <= 10000, 'At most 10000 rows');
  return rows.map((cells, i) => {
    insist(cells.length === headers.length, `Column count mismatch on record ${i + 2}`);
    return { ...Object.fromEntries(headers.map((h, j) => [h, cells[j]])), __row: i + 2 };
  });
}
export function previewImport(existingText, incomingText, contract = { key: '手机号', update: ['姓名', '公司'], required: [], normalizePhone: true }) {
  insist(contract && typeof contract.key === 'string' && Array.isArray(contract.update), 'Declare a key and update columns');
  const existing = parseCsv(existingText), incoming = parseCsv(incomingText);
  const normalize = v => contract.normalizePhone ? String(v ?? '').replace(/[\s()+-]/g, '') : String(v ?? '').trim();
  const groups = rows => {
    const map = new Map();
    for (const r of rows) { const k = normalize(r[contract.key]); if (!map.has(k)) map.set(k, []); map.get(k).push(r); }
    return map;
  };
  const known = groups(existing), fresh = groups(incoming);
  const operations = incoming.map(row => {
    const key = normalize(row[contract.key]), before = known.get(key)?.[0] || null;
    let reason;
    if (!key) reason = 'missing-key';
    else if (fresh.get(key).length > 1 || (known.get(key)?.length || 0) > 1) reason = 'duplicate-key';
    else if ((contract.required || []).some(field => !row[field]?.trim())) reason = 'missing-required-field';
    if (reason) return { type: '待确认', sourceRow: row.__row, key, before, after: row, reason };
    const after = before ? { ...before } : { ...row }, changes = [];
    for (const field of contract.update) {
      const value = row[field];
      if (value !== undefined && value !== '' && value !== before?.[field]) {
        after[field] = value; changes.push({ field, before: before?.[field] ?? null, after: value, rule: 'nonempty-explicit-update' });
      }
    }
    return { type: !before ? '新增' : changes.length ? '更新' : '跳过', sourceRow: row.__row, key, before, after, changes };
  });
  return { plan: operations, counts: Object.fromEntries(['新增', '更新', '跳过', '待确认'].map(type => [type, operations.filter(r => r.type === type).length])), ruleVersion: '0.2.0', contract };
}
export function run(x) { return previewImport(x.existing, x.incoming, x.contract); }
export function validate(x) { run(x); }
