// Update the private Actor's source documentation and schemas, then build a new
// private version. This script never changes isPublic.
import fs from 'fs';

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) throw new Error('APIFY_TOKEN is required.');
const ACTOR_ID = 'Ul5IlSzk7K0Lh8Qd6';
const VERSION = '0.0';

const filesToUpdate = [
  'README.md',
  '.actor/actor.json',
  '.actor/input_schema.json',
  '.actor/dataset_schema.json',
];

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const api = async (path, options = {}) => {
  const separator = path.includes('?') ? '&' : '?';
  const response = await fetch(`https://api.apify.com/v2/${path}${separator}token=${TOKEN}`, options);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path} failed: ${response.status} ${text}`);
  return body;
};

const versionPayload = await api(`acts/${ACTOR_ID}/versions/${VERSION}`);
const sourceFiles = versionPayload.data.sourceFiles || [];
const byName = new Map(sourceFiles.map((file) => [file.name, file]));

for (const name of filesToUpdate) {
  const content = fs.readFileSync(name, 'utf8');
  if (byName.has(name)) {
    byName.get(name).content = content;
    byName.get(name).format = 'TEXT';
  } else {
    byName.set(name, { name, format: 'TEXT', content });
  }
  console.log('updated source:', name, `${content.length} chars`);
}

const updatedSourceFiles = [...byName.values()];
await api(`acts/${ACTOR_ID}/versions/${VERSION}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sourceFiles: updatedSourceFiles }),
});
console.log('source version updated:', VERSION, 'files:', updatedSourceFiles.length);

const buildPayload = await api(
  `acts/${ACTOR_ID}/builds?version=${VERSION}&useCache=0&waitForFinish=180`,
  { method: 'POST' },
);
const build = buildPayload.data;
console.log(
  'build:',
  JSON.stringify(
    {
      id: build.id,
      number: build.buildNumber,
      status: build.status,
      startedAt: build.startedAt,
      finishedAt: build.finishedAt,
    },
    null,
    2,
  ),
);
if (build.status !== 'SUCCEEDED') {
  throw new Error(`Build did not succeed: ${build.status} ${build.id}`);
}

const actor = await api(`acts/${ACTOR_ID}`);
const latest = actor.data.taggedBuilds?.latest;
console.log(
  'latest:',
  JSON.stringify(
    {
      buildId: latest?.buildId,
      buildNumber: latest?.buildNumber,
      isPublic: actor.data.isPublic,
    },
    null,
    2,
  ),
);
if (latest?.buildId !== build.id) throw new Error('New build was not tagged latest');
if (actor.data.isPublic !== true) throw new Error('Published Actor became private unexpectedly');
