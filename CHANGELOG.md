# Changelog

## 0.0.45 (agent-readable dataset schema 2026-11-04)
- All 23 dataset fields documented for agent/MCP use; runtime code unchanged.
- Build `0.0.45` smoke run `FXPLeuCoIELacNfNK` succeeded with two rows.

## 0.0.44 (README + archive hygiene 2026-11-04)
- Added the public GitHub source badge for `spbotdel/facebook-comments-scraper`; no runtime code changed.
- Added `.actorignore` so `.git`, tests and local artifacts never enter the Actor archive.
- Build `0.0.44` published the README to the Apify store page; smoke run `OCDy8RPoUVGKWDWl2` succeeded with two rows.

## 0.0.43 (pricing + release snapshot 2026-10-27)
- Actor-start pricing matches the 4096 MB default: $0.003 per started GB with a one-event minimum, i.e. $0.012 per run. README, store listing and platform configuration now show the same numbers.
- Cloud build 0.0.43 verified: run `OcrUy3imI5NdeQQkU` SUCCEEDED on one group permalink with `maxPagesPerPost: 1` — 1 post, 1 page, 2 comment rows. Input committed as `comments-smoke-two-rows.json`.
- First git snapshot of this Actor. `node_modules`, local cloud-run dumps, build bundles and historical probe inputs are excluded by `.gitignore`; tests 32/32 and `npm run check` clean at snapshot time.

## 0.0.24 (completeness verified 2026-10-01)
- Final coverage check after all parity features: 400 comments from the HONY post in 40 pages, 400 unique ids, 0 duplicates, no throttles.
- Comment-id set is **identical to the 2026-09-30 baseline: 400 of 400 overlap (Jaccard 100%)** — the new sort handling, dedupe plumbing, reaction breakdown, URL extraction, post text and surface detection did not drop a single row.
- Field coverage on those 400 rows: `post_text` 400/400, `author_name` 400/400, `created_at` 400/400, `reactions_breakdown` 163 (exactly where reactions exist), `extracted_urls` 1.

## 0.0.23 (surface matrix + post text 2026-10-01)
- `includePostText` — the post caption is copied into every comment row as `post_text`, parsed from the permalink HTML the run already fetches (no extra requests). Verified: 10 of 10 rows carried the decoded caption, including `\u201c` escapes.
- Verified the input surface matrix in one run: page posts, group permalinks, `story.php` and `/videos/` work; **Reels, photo pages and `/watch/?v=` pages render but serve an empty comment list to logged-out visitors** — the same reason crawlerbros documents Reels as login-only.
- Such runs are now marked `blocked: comment_list_not_served_without_login` with a warning naming the surface, instead of returning a silent zero.
- Added `surfaceOfUrl()` (URL classifier) with tests; docs list supported vs unsupported surfaces.
- Tests 32/32, `npm run check` clean.

## 0.0.22 (announced comment count + navigation headers 2026-10-01)
- The permalink GET now sends browser-like navigation headers (`Accept: text/html...`, `Sec-Fetch-Dest: document`, `Sec-Fetch-Mode: navigate`). Without them Facebook returned a reduced HTML variant (475 KB vs 788 KB on the same URL), missing the embedded comment payload.
- SUMMARY now reports `announcedComments` — how many comments the post advertises — so coverage is visible before walking pages. Verified: 3215 announced on the HONY post.
- On some legacy `story.php` links the datacenter proxy still receives the reduced page, so the count is absent there while the comment walk itself continues to work.

## 0.0.21 (competitor parity features 2026-10-01)
- `commentsSortOrder` enum (`MOST_RELEVANT` / `NEWEST` / `ALL_COMMENTS`) picks the Facebook ordering explicitly; `unionSorts` still works. Verified in cloud: `ALL_COMMENTS` walks the `RANKED_UNFILTERED_CHRONOLOGICAL_REPLIES_INTENT_V1` window.
- Output now carries `reactions_breakdown` (per-type like/love/haha/wow/sad/angry/care) and `extracted_urls` (links found in the comment text). First cloud run: 48 of 50 rows had a breakdown, one comment shipped an Amazon link.
- Incremental monitoring: `dedupeStoreName` persists delivered comment IDs in a named key-value store between runs; `knownCommentIds` and `knownDatasetId` also accepted. Verified: run 1 saved 20 ids, run 2 skipped all 20 and pushed 0 rows (`skippedKnown: 20`).
- `failOnEmpty` marks the run as failed when nothing was collected, so scheduled runs cannot fail silently.
- Note: reading another run's dataset needs permission; the actor logs a clear warning and recommends `dedupeStoreName` or `knownCommentIds` instead.
- Tests 30/30, `npm run check` clean.

## 0.0.20 (auto proxy tier 2026-09-30)
- `proxyTier` input: `auto` (default) starts on Apify's datacenter pool and switches to residential the moment Facebook blocks it, so success rate is preserved.
- Measured on the comments actor: 400 public comments for $0.01097 on datacenter vs $0.04471 on residential; a group permalink walk of 74 comments for $0.00426. Group and public walks both served by datacenter in dedicated runs.
- On a mixed 3-post parallel run Facebook blocked the first datacenter permalink (HTTP 400, 1542 bytes), the fallback fired automatically and the run still delivered 274 comments for $0.0219 ($0.080 per 1000).
- Per 1000 comments: $0.027-0.058 when datacenter holds, $0.08-0.12 with residential fallback. Market range for comment actors is $0.40-6.80.
- Tests 28/28, `npm run check` clean.

## 0.0.19 (bulk mode + date filter + storefront 2026-09-30)
- Parallel post processing: `maxConcurrency` 1-20 (default 5). Measured two posts x100 comments in 21.5 s vs 45.7 s sequential, no duplicates, no throttles.
- `maxPostsPerRun` raised 10 -> 100; duplicate URLs are dropped before the walks start.
- `onlyCommentsNewerThan` accepts `2026-04-20`, `30 days`, `12 hours`, `2 weeks`; a post stops after two pages without matching comments.
- `proxyCountry` / `proxyGroups` inputs instead of the hardcoded RESIDENTIAL/US.
- Race fix: comment keys are reserved before `pushData`, so parallel workers can no longer double-push the same comment id.
- README rewritten (7.8k chars): features, inputs, output fields, mechanics, honest group limits, measured cost table, FAQ, migration table. Previously the actor card had no readme at all.
- Tests 28/28, `npm run check` clean.

## 0.0.18 (cookieless depth + fast pacing 2026-09-30)
- Rewrote the walk: live CLCPQ (doc 38580553541588665) with cursor paging, reply Depth1 walk (39246134745000506) to the end of each thread, configurable pacing.
- `feedLocation` is now always `POST_PERMALINK_DIALOG`. Verified: on a group `GROUP_PERMALINK` returns 3/page, the dialog surface returns 10 on the same post and cursor.
- pfbid/share URLs resolve their numeric post id from the page HTML (base64 `feedback:<id>`), so opaque links no longer return zero rows.
- Reply headroom: the top-level walk reserves space so replies still run; the old code filled the cap and never expanded a single thread.
- Union sorts (`null` + `RECENT_ACTIVITY_INTENT_V1`) with a duplicate-page guard so a second walk of the same window stops after two dry pages.
- Cloud measurements (1024 MB, residential US, no cookies): 200 comments = 47 s / $0.0234 at a 200 ms page delay vs 115 s / $0.0386 at 2000 ms. 400 comments = 91 s / $0.0447. Replies: 199 rows (110 top + 73 replies + 16 sub-replies) = $0.0141. Old build: $4.39-5.14 per 1000 comments, new build: $0.11-0.17 per 1000.
- Groups stay capped by Facebook at 71-79 of 175 announced comments for logged-out sessions; that tail needs cookies.
- Tests 27/27, `npm run check` clean.

## 0.0.17 (reply-headroom + in-memory candidates 2026-09-29)
- Cloud: FRESH_LIST 10/4pp CU 0.24 clean; WITH_REPLIES 14/5pp CU 0.28, window moves past 10 (11-14 new bodies) but replyExpansions=0 — top ate the whole cap.
- Fix: postPushedRows in-memory cache (dataset desc:true buried page-1 parents), replyHeadroom/topCap so Depth1 always keeps budget. Tests 26/26, check clean.
- Third battle hit a silent throttle loop (RUNNING 16+ min, CU 1.06+, no log past Post 1/1) — aborted to save budget. Lesson: 1 battle/hour per IP, 60+ min cooldown, or the server silently hangs up.

## 0.0.16 (live-template triple 2026-09-29)
- Local Playwright intercept on R60 caught the live browser triple: CLCPQ `38580553541588665` + Depth1 `39246134745000506` + Depth2 `28907335732287199` (9 requests, GROUP_PERMALINK).
- Fresh vars rebuilt to the full browser shape: count -1 (server picks), null intent/cursors on page 1, scale 1, four relay-provider flags, GROUP_PERMALINK on group URLs. Depth1 id = base64 `feedback:POST_parent`, Depth2 id = base64 `feedback:POST_comment`, null-first then -1+cursor paging.
- Stale Go-2026-07 docs retired. Tests 26/26 green (live-template doc + builder shape), `npm run check` clean. Legacy default untouched.
- Next: single cheap cloud battle 1x10 FRESH_LIST on R60 to see if the live template cracks the top-10 window.

## 0.0.15 (fresh-query experiment 2026-09-29)
- queryMode: LEGACY_TOPLEVEL (default, proven 10/post) / FRESH_LIST / FRESH_LIST_WITH_REPLIES (Depth1 per parent).
- Fresh pair: CLCPQ 27806180149070312 + Depth1 26570577339199586 (Go fbia, 2026-07), paging via commentsAfterCursor/commentsAfterCount + feedLocation.
- Parser: id-keyed reaction map (fbscrape canonical ids), decodeB64Legacy, explicit-count fresh vars.
- Cloud battle R60 total142: legacy 10/10 SUCCEEDED CU 0.0196; fresh v1 1357054, v2 1675012 (needs live browser template). Tests 24/24 green, build 0.0.6 SUCCEEDED.
- Lesson: fresh doc without the live template is a dead number — next step is local Playwright intercept, not more forged replays.

## 0.14.1 (proven 2026-09-28)
- 309/309 SUCCEEDED: SMOKE5 10/10 parity, VOL44 fat trio 30/30 at 0.69/1000 record, sort trilogy + pageSize 50 clean, VOL46 R0 filler honest.
- Ceiling 10/post holds, NEWEST clean on fat, ALL clean, guards save pages not backoffs.
- Tests 23/23 green. No code change needed.

## 0.0.13
- count 10 per GraphQL page on dense threads (fewer pages, lower compute per comment).
- Cost 1.45/1000 on dense 2x100, below closest competitor 1.50/1000.

## 0.0.12
- Golden-middle pacing (60-80s first, 35-55s pages, 45-60s between) + KV-only summary + fast-stop empty.
- Tay Ninh control: 10 comments, 2m29s, 0.011, zero throttle.

## 0.0.11
- Trimmed pacing attempt (too short, throttled page 1). Lesson kept in pricing doc.

## 0.0.10
- Long-pause volume pacing + one throttle retry + empty-fast-stop. vol2: 19 comments, zero throttle.

## 0.0.9
- Real-shape parser: likes=sum(top_reactions), author pic, feedback_url, depth, legacy_fbid, reply from feedback.replies_fields, expansion from feedback.expansion_info.
- count 5 + two-step vars, full RAW-GRAPHQL, parity schema. 12/12 tests.

## 0.0.8
- Two-step pagination vars, parity fields, full first-page RAW capture.



## 0.0.4
- Density guard minCommentsPerPost (0=off): skip thin threads after page 1 when totalCount < min.
- Input schema + settings tests (19/19). Guard run: thin stopped fast, dense 10/3 with retries.
- Store docs: STORE_PUBLICATION.md, README pricing 0.0015 parity, changelog current.

## 0.6
- Migration-safe push: run-level pushed-key set skips re-push after Apify host migration (newest-batch doubled 30 -> 60 rows).
- Throttle retries capped at 2 per post (was unbounded per-page; newest-batch burned 2 backoffs = $0.082).
- Step-2 tokens refreshed from every page (FB rotates intent/expansion mid-thread).
- Tests 21/21 green.


## 0.7
- ALL_COMMENTS sort mode (RANKED_UNFILTERED_CHRONOLOGICAL_REPLIES_INTENT_V1, c1 shape): unfiltered chronological, most complete dataset.
- Tests 21/21 green.


## 0.8
- pageSize input (5..50, default 10): probe larger GraphQL pages for depth breakthrough.
- Tests 21/21 green.


## 0.9
- Replies deep-fetch (maxReplyExpansionsPerPost 0..20, default 0): expand per-comment expansion_tokens after top-level paging.
- Tests 21/21 green.


## 0.10
- README honest: retry cap 2/post, migration-safe dedup, reply expansion flag documented.
- apify-client moved to devDependencies (slimmer prod image).
- Tests 21/21 green.


## 0.11
- startCursorByPost: resume paging from previous OUTPUT cursors (page past the 10/post ceiling across runs).
- Tests 22/22 green.


## 0.11 (proven)
- Continuation run proved server ceiling: same top-10 from any cursor (overlap 10/10).


## 0.12
- README honest on continuation ceiling (same top-10 from any cursor, both modes proven).
- Tests 22/22 green.


## 0.13
- Empty-run guard: stop after 2 consecutive zero-edge pages (saves compute on dead threads).
- Tests 22/22 green.


## 0.14
- Reply expansion fallback: bill fresh rows from expansions even when parent linkage missing.
- Tests 22/22 green.


## 0.14 CN-sync
- facebook-comments-cn 0.0.14 = EN 0.14.1 code, proven on CN group (honest empty).


-## 0.14 docs (unreleased)
- DEFAULT_REPLY_EXPANSIONS 10 -> 0 (dead constant matched to readRunSettings/schema default 0; expansion proven 0 fresh).
- Throttle-shaped empty page test: two-step tokens kept when edges=[] (23/23 green).
- README honest on effective yield: up to 10 comments per post per run (server top-10 window, pageSize/total-200 proven).
- Replies FAQ honest: depth 0 on tested threads, same-pager expansion 0 fresh; browser rivals thread via headless Chromium (different actor territory).
- Competitor recon logged: crawlerbros (browser threading), fc1 (login cookies), memo23 (0.49/1K), fbscrape (top-level only, same ceiling).
- Tests 22/22 green, no code change.

