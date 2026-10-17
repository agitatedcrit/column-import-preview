import test from 'node:test'; import assert from 'node:assert/strict';
import { parseCsv, previewImport } from './core.mjs';
test('every row of a duplicated incoming identity is held', () => {
  const r = previewImport('手机号,姓名,公司\n138,Lee,Old\n', '手机号,姓名,公司\n138,Lee,New\n138,Other,Other\n139,Sam,Studio\n');
  assert.deepEqual(r.counts, { 新增: 1, 更新: 0, 跳过: 0, 待确认: 2 });
});
test('blank values preserve prior values; alphanumeric keys are not collapsed', () => {
  const c = { key: 'id', update: ['name'] };
  const r = previewImport('id,name\na-1,Lee\nb-1,Sam\n', 'id,name\na-1,\nb-1,New\n', c);
  assert.equal(r.plan[0].after.name, 'Lee'); assert.equal(r.counts.更新, 1);
});
test('quoted CSV newlines and escaped quotes survive parsing', () => { assert.equal(parseCsv('name,note\nLee,"one\n""two"""\n')[0].note, 'one\n"two"'); });
test('malformed CSV rejected; duplicate existing identities do not merge', () => {
  assert.throws(() => parseCsv('x,y\n"bad,y'), /Unclosed/); assert.throws(() => parseCsv('x,x\na,b'), /headers/);
  assert.equal(previewImport('id,name\na,A\na,B', 'id,name\na,C', { key: 'id', update: ['name'] }).counts.待确认, 1);
});
