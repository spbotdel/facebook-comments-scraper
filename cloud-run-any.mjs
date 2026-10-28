// Generic Apify actor runner with cost/deep metrics.
// Usage: node cloud-run-any.mjs <actorId> <name> '<inputJson>' [memoryMbytes]
import fs from 'fs';

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) throw new Error('APIFY_TOKEN is required.');
const actor = process.argv[2];
const name = process.argv[3] || 'run';
const input = JSON.parse(process.argv[4] || '{}');
const memory = Number(process.argv[5] || 1024);
const outDir = 'work/cloud-runs';
fs.mkdirSync(outDir, { recursive: true });

const api = (path, init) => fetch(`https://api.apify.com/v2/${path}${path.includes('?') ? '&' : '?'}token=${TOKEN}`, init);

const started = Date.now();
const startRes = await api(`acts/${actor}/runs`, {
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
console.log(JSON.stringify({ ok: true, name, runId, datasetId }));

let run = null;
for (let i = 0; i < 180; i += 1) {
  await new Promise((r) => setTimeout(r, 10000));
  run = (await (await api(`actor-runs/${runId}`)).json()).data;
  if (['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) break;
}

const ds = (await (await api(`datasets/${datasetId}`)).json()).data;
const rows = ds?.itemCount ?? 0;
const u = run?.usage || {};
const cu = u.ACTOR_COMPUTE_UNITS || 0;
const proxyGb = u.PROXY_RESIDENTIAL_TRANSFER_GBYTES || 0;
const extGb = u.DATA_TRANSFER_EXTERNAL_GBYTES || 0;
const usd = run?.usageTotalUsd || 0;
const stats = {
  status: run?.status,
  wallSecs: Math.round((Date.now() - started) / 1000),
  runSecs: run?.stats?.runTimeSecs,
  rows,
  usd,
  per1000Usd: rows ? (usd / rows) * 1000 : null,
  computeUnits: cu,
  computeUsd: cu * 0.2,
  proxyGb,
  proxyMbPerRow: rows ? (proxyGb * 1024 * 1024) / rows / 1024 : null,
  proxyUsd: proxyGb * 8,
  extGb,
};
fs.writeFileSync(`${outDir}/${name}.json`, JSON.stringify({ actor, input, runId, stats }, null, 2));
console.log(JSON.stringify({ ok: true, name, runId, stats }, null, 1));
