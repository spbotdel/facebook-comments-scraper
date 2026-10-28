// Create, run, publish, and verify the public Store demo task for the comments Actor.
const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) throw new Error('APIFY_TOKEN is required.');
const ACTOR_ID = 'Ul5IlSzk7K0Lh8Qd6';
const TASK_NAME = 'comment-thread-demo';

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

const input = {
  postUrls: [
    'https://www.facebook.com/humansofnewyork/posts/pfbid0BbKbkisExKGSKuhee9a7i86RwRuMKFC8NSkKStB7CsM3uXJuAAfZLrkcJMXxhH4Yl',
  ],
  maxPostsPerRun: 1,
  maxConcurrency: 1,
  maxCommentsPerPost: 40,
  maxPagesPerPost: 8,
  includeReplies: true,
  maxReplyThreadsPerPost: 10,
  maxRepliesPerPost: 30,
  commentsSortOrder: 'MOST_RELEVANT',
  unionSorts: true,
  pageDelayMs: 700,
  proxyTier: 'auto',
  includePostText: true,
};

const existing = (await api(`actor-tasks?limit=1000&desc=1`)).data.items
  .find((task) => task.actId === ACTOR_ID && task.name === TASK_NAME);

let task = existing;
if (task) {
  console.log('existing task:', task.id);
  await api(`actor-tasks/${task.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Comment thread demo',
      description: 'Extract a public Facebook comment thread with authors, reactions, timestamps, replies, and stable links.',
      input,
      options: { build: 'latest', timeoutSecs: 900, memoryMbytes: 1024, maxTotalChargeUsd: 1 },
    }),
  });
} else {
  const created = await api('actor-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actId: ACTOR_ID,
      name: TASK_NAME,
      title: 'Comment thread demo',
      description: 'Extract a public Facebook comment thread with authors, reactions, timestamps, replies, and stable links.',
      input,
      options: { build: 'latest', timeoutSecs: 900, memoryMbytes: 1024, maxTotalChargeUsd: 1 },
    }),
  });
  task = created.data;
  console.log('created task:', task.id);
}

const runPayload = await api(
  `actor-tasks/${task.id}/runs?waitForFinish=180`,
  { method: 'POST', headers: { 'Content-Type': 'application/json' } },
);
const run = runPayload.data;
console.log(
  'demo run:',
  JSON.stringify(
    {
      id: run.id,
      status: run.status,
      datasetId: run.defaultDatasetId,
      usageTotalUsd: run.usageTotalUsd,
    },
    null,
    2,
  ),
);
if (run.status !== 'SUCCEEDED') throw new Error(`Demo run did not succeed: ${run.status}`);

const items = await api(`datasets/${run.defaultDatasetId}/items?limit=1000`);
console.log('dataset rows:', items.length);
if (items.length < 10) throw new Error(`Demo run returned only ${items.length} rows`);

await api(`actor-tasks/${task.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    publicConfig: {
      seoTitle: 'Facebook Comments Scraper Demo',
      seoDescription:
        'Run a ready-made public Facebook comment thread demo with authors, text, reactions and replies.',
      inputSchemaFields: [
        'postUrls',
        'maxCommentsPerPost',
        'includeReplies',
        'commentsSortOrder',
        'unionSorts',
        'includePostText',
      ],
      datasetView: 'comments',
    },
    isPublic: true,
  }),
});

const publishedTask = (await api(`actor-tasks/${task.id}`)).data;
console.log(
  'published task:',
  JSON.stringify(
    {
      id: publishedTask.id,
      name: publishedTask.name,
      title: publishedTask.title,
      isPublic: publishedTask.isPublic,
      publicConfig: publishedTask.publicConfig,
    },
    null,
    2,
  ),
);
if (publishedTask.isPublic !== true) throw new Error('Demo task was not published');
