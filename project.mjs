import { field, column, view, metric, item, csvArtifact, jsonArtifact, summary } from './lib/product-kit.mjs';
import { parseCsv } from './core.mjs';
export function mergedRecords(result,input) {
  const rows=parseCsv(input.existing).map(({__row,...row})=>row),key=input.contract.key;
  const normalize=value=>input.contract.normalizePhone?String(value??'').replace(/[\s()+-]/g,''):String(value??'').trim();
  for(const operation of result.plan){
    if(operation.type==='新增'){const {__row,...record}=operation.after;rows.push(record);}
    if(operation.type==='更新'){const index=rows.findIndex(row=>normalize(row[key])===operation.key);if(index<0)throw Error('Import plan no longer matches its input snapshot');const {__row,...record}=operation.after;rows[index]=record;}
  }
  return rows;
}
export const product = {
  category: 'Import operations', projectNoun: 'Import project', runLabel: 'Build import plan',
  outcome: 'Review a complete import batch, resolve held rows and export the approved changes.',
  fields: [
    field('existing', 'Current records', 'filetext', { accept: '.csv,text/csv', help: 'Upload or paste a CSV snapshot. The source system is never modified.' }),
    field('incoming', 'Incoming batch', 'filetext', { accept: '.csv,text/csv' }),
    field('contract.key', 'Identity column'), field('contract.update', 'Columns allowed to change', 'list'),
    field('contract.required', 'Required columns', 'list'), field('contract.normalizePhone', 'Normalize phone formatting', 'boolean'),
  ],
  describe(result) {
    return summary(Object.entries(result.counts).map(([key,value]) => metric(key,value)), [
      view('Row decisions', [column('sourceRow','Source row'),column('key','Identity'),column('type','Operation'),column('reason','Hold reason'),column('changes','Field changes')], result.plan),
    ], result.plan.filter(row => row.type !== '跳过').map(row => item(`row:${row.sourceRow}`,`${row.type} · ${row.key || 'missing identity'}`,row.reason || (row.changes || []).map(c => `${c.field}: ${c.before ?? '(empty)'} → ${c.after}`).join('; '),row.type === '待确认')));
  },
  artifacts(result,input) {
    const rows = result.plan.map(row => ({sourceRow:row.sourceRow,key:row.key,operation:row.type,reason:row.reason || '',changes:row.changes || []}));
    const columns = [column('sourceRow','Source row'),column('key','Identity'),column('operation','Operation'),column('reason','Hold reason'),column('changes','Changes')];
    const changeColumns=[column('sourceRow','Source row'),column('key','Identity'),column('field','Field'),column('before','Before'),column('after','After')];
    const output=[csvArtifact('plan','Import plan',columns,rows),csvArtifact('changes','Field changes',changeColumns,result.plan.flatMap(row => (row.changes || []).map(c=>({...c,sourceRow:row.sourceRow,key:row.key}))))];
    if(result.counts['待确认']===0)output.push(jsonArtifact('merged-records','Merged records (exact values; no source write)',{key:input.contract.key,records:mergedRecords(result,input)}));
    return output;
  },
};
