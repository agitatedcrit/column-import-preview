import assert from 'node:assert/strict';
import { parseCsv, previewImport } from './app.mjs';

const rows = parseCsv('姓名,备注\n"刘安","一行\n两行"\n');
assert.equal(rows[0].备注, '一行\n两行');
const result = previewImport('手机号,姓名,公司\n13800138000,刘安,旧公司\n', '手机号,姓名,公司\n138 0013 8000,刘安,新公司\n13700137000,陈晴,青禾\n13800138000,第二个人,冲突\n');
assert.deepEqual(result.counts, { 新增: 1, 更新: 1, 跳过: 0, 待确认: 1 });
assert.equal(result.plan[2].reason, '同一匹配键出现多条记录');
console.log('column: ok');
