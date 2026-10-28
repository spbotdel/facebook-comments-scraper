# Store publication checklist

Target Actor: `spbotdel/facebook-comments-scraper` (`Ul5IlSzk7K0Lh8Qd6`).
Status: **published** on 2026-10-03. Public URL: `https://apify.com/spbotdel/facebook-comments-scraper`.
Updated: 2026-10-03, after the Store copy and SEO audit.

## Approved Store fields

### Regular display

- Name: **Facebook Post Comments Scraper**
- Name length: 30 characters.
- Description length: 294 characters, within Apify's 300-character Store limit.

> Scrape public Facebook post comments and deep reply threads without cookies or login. Extract comment text, authors, timestamps, reactions, stable URLs, post text, and thread relationships from up to 100 posts per run. Export structured data through the Apify API, MCP, schedules, and webhooks.

### SEO display

- SEO name: **Facebook Comments Scraper with Replies & Reactions**
- SEO name length: 50 characters.
- SEO description length: 151 characters, within Apify's recommended 145-155 range.

> Scrape public Facebook comments and replies without cookies or login. Get text, authors, reactions, timestamps, URLs, and coverage data via API or MCP.

### Categories

- `SOCIAL_MEDIA`
- `MCP_SERVERS`
- `AUTOMATION`

These categories cover the primary human search surface, the agent discovery surface, and scheduled workflow use cases.

### Support contact

- `spbotdel@gmail.com`

## Pricing

Use Apify pay-per-event pricing with platform usage paid by the user.

| Event | FREE | BRONZE and above |
|---|---:|---:|
| `apify-actor-start` | $0.003 | $0.003 |
| `apify-default-dataset-item` | $0.003 | $0.0012 |

The BRONZE-and-above result price is exactly **$1.20 per 1,000 comments or replies**. The FREE tier is 2.5x and costs **$3.00 per 1,000**.

The settings are already applied through the Apify API and were re-read after the update. Publication does not change pricing.

## README and schema alignment

The public copy is in `README.md`. It is structured for:

- human conversion: offer, supported surfaces, examples, output, pricing, FAQ;
- Google and Apify Store SEO: H2/H3 headings with natural search terms;
- Apify quality-score congruency: the same Actor name, limits, fields, and pricing appear in README, input schema, dataset schema, and actor.json;
- MCP discovery: a compact agent reference, explicit `spbotdel/facebook-comments-scraper` ID, minimal input, output fields, run summary, billing, and public-surface limits;
- honest expectations: logged-out Reels, photos, and Watch pages are documented as blocked instead of advertised as supported.

The Actor now uses only H2 and H3 headings in the README, which matches Apify's README guidance. The first screen explains what is extracted and what the user gets before it goes into GraphQL internals.

## Research evidence

Research date: 2026-10-03.

Audited actors: 12 direct Facebook comments competitors plus our Actor.

Input snapshot: `work/research/store-listings-audit.json`.

Reproducer: `work/research/audit-store-listings.mjs`.

Key findings:

- 13 of 13 titles mention comments; 12 of 13 mention scraping or extraction.
- Only 6 of 13 actors have custom SEO title and description fields.
- Median README length is about 1,568 words; our new README is in the same range but better structured for first-screen conversion and agents.
- Only 1 of 13 competitor READMEs explicitly mentions MCP.
- Only 2 of 13 explicitly mention AI agents.
- All 13 actors use `SOCIAL_MEDIA`; `AUTOMATION` appears 6 times, `DEVELOPER_TOOLS` 4 times, `AGENTS` twice.
- Competitor descriptions repeat the same winning elements: public comments, replies, authors, dates, reactions, bulk URLs, no login, output format, and price.

Full report: `outputs/store-listing-research-2026-10-03.md`.

## Publication and follow-up

- [x] Build the updated README, actor.json, input schema, and dataset schema into a new private version and tag `latest`.
- [x] Re-read the build and verify the new README and schema wording. After publication, Apify generated a 1,839-character `readmeSummary` covering extraction, reply depth, coverage diagnostics, fields, batching, monitoring, and agentic workflows.
- [x] Receive publication approval from the owner.
- [x] Set `isPublic=true` and verify the public Store page is reachable.
- [x] Post-publication smoke run `km02xjl000zEo29gp`: `SUCCEEDED`, 5/5 rows, run cost $0.0021, dataset `KQXYIyRzVovgwjNT3`.
- [x] Published demo task `comment-thread-demo` (`8Iv97zKgeFIsoRZ5G`): [landing page](https://apify.com/spbotdel/facebook-comments-scraper/examples/comment-thread-demo), demo run `O8alHaOjOn1ZXAzlO`, 40 rows, dataset `mq73ug6EG8LGYyYJV`.
- [x] Published four focused SEO task pages: replies/reactions (`PfNHcyH4Ym6o6BJWY`), monitoring (`CHgzYorGXdhgEypSO`), competitor analysis (`LFQ5GeYpC4BBEGGVd`), and group comments (`ixy9xC6OMl1Xh7hZL`).
- [x] Published three additional task pages: CSV export (`lr6sDtNpOnpUweEw3`), brand monitoring (`nHDJOB8dGbEVRaYf0`), and AI-ready dataset (`78ZcXSWmx87dc38JK`). No new Actor inputs or unsupported sentiment claims were added.
- [ ] Add 3-5 Store screenshots: input, run summary coverage, dataset rows, pricing, and MCP usage.
- [ ] Upload Actor icon in Console using `assets/actor-avatar-512.png`. The public API validates `pictureUrl` against an Apify-uploaded asset and cannot upload the file directly.
- [ ] Add a short public walkthrough video, if useful.
- [x] Checked Console Insights on 2026-10-03: Apify reports **"There's no Actor quality data yet."** Recheck after real usage accumulates. Preflight is documented in `outputs/quality-score-preflight-2026-10-03.md`.

## Current technical state

Current public build: `AbpzC4HDSf0ZzvQ8I` (`0.0.42`), tagged `latest`, status `SUCCEEDED`, `isPublic=true`.

The copy update changes documentation and schemas only. Tests remain 32/32 green.
