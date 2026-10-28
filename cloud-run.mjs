// Cloud test runner: starts an actor run, waits, and reports cost + depth
// metrics. Usage: node cloud-run.mjs <name> '<inputJson>' [memoryMbytes]
import fs from 'fs';

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) throw new Error('APIFY_TOKEN is required.');
const ACTOR = 'Ul5IlSzk7K0Lh8Qd6';
const name = process.argv[2] || 'run';
const input = JSON.parse(process.argv[3] || '{}');
const memory = Number(process.argv[4] || 1024);
const outDir = 'work/cloud-runs';
fs.mkdirSync(outDir, { recursive: true });

const api = (path, init) => fetch(`https://api.apify.com/v2/${path}${path.includes('?') ? '&' : '?'}token=${TOKEN}`, init);

const started = Date.now();
const startRes = await api(`acts/${ACTOR}/runs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...input, memoryMbytes: memory }),
});
const startJson = await startRes.json();
if (!startRes.ok) {
  console.log(JSON.stringify({ ok: false, name, status: startRes.status, error: startJson }, null, 1));
  process.exit(1);
}
const runId = startJson.data.id;
const datasetId = startJson.data.defaultDatasetId;
const kvId = startJson.data.defaultKeyValueStoreId;
console.log(JSON.stringify({ ok: true, name, runId, datasetId }));

let run = null;
for (let i = 0; i < 120; i += 1) {
  await new Promise((r) => setTimeout(r, 10000));
  const res = await api(`actor-runs/${runId}`);
  run = (await res.json()).data;
  if (['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) break;
}

const itemsRes = await api(`datasets/${datasetId}/items?limit=2000&clean=true`);
const items = await itemsRes.json();
const outRes = await api(`key-value-stores/${kvId}/records/OUTPUT`);
const output = await outRes.json().catch(() => null);
const logRes = await api(`logs/${runId}`);
const logText = await logRes.text();

const ids = new Set(items.map((i) => i.source_comment_id).filter(Boolean));
const depths = items.reduce((acc, i) => { const d = Number(i.depth) || 0; acc[d] = (acc[d] || 0) + 1; return acc; }, {});
const stats = {
  status: run?.status,
  wallSecs: Math.round((Date.now() - started) / 1000),
  runSecs: run?.stats?.runTimeSecs,
  computeUnits: run?.stats?.computeUnits,
  rows: items.length,
  uniqueIds: ids.size,
  depths,
  summary: output?.summaries || output,
  logTail: logText.split('\n').filter((l) => /Throttle|Done post|top intent|reply |blocked/i.test(l)).slice(-25),
};
fs.writeFileSync(`${outDir}/${name}.json`, JSON.stringify({ input, runId, stats, items }, null, 2));
console.log(JSON.stringify({ ok: true, name, runId, stats }, null, 1));
