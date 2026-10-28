// Apply the approved Store and SEO display fields to the private comments Actor.
// Publication is intentionally not changed by this script.
const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) throw new Error('APIFY_TOKEN is required.');
const ACTOR_ID = 'Ul5IlSzk7K0Lh8Qd6';

const display = {
  title: 'Facebook Post Comments Scraper',
  description:
    'Scrape public Facebook post comments and deep reply threads without cookies or login. Extract comment text, authors, timestamps, reactions, stable URLs, post text, and thread relationships from up to 100 posts per run. Export structured data through the Apify API, MCP, schedules, and webhooks.',
  seoTitle: 'Facebook Comments Scraper with Replies & Reactions',
  seoDescription:
    'Scrape public Facebook comments and replies without cookies or login. Get text, authors, reactions, timestamps, URLs, and coverage data via API or MCP.',
  categories: ['SOCIAL_MEDIA', 'MCP_SERVERS', 'AUTOMATION'],
};

const readActor = async () => {
  const response = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}?token=${TOKEN}`);
  const body = await response.json();
  if (!response.ok) throw new Error(`GET failed: ${response.status} ${JSON.stringify(body)}`);
  return body.data;
};

const before = await readActor();
console.log('before:', JSON.stringify({
  title: before.title,
  description: before.description,
  seoTitle: before.seoTitle,
  seoDescription: before.seoDescription,
  categories: before.categories,
  isPublic: before.isPublic,
}, null, 2));

const response = await fetch(`https://api.apify.com/v2/actors/${ACTOR_ID}?token=${TOKEN}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(display),
});
const responseText = await response.text();
console.log('PUT', response.status, responseText.slice(0, 300).replace(/\s+/g, ' '));
if (!response.ok) throw new Error(`PUT failed: ${response.status} ${responseText}`);

const after = await readActor();
const actual = {
  title: after.title,
  description: after.description,
  seoTitle: after.seoTitle,
  seoDescription: after.seoDescription,
  categories: after.categories,
  isPublic: after.isPublic,
};
console.log('after:', JSON.stringify(actual, null, 2));

const mismatches = Object.entries(display).filter(([key, value]) => {
  if (Array.isArray(value)) return JSON.stringify(actual[key]) !== JSON.stringify(value);
  return actual[key] !== value;
});
if (mismatches.length) throw new Error(`Store listing did not persist: ${JSON.stringify(mismatches)}`);
if (after.isPublic !== false) throw new Error('Publication state changed unexpectedly');
