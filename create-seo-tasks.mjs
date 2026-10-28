// Create, smoke-test, publish, and verify the four focused Store task pages.
const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) throw new Error('APIFY_TOKEN is required.');
const ACTOR_ID = 'Ul5IlSzk7K0Lh8Qd6';
const ACTOR_SLUG = 'facebook-comments-scraper';
const PUBLIC_DOMAIN = 'https://apify.com/spbotdel';

const HONY =
  'https://www.facebook.com/humansofnewyork/posts/pfbid0BbKbkisExKGSKuhee9a7i86RwRuMKFC8NSkKStB7CsM3uXJuAAfZLrkcJMXxhH4Yl';
const STORY =
  'https://www.facebook.com/story.php?story_fbid=2001486937181800&id=212952699368575';
const GROUP_POST =
  'https://www.facebook.com/groups/2333220550043074/permalink/29037764019162031/';

const definitions = [
  {
    name: 'comment-thread-demo',
    title: 'Comment thread demo',
    description:
      'Extract a public Facebook comment thread with authors, reactions, timestamps, replies and stable links into one structured dataset. The demo runs on a public post and shows the same JSON, CSV or Excel output available from the full Actor. No Facebook login or cookies. From $1.20 per 1,000 comments on BRONZE+.',
    seoTitle: 'Facebook Comments Scraper Demo',
    seoDescription:
      'Scrape a public Facebook comment thread with authors, replies, reactions and stable links. Export JSON, CSV or Excel without login. From $1.20/1k.',
    inputFields: [
      'postUrls',
      'maxCommentsPerPost',
      'includeReplies',
      'commentsSortOrder',
      'unionSorts',
      'includePostText',
    ],
    input: {
      postUrls: [HONY],
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
    },
  },
  {
    name: 'scrape-facebook-replies-and-reactions',
    title: 'Scrape Facebook replies and reactions',
    description:
      'Extract a public Facebook post comment thread with nested replies, author details, text, timestamps, reaction totals and per-type reaction breakdowns. One dataset row per comment or reply, ready for JSON, CSV or Excel export. No Facebook login or cookies. From $1.20 per 1,000 comments on BRONZE+.',
    seoTitle: 'Facebook Replies & Reactions Scraper',
    seoDescription:
      'Extract public Facebook comments, nested replies, authors, reactions and timestamps to JSON, CSV or Excel. No login. From $1.20/1k.',
    inputFields: [
      'postUrls',
      'maxCommentsPerPost',
      'includeReplies',
      'maxReplyThreadsPerPost',
      'maxRepliesPerPost',
      'includePostText',
    ],
    input: {
      postUrls: [HONY],
      maxPostsPerRun: 1,
      maxConcurrency: 1,
      maxCommentsPerPost: 25,
      maxPagesPerPost: 5,
      includeReplies: true,
      maxReplyThreadsPerPost: 10,
      maxRepliesPerPost: 20,
      commentsSortOrder: 'MOST_RELEVANT',
      unionSorts: false,
      pageDelayMs: 1000,
      proxyTier: 'auto',
      includePostText: true,
    },
  },
  {
    name: 'monitor-new-facebook-comments',
    title: 'Monitor new Facebook comments',
    description:
      'Track new public comments on one or more Facebook posts with newest-first ordering and cross-run deduplication. Schedule the task, reuse the same dedupe store, and receive only comments not delivered in earlier runs. Optional failure on empty runs makes broken monitors visible. No login or cookies. From $1.20 per 1,000 comments on BRONZE+.',
    seoTitle: 'Facebook Comment Monitoring Tool',
    seoDescription:
      'Monitor new public Facebook comments with newest-first collection and cross-run deduplication. Export structured JSON, CSV or Excel. From $1.20/1k.',
    inputFields: [
      'postUrls',
      'maxCommentsPerPost',
      'commentsSortOrder',
      'dedupeStoreName',
      'failOnEmpty',
      'includePostText',
    ],
    input: {
      postUrls: [HONY],
      maxPostsPerRun: 1,
      maxConcurrency: 1,
      maxCommentsPerPost: 25,
      maxPagesPerPost: 5,
      includeReplies: false,
      commentsSortOrder: 'NEWEST',
      unionSorts: false,
      dedupeStoreName: 'facebook-comment-monitor-demo',
      failOnEmpty: false,
      pageDelayMs: 1000,
      proxyTier: 'auto',
      includePostText: true,
    },
  },
  {
    name: 'analyze-competitor-facebook-comments',
    title: 'Analyze competitor Facebook comments',
    description:
      'Collect public comments from competitor, brand or campaign posts for social listening. Compare text, authors, timestamps, reactions and reply threads across multiple post URLs in one run, then export one structured row per comment to JSON, CSV or Excel. No login or cookies. From $1.20 per 1,000 comments on BRONZE+.',
    seoTitle: 'Competitor Facebook Comment Analysis',
    seoDescription:
      'Collect public competitor Facebook comments for social listening: text, authors, reactions, replies and timestamps across multiple posts. From $1.20/1k.',
    inputFields: [
      'postUrls',
      'maxPostsPerRun',
      'maxConcurrency',
      'maxCommentsPerPost',
      'includeReplies',
      'includePostText',
    ],
    input: {
      postUrls: [HONY, STORY],
      maxPostsPerRun: 2,
      maxConcurrency: 2,
      maxCommentsPerPost: 20,
      maxPagesPerPost: 4,
      includeReplies: true,
      maxReplyThreadsPerPost: 5,
      maxRepliesPerPost: 10,
      commentsSortOrder: 'MOST_RELEVANT',
      unionSorts: false,
      pageDelayMs: 1000,
      proxyTier: 'auto',
      includePostText: true,
    },
  },
  {
    name: 'scrape-facebook-group-post-comments',
    title: 'Scrape comments from a Facebook group post',
    description:
      'Extract publicly served comments from a public Facebook group post permalink with authors, text, timestamps, reactions and replies. The Actor reports the logged-out group cap and coverage percentage instead of pretending the thread is complete. Export JSON, CSV or Excel; no login or cookies. From $1.20 per 1,000 comments on BRONZE+.',
    seoTitle: 'Facebook Group Comments Scraper',
    seoDescription:
      'Scrape public Facebook group post comments without cookies. Get authors, reactions, replies, coverage diagnostics and JSON, CSV or Excel export. From $1.20/1k.',
    inputFields: [
      'postUrls',
      'maxCommentsPerPost',
      'includeReplies',
      'includePostText',
      'proxyTier',
    ],
    input: {
      postUrls: [GROUP_POST],
      maxPostsPerRun: 1,
      maxConcurrency: 1,
      maxCommentsPerPost: 25,
      maxPagesPerPost: 5,
      includeReplies: true,
      maxReplyThreadsPerPost: 5,
      maxRepliesPerPost: 10,
      commentsSortOrder: 'MOST_RELEVANT',
      unionSorts: false,
      pageDelayMs: 1000,
      proxyTier: 'auto',
      includePostText: true,
    },
  },
  {
    name: 'export-facebook-comments-to-csv',
    title: 'Export Facebook comments to CSV',
    description:
      'Export public Facebook comments and replies from post URLs into a structured dataset ready for CSV, Excel or JSON downloads. One row per comment includes text, author, timestamp, reactions, reply depth and a stable comment URL. No login or cookies. From $1.20 per 1,000 comments on BRONZE+.',
    seoTitle: 'Export Facebook Comments to CSV',
    seoDescription:
      'Export public Facebook comments and replies to CSV, Excel or JSON with text, authors, timestamps, reactions and stable URLs. From $1.20/1k.',
    inputFields: [
      'postUrls',
      'maxCommentsPerPost',
      'includeReplies',
      'includePostText',
      'commentsSortOrder',
    ],
    input: {
      postUrls: [HONY],
      maxPostsPerRun: 1,
      maxConcurrency: 1,
      maxCommentsPerPost: 25,
      maxPagesPerPost: 5,
      includeReplies: false,
      commentsSortOrder: 'MOST_RELEVANT',
      unionSorts: false,
      pageDelayMs: 1000,
      proxyTier: 'auto',
      includePostText: true,
    },
  },
  {
    name: 'monitor-brand-mentions-in-facebook-comments',
    title: 'Monitor brand mentions in Facebook comments',
    description:
      'Monitor comments on selected public Facebook posts for brand mentions. Use newest-first ordering and a stable dedupe store to return only new comments across scheduled runs. Filter or score the returned text in your own pipeline; the Actor collects public comment data and extracted URLs. No login or cookies. From $1.20 per 1,000 comments on BRONZE+.',
    seoTitle: 'Facebook Brand Mention Monitor',
    seoDescription:
      'Monitor new comments on selected public Facebook posts for brand analysis with newest-first collection and cross-run deduplication. From $1.20/1k.',
    inputFields: [
      'postUrls',
      'maxCommentsPerPost',
      'commentsSortOrder',
      'dedupeStoreName',
      'failOnEmpty',
      'includePostText',
    ],
    input: {
      postUrls: [HONY],
      maxPostsPerRun: 1,
      maxConcurrency: 1,
      maxCommentsPerPost: 25,
      maxPagesPerPost: 5,
      includeReplies: false,
      commentsSortOrder: 'NEWEST',
      unionSorts: false,
      dedupeStoreName: 'brand-mention-monitor-demo',
      failOnEmpty: false,
      pageDelayMs: 1000,
      proxyTier: 'auto',
      includePostText: true,
    },
  },
  {
    name: 'build-ai-ready-facebook-comment-dataset',
    title: 'Build an AI-ready Facebook comment dataset',
    description:
      'Build a structured Facebook comment dataset for AI, RAG and agent workflows. Each row includes comment text, author, timestamp, reactions, parent linkage, depth, extracted URLs and optional post text, with a schema exposed through the Apify API and MCP. No login or cookies. From $1.20 per 1,000 comments on BRONZE+.',
    seoTitle: 'AI-Ready Facebook Comment Dataset',
    seoDescription:
      'Build a structured Facebook comment dataset for AI and RAG workflows: text, authors, reactions, timestamps, thread links and MCP-ready output.',
    inputFields: [
      'postUrls',
      'maxCommentsPerPost',
      'includeReplies',
      'unionSorts',
      'includePostText',
      'commentsSortOrder',
    ],
    input: {
      postUrls: [HONY],
      maxPostsPerRun: 1,
      maxConcurrency: 1,
      maxCommentsPerPost: 30,
      maxPagesPerPost: 6,
      includeReplies: true,
      maxReplyThreadsPerPost: 10,
      maxRepliesPerPost: 20,
      commentsSortOrder: 'MOST_RELEVANT',
      unionSorts: true,
      pageDelayMs: 1000,
      proxyTier: 'auto',
      includePostText: true,
    },
  },
];

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

const existingTasks = (await api('actor-tasks?limit=1000&desc=1')).data.items
  .filter((task) => task.actId === ACTOR_ID);

for (const definition of definitions) {
  const existing = existingTasks.find((task) => task.name === definition.name);
  const options = {
    build: 'latest',
    timeoutSecs: 900,
    memoryMbytes: 1024,
    maxTotalChargeUsd: 1,
  };

  let task;
  if (existing) {
    task = (await api(`actor-tasks/${existing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: definition.title,
        description: definition.description,
        input: definition.input,
        options,
      }),
    })).data;
    console.log('updated task:', definition.name, task.id);
  } else {
    task = (await api('actor-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actId: ACTOR_ID,
        name: definition.name,
        title: definition.title,
        description: definition.description,
        input: definition.input,
        options,
      }),
    })).data;
    console.log('created task:', definition.name, task.id);
  }

  if (!existing || process.env.FORCE_SMOKE === '1') {
    const run = (await api(`actor-tasks/${task.id}/runs?waitForFinish=180`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })).data;
    const rows = await api(`datasets/${run.defaultDatasetId}/items?limit=1000`);
    console.log(
      'smoke:',
      JSON.stringify(
        {
          name: definition.name,
          runId: run.id,
          status: run.status,
          rows: rows.length,
          usageTotalUsd: run.usageTotalUsd,
        },
        null,
        2,
      ),
    );
    if (run.status !== 'SUCCEEDED') throw new Error(`${definition.name} run failed: ${run.status}`);
    if (rows.length === 0) throw new Error(`${definition.name} returned zero rows`);
  } else {
    console.log('existing task, smoke skipped:', definition.name);
  }

  task = (await api(`actor-tasks/${task.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      publicConfig: {
        seoTitle: definition.seoTitle,
        seoDescription: definition.seoDescription,
        inputSchemaFields: definition.inputFields,
        datasetView: 'comments',
      },
      isPublic: true,
    }),
  })).data;

  if (task.isPublic !== true) throw new Error(`${definition.name} was not published`);

  const url = `${PUBLIC_DOMAIN}/${ACTOR_SLUG}/examples/${definition.name}`;
  const response = await fetch(url);
  const html = await response.text();
  console.log(
    'published:',
    JSON.stringify(
      {
        name: definition.name,
        id: task.id,
        url,
        pageStatus: response.status,
        pageTitle: html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || null,
      },
      null,
      2,
    ),
  );
  if (response.status !== 200) throw new Error(`${definition.name} public page returned ${response.status}`);
}
