import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

export function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"' && quoted && next === '"') { cell += '"'; i += 1; continue; }
    if (ch === '"') { quoted = !quoted; continue; }
    if (ch === ',' && !quoted) { row.push(cell); cell = ''; continue; }
    if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some(value => value !== '')) rows.push(row);
      row = []; continue;
    }
    cell += ch;
  }
  if (cell || row.length) { row.push(cell); if (row.some(value => value !== '')) rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map((values, rowIndex) => {
    const result = Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
    result.__row = rowIndex + 2;
    return result;
  });
}

function keyOf(value) { return String(value ?? '').replace(/\D/g, ''); }

export function previewImport(existingText, incomingText, contract = { key: '手机号', update: ['姓名', '公司'] }) {
  const existing = parseCsv(existingText), incoming = parseCsv(incomingText);
  const known = new Map(), duplicateExisting = new Set();
  for (const row of existing) {
    const key = keyOf(row[contract.key]);
    if (!key) continue;
    if (known.has(key)) duplicateExisting.add(key);
    known.set(key, row);
  }
  const seen = new Set(), plan = [];
  for (const row of incoming) {
    const key = keyOf(row[contract.key]);
    if (!key || seen.has(key) || duplicateExisting.has(key)) {
      plan.push({ type: '待确认', row: row.__row, key, before: known.get(key) ?? null, after: row, reason: !key ? '缺少匹配键' : '同一匹配键出现多条记录' });
      continue;
    }
    seen.add(key);
    const before = known.get(key);
    if (!before) { plan.push({ type: '新增', row: row.__row, key, before: null, after: row }); continue; }
    const changed = contract.update.some(field => (row[field] ?? '') !== (before[field] ?? '') && row[field] !== '');
    plan.push({ type: changed ? '更新' : '跳过', row: row.__row, key, before, after: row, reason: changed ? '允许更新字段发生变化' : '无可应用变化' });
  }
  const counts = Object.fromEntries(['新增', '更新', '跳过', '待确认'].map(type => [type, plan.filter(item => item.type === type).length]));
  return { counts, plan, contractVersion: JSON.stringify(contract) };
}

function html() {
  return `<!doctype html><meta charset="utf-8"><title>分栏 · CSV 导入预演</title><style>body{font:16px system-ui;margin:0;background:#f5f7fa;color:#162a43}main{max-width:1100px;margin:auto;padding:32px}h1{margin:0 0 8px}textarea{width:100%;min-height:130px;font:14px ui-monospace;padding:10px;box-sizing:border-box}section{background:white;border:1px solid #ccd6e5;padding:18px;margin:16px 0}button{background:#2456c5;color:white;border:0;padding:10px 14px;border-radius:3px}pre{white-space:pre-wrap;background:#eef3ff;padding:12px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:700px){.grid{grid-template-columns:1fr}}</style><main><p>分栏 / CSV 导入预演</p><h1>先预演，原表不会被改动。</h1><p>只使用显式匹配键；空值不覆盖，同键冲突留给人工确认。</p><section class="grid"><label>现有会员 CSV<textarea id="existing">手机号,姓名,公司\n13800138000,刘安,一间设计\n13900139000,许远,北岸</textarea></label><label>本次导入 CSV<textarea id="incoming">手机号,姓名,公司\n138 0013 8000,刘安,一间工作室\n13700137000,陈晴,青禾工作室\n13800138000,第二个人,误合并</textarea></label></section><button id="run">预演导入</button><section><h2>结果</h2><pre id="out">等待输入</pre></section></main><script>run.onclick=async()=>{const r=await fetch('/api/preview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({existing:existing.value,incoming:incoming.value})});out.textContent=JSON.stringify(await r.json(),null,2)}</script>`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer((req, res) => {
    if (req.method === 'GET') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html()); return; }
    let body = ''; req.on('data', chunk => { body += chunk; }); req.on('end', () => { try { const input = JSON.parse(body); const result = previewImport(input.existing, input.incoming); res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(result)); } catch (error) { res.writeHead(400, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: error.message })); } });
  }).listen(process.env.PORT || 3000);
}
