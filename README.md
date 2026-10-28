**Scrape public Facebook post comments and full reply threads without cookies, login, or a browser.**

Facebook Post Comments Scraper turns Facebook post URLs into a clean dataset with one row per public comment or reply. It walks Facebook's comment cursor to the end of the served thread, expands reply threads, preserves parent-child relationships, and reports exactly how much public content was available.

Use it for social listening, sentiment analysis, community research, brand monitoring, lead enrichment, moderation, and AI workflows. Results are available through the Apify API, MCP server, scheduled runs, webhooks, and JSON, CSV, Excel, or other dataset exports.

Try the ready-made public demo: [Comment thread demo](https://apify.com/spbotdel/facebook-comments-scraper/examples/comment-thread-demo).

## What can this Facebook comments scraper extract?

- Comment and reply text, unchanged.
- Author name, profile ID, profile URL, and profile picture when Facebook exposes them.
- ISO timestamp and Unix creation time.
- Total reactions, likes, reaction-count field, and per-type reaction breakdown when available.
- Reply count, parent comment ID, root/nesting depth, and stable comment URL.
- Post URL, post ID, optional post text, and extracted HTTP links from each comment.
- One summary record with the announced comment count, collected count, coverage percentage, stop reason, and whether Facebook blocked the public comment list.

The Actor outputs one dataset row per public comment or reply. A reply is linked to its parent through `parent_comment_id` and includes its `depth`, so you can reconstruct the conversation without guessing.

## Why use this Actor?

### No cookies, login, or browser session

The Actor fetches the same logged-out surface a public visitor sees. There is no Facebook account to connect, no cookie export, no session to expire, and no account to get banned.

### Real cursor pagination, not a 10-comment preview

Facebook normally serves 10 comments per request. This Actor follows the opaque end cursor until Facebook stops serving the thread. In verification, it collected 400 distinct comments from one public post in 40 requests while the cursor was still live.

### Reply threads are expanded and paged

For supported public content, the Actor walks each reply thread through Facebook's depth pagination. A verified run collected 81 of 83 replies in 9 requests, including nested sub-replies. Replies count toward `maxCommentsPerPost`, and the Actor reserves space for them automatically.

### Built for batches and monitoring

Process up to 100 post URLs per run, with 1 to 20 posts in parallel. Each post keeps its own cursor and pacing. For recurring jobs, `dedupeStoreName`, `knownCommentIds`, and `knownDatasetId` avoid returning comments you already delivered.

### Honest coverage reporting

Facebook's displayed total includes comments and replies that are hidden from signed-out visitors. Public comments can also be filtered or private. The Actor does not pretend that its count is the total on the post. It reports `announcedComments`, collected rows, `coveragePercent`, `blocked`, and `stopReason` in the run summary.

### Flexible proxy routing

`proxyTier: "auto"` starts with the cheaper datacenter pool and automatically falls back to residential proxies when Facebook blocks the request. You can also force `datacenter` or `residential`.

### Apify platform features included

Run from the Console or API, schedule recurring monitoring, configure webhooks, download datasets in multiple formats, and use the same Actor from the Apify MCP server.

## Supported Facebook URLs and public-content limits

| Surface | Without login | Notes |
|---|---|---|
| Page post: `/posts/pfbid...` | Supported | Cursor-paged public comments and replies. |
| Group permalink: `/groups/.../permalink/...` | Supported with a Facebook cap | Facebook usually stops the logged-out group thread before the announced total and may return only a reply teaser. |
| Legacy post: `story.php?story_fbid=...` | Supported | Canonicalized before comment paging. |
| Video page: `/videos/...` | Supported | Verified where Facebook serves the public comment list. |
| Reels: `/reel/...` | Not served without login | The page may show a comment count, but Facebook returns an empty list to signed-out visitors. |
| Photos: `/photo?fbid=...` | Not served without login | Same public-login boundary as Reels. |
| Watch: `/watch/?v=...` | Not served without login | Use a supported post or video permalink when possible. |

Unsupported public surfaces are still accepted so the Actor can detect them and write a clear `blocked` marker in the run summary. They are not silently reported as successful empty scrapes.

### Why the collected count can be lower than Facebook's counter

The number displayed on a post includes top-level comments, replies, private or friends-only comments, filtered comments, and content hidden from signed-out visitors. A cookie-free scraper can only collect what Facebook serves publicly. A logged-out browser sees the same wall. This is a platform limitation, not a parsing error or a proxy failure.

For maximum public coverage, keep `includeReplies: true` and `unionSorts: true`. On a post that announced 168 comments, walking replies and both sort windows increased the result from 94 to 129 publicly served rows. The summary reports that as roughly 77% coverage instead of pretending 129 was the real total.

## Quick start

### Minimal input

```json
{
  "postUrls": [
    "https://www.facebook.com/humansofnewyork/posts/pfbid0BbKbkisExKGSKuhee9a7i86RwRuMKFC8NSkKStB7CsM3uXJuAAfZLrkcJMXxhH4Yl"
  ],
  "maxCommentsPerPost": 100
}
```

### Bulk scrape with replies

```json
{
  "postUrls": [
    "https://www.facebook.com/page/posts/123",
    "https://www.facebook.com/groups/123/permalink/456/"
  ],
  "maxPostsPerRun": 20,
  "maxConcurrency": 5,
  "maxCommentsPerPost": 500,
  "includeReplies": true,
  "maxReplyThreadsPerPost": 50,
  "maxRepliesPerPost": 300,
  "unionSorts": true,
  "pageDelayMs": 1000
}
```

### Return only new comments on a schedule

```json
{
  "postUrls": [
    "https://www.facebook.com/page/posts/123"
  ],
  "commentsSortOrder": "NEWEST",
  "onlyCommentsNewerThan": "7 days",
  "dedupeStoreName": "brand-comment-monitor",
  "failOnEmpty": true
}
```

The first scheduled run stores delivered comment IDs under `brand-comment-monitor`. Later runs return only IDs they have not delivered before, assuming the same key-value store name is reused.

## Example tasks

Ready-to-run task pages for common Facebook comment workflows:

- [Comment thread demo](https://apify.com/spbotdel/facebook-comments-scraper/examples/comment-thread-demo) - inspect a complete demo thread.
- [Scrape Facebook replies and reactions](https://apify.com/spbotdel/facebook-comments-scraper/examples/scrape-facebook-replies-and-reactions) - collect nested replies and reaction breakdowns.
- [Monitor new Facebook comments](https://apify.com/spbotdel/facebook-comments-scraper/examples/monitor-new-facebook-comments) - run a recurring newest-first monitor with deduplication.
- [Analyze competitor Facebook comments](https://apify.com/spbotdel/facebook-comments-scraper/examples/analyze-competitor-facebook-comments) - compare comments across multiple competitor or campaign posts.
- [Scrape comments from a Facebook group post](https://apify.com/spbotdel/facebook-comments-scraper/examples/scrape-facebook-group-post-comments) - collect the public portion of a group post thread with coverage diagnostics.
- [Export Facebook comments to CSV](https://apify.com/spbotdel/facebook-comments-scraper/examples/export-facebook-comments-to-csv) - download comment text and metadata for spreadsheets or BI tools.
- [Monitor brand mentions in Facebook comments](https://apify.com/spbotdel/facebook-comments-scraper/examples/monitor-brand-mentions-in-facebook-comments) - track new comments on selected public posts for downstream brand analysis.
- [Build an AI-ready Facebook comment dataset](https://apify.com/spbotdel/facebook-comments-scraper/examples/build-ai-ready-facebook-comment-dataset) - produce structured JSON with thread linkage and an MCP-ready schema.

## Input reference

| Field | Type | Default | What it does |
|---|---|---:|---|
| `postUrls` | array | required | Public Facebook post, group permalink, video, `pfbid`, or `story.php` URLs. Unsupported public surfaces are marked `blocked`. |
| `maxCommentsPerPost` | integer | 300 | Hard cap for top-level comments plus replies per post. Maximum 1000. |
| `maxPostsPerRun` | integer | 5 | Maximum URLs processed in one run. Maximum 100; duplicate URLs are skipped. |
| `maxConcurrency` | integer | 5 | Parallel posts, 1 to 20. Each post has its own cursor and pacing. |
| `commentsSortOrder` | enum | `MOST_RELEVANT` | `MOST_RELEVANT`, `NEWEST`, or `ALL_COMMENTS`. |
| `unionSorts` | boolean | true | Walks both the default and newest windows, then merges unique comment IDs. |
| `includeReplies` | boolean | true | Expands reply-bearing top-level comments. |
| `maxReplyThreadsPerPost` | integer | 20 | Number of reply threads to expand, fattest first. `0` disables reply expansion. |
| `maxRepliesPerPost` | integer | 200 | Reply row cap per post. Replies also count toward `maxCommentsPerPost`. |
| `onlyCommentsNewerThan` | string | off | Absolute date or relative value such as `2026-04-20`, `30 days`, `12 hours`, or `2 weeks`. |
| `pageDelayMs` | integer | 1000 | Pause between GraphQL pages. Default 1000 ms is safest; 200-400 ms has been tested for faster runs. |
| `maxPagesPerPost` | integer | 60 | Safety stop for the cursor walk. At roughly 10 comments per page, 60 pages covers about 600 rows. |
| `introDelayMs` | integer | 1500 | Settle time after loading the permalink before the first GraphQL request. |
| `knownCommentIds` | array | off | IDs to skip during incremental monitoring. |
| `knownDatasetId` | string | off | Previous dataset whose comment IDs should be skipped. The Actor needs permission to read that dataset. |
| `dedupeStoreName` | string | off | Stable key-value store name for remembering delivered IDs between runs. |
| `failOnEmpty` | boolean | false | Marks the run failed when zero comments are collected, useful for scheduled runs. |
| `includePostText` | boolean | false | Copies the post caption into every row as `post_text` at no extra request cost. |
| `minCommentsPerPost` | integer | 0 | Optional density guard. Skips work when the known public thread is thinner than this value. |
| `proxyTier` | enum | `auto` | `auto`, `datacenter`, or `residential`. Auto falls back to residential after a block. |
| `proxyCountry` | string | `US` | Two-letter country code used for residential proxy routing. |
| `startCursorByPost` | object | `{}` | Optional continuation cursors from a previous run summary. Never mix cursors between posts. |

## Output data

### Comment row fields

| Field | Description |
|---|---|
| `source_post_url`, `source_post_id`, `input_url` | Source post identifiers and the input URL. |
| `source_comment_id`, `raw_id`, `decoded_id` | Comment identifiers exposed by Facebook. |
| `parent_comment_id`, `depth` | Reply relationship. Top-level comments have no parent and depth `0`. |
| `author_id`, `author_name`, `author_url`, `author_picture` | Public author metadata when exposed. |
| `raw_text` | Full comment text, unchanged. |
| `extracted_urls` | HTTP or HTTPS links found in the comment text. |
| `created_time`, `created_at` | Unix seconds and ISO 8601 timestamp. |
| `reactions`, `likes` | Combined reaction count and compatibility alias. |
| `reactions_breakdown` | Per-type counts for like, love, haha, wow, sad, angry, and care when available. |
| `reply_count`, `comments_count` | Reply and conversation counts exposed by Facebook. |
| `comment_url` | Stable permalink containing `comment_id` or `reply_comment_id`. |
| `post_text` | Optional post caption when `includePostText` is enabled. |

### Example row

```json
{
  "source_post_url": "https://www.facebook.com/example/posts/pfbid...",
  "source_post_id": "1458924389131879",
  "source_comment_id": "2089407168274372",
  "parent_comment_id": null,
  "depth": 0,
  "author_name": "Example Author",
  "raw_text": "This is a public Facebook comment.",
  "extracted_urls": [],
  "created_at": "2026-05-31T01:10:09.000Z",
  "reactions": 7,
  "likes": 7,
  "reactions_breakdown": {
    "like": 5,
    "love": 2
  },
  "reply_count": 3,
  "comment_url": "https://www.facebook.com/example/posts/1458924389131879?comment_id=2089407168274372"
}
```

### Run summary

The `OUTPUT` key in the default key-value store contains run-level coverage and diagnostics, including:

- `announcedComments`: Facebook's displayed count when available.
- `rowsPushed`: comments and replies written to the dataset.
- `coveragePercent`: collected rows divided by the announced count.
- `blocked`: for example, `comment_list_not_served_without_login`.
- `stopReason`: cursor exhausted, row limit reached, date cutoff, block, or safety stop.
- Per-post cursors that can be reused through `startCursorByPost`.

The run summary itself is not a billable dataset row.

## How it works

1. Fetch the public permalink once and read the boot values Facebook includes in the page.
2. Call the live comments pagination query with `feedLocation: POST_PERMALINK_DIALOG`, which returns 10 comments per page.
3. Follow the opaque end cursor until Facebook says there is no next page, the cursor stops moving, the requested limit is reached, or two consecutive pages bring no new IDs.
4. Expand reply threads through the depth query and follow each replies cursor to the end.
5. Deduplicate IDs, flatten replies with parent linkage, optionally filter by date, and write one row per comment.

## Best settings for maximum coverage

Use the defaults first. They are deliberately tuned for completeness:

```json
{
  "includeReplies": true,
  "unionSorts": true,
  "commentsSortOrder": "MOST_RELEVANT",
  "maxReplyThreadsPerPost": 100,
  "maxRepliesPerPost": 500,
  "pageDelayMs": 1000
}
```

`unionSorts` can increase requests because it walks more than one ordering window. That is intentional: separate sort windows can expose comments the first window did not return. If speed matters more than maximum coverage, use `commentsSortOrder: "NEWEST"` and disable `unionSorts`.

## Pricing and cost

This Actor uses Apify pay-per-event pricing:

| Event | FREE | BRONZE and above |
|---|---:|---:|
| Actor start | $0.003 per GB | $0.003 per GB |
| One comment or reply row | $0.003 | $0.0012 |

That is **$1.20 per 1,000 delivered comments for BRONZE and above**, or **$3.00 per 1,000 on the FREE plan**. The actor-start event is charged once per started GB of memory, with a minimum of one event. At the default 4096 MB this is **$0.012 per run**.

Platform usage, including compute and proxy traffic, is paid by the user and shown separately by Apify. A larger thread costs more event fees because it delivers more rows, but a run does not secretly turn into a platform-funded charity.

Example for BRONZE or above:

| Result | Event charge | Platform usage |
|---|---:|---:|
| 100 comments | About $0.12 plus $0.012 start | Separate Apify usage charge |
| 400 comments | About $0.48 plus $0.012 start | Separate Apify usage charge |
| 1,000 comments | About $1.20 plus $0.012 start | Separate Apify usage charge |

The summary record is not charged as a dataset item.

## API, MCP, and AI agents

### Call from the Apify API

Actor ID:

```text
spbotdel/facebook-comments-scraper
```

Start a run:

```bash
curl -X POST \
  "https://api.apify.com/v2/acts/spbotdel~facebook-comments-scraper/runs?token=<APIFY_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"postUrls":["https://www.facebook.com/example/posts/123"],"maxCommentsPerPost":100}'
```

Then read the default dataset from the returned run object through the Apify API. Schedule runs, subscribe to webhooks, and export the dataset in JSON, CSV, Excel, or other supported formats.

### Use through the Apify MCP server

Add the hosted Apify MCP server to an MCP-capable client:

```json
{
  "mcpServers": {
    "apify": {
      "url": "https://mcp.apify.com"
    }
  }
}
```

OAuth opens on first connection. For token-based setup, add `Authorization: Bearer <APIFY_TOKEN>` to the server headers.

An agent can discover this Actor with `search-actors`, inspect its inputs and README with `fetch-actor-details`, run it with `call-actor`, and retrieve rows with `get-dataset-items`. The hosted MCP server also exposes an inferred output schema from the Actor dataset schema, so field-level types are discoverable before the run starts.

### Compact agent reference

```json
{
  "actor": "spbotdel/facebook-comments-scraper",
  "purpose": "Extract publicly served Facebook comments and reply threads without cookies or login.",
  "minimalInput": {
    "postUrls": ["https://www.facebook.com/example/posts/123"],
    "maxCommentsPerPost": 100
  },
  "oneDatasetRow": "One stored comment or reply.",
  "importantDefaults": {
    "includeReplies": true,
    "unionSorts": true,
    "maxConcurrency": 5,
    "pageDelayMs": 1000
  },
  "output": [
    "raw_text",
    "author_name",
    "created_at",
    "reactions_breakdown",
    "parent_comment_id",
    "depth",
    "comment_url"
  ],
  "runSummary": "Key-value store record OUTPUT with coveragePercent and blocked status.",
  "publicSurfaceLimit": "Reels, photo pages, and /watch/ are not served to signed-out visitors.",
  "billing": "One billable default-dataset event per stored comment or reply; platform usage is paid by the user."
}
```

## Use cases

- Social listening and brand monitoring across public Facebook posts.
- Sentiment analysis, topic modelling, and RAG datasets built from real comments.
- Community and moderation research, including reply-thread reconstruction.
- Competitor analysis and campaign feedback tracking.
- Lead enrichment from public conversations and explicitly shared links.
- Scheduled monitoring of only new comments with cross-run deduplication.
- Academic, media, and policy research using structured public data.
- Agentic workflows that need a Facebook comment tool through the Apify API or MCP.

This Actor is commonly used for Facebook comment scraping, Facebook post comment extraction, reply-thread collection, comment monitoring, reactions analysis, social-listening datasets, and lead-generation enrichment.

## Coming from another Facebook comments scraper?

| Common field | Use here |
|---|---|
| `urls`, `startUrls` | `postUrls` |
| `resultsLimit`, `maxItems`, `targetComments` | `maxCommentsPerPost` |
| `includeReplies`, `fetchReplies`, `parseReplies` | `includeReplies` plus reply-thread limits |
| `viewOption`, `sortOrder` | `commentsSortOrder` or `unionSorts` |
| `onlyCommentsNewerThan` | `onlyCommentsNewerThan` |
| `sessionCookies`, `fbCookies`, `customCookies` | Not required. This Actor deliberately has no cookie input. |

## FAQ

### Do I need Facebook cookies or a login?

No. This Actor never asks for your Facebook credentials or cookies. It collects only the public content Facebook serves to signed-out visitors.

### Why did I receive fewer comments than the number shown on Facebook?

Facebook's counter includes comments and replies hidden from signed-out users, private or friends-only comments, filtered content, and items outside the served feed window. The Actor reports the publicly available coverage instead of presenting a partial count as complete.

### Can it scrape private Facebook groups?

No. Private groups, friends-only posts, and login-gated content are outside the public-source boundary.

### Does it work with Reels, photos, and Watch pages?

Those surfaces are accepted for detection, but Facebook does not serve their comment lists to signed-out visitors. The run summary marks them `blocked: comment_list_not_served_without_login`. Use a supported public post, page video, group permalink, `story.php`, or `/videos/` URL instead.

### How do I maximize the number of comments collected?

Keep replies enabled, keep `unionSorts` enabled, raise the reply limits, and do not set a low `maxCommentsPerPost`. The Actor's defaults already favor coverage over the smallest possible bill.

### Can I collect only new comments after the first run?

Yes. Use a stable `dedupeStoreName`; optionally add `knownCommentIds`, `knownDatasetId`, or `onlyCommentsNewerThan`. Set `failOnEmpty: true` if a scheduled run should fail visibly when nothing new is found.

### Does it use a browser?

No. It uses lightweight HTTP requests and Facebook's GraphQL pagination. That keeps runs cheaper and faster than a full browser session while preserving cursor-based depth.

### Can I use it from Python, JavaScript, Make, or an AI agent?

Yes. The Actor is available through the Apify API, Python and JavaScript clients, integrations such as Make and Zapier, webhooks, scheduled runs, and the hosted Apify MCP server.

### Is the result JSON, CSV, or Excel?

The default output is a structured Apify dataset. Export it from the Console or API as JSON, CSV, Excel, HTML, XML, or another supported format.

### What is not counted in the dataset?

Run-level diagnostics and coverage metrics live in the `OUTPUT` key-value store record, not in the billable default dataset.

### Is scraping public Facebook comments legal?

The Actor collects publicly available content only. You are responsible for complying with Facebook's terms, privacy law, and the rules that apply to your use case. Do not use it to access private data or build profiles unlawfully.

## Support and disclosures

Open an issue on the Actor page for bugs, feature requests, or integration questions.

This is an independent Facebook comments scraper. It is not affiliated with, endorsed by, or sponsored by Meta Platforms or Facebook. Facebook is a trademark of Meta Platforms, Inc.
