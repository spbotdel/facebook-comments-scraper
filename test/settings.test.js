import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_REPLY_EXPANSIONS, QUERY_MODES, DOC_COMMENTS_LIST, DOC_REPLIES_DEPTH1, DOC_REPLIES_DEPTH2, buildDepth1Vars, buildDepth2Vars, buildFreshTopVars, feedbackId, feedLocationForUrl, parseDateFilter, postIdFromUrl, readRunSettings, readCursorMap, surfaceOfUrl } from '../src/settings.js';

test('readRunSettings defaults and clamps', () => {
  assert.deepEqual(readRunSettings({}), {
    maxPostsPerRun: 5,
    maxCommentsPerPost: 300,
    minCommentsPerPost: 0,
    includeReplies: true,
    sortMode: 'TOP_COMMENTS',
    queryMode: 'FRESH_LIST',
    pageSize: 10,
    maxReplyExpansionsPerPost: 0,
    maxReplyThreadsPerPost: 20,
    maxRepliesPerPost: 200,
    pageDelayMs: 1000,
    introDelayMs: 1500,
    maxPagesPerPost: 60,
    unionSorts: true,
    commentsSortOrder: 'MOST_RELEVANT',
    knownCommentIds: [],
    knownDatasetId: null,
    dedupeStoreName: null,
    failOnEmpty: false,
    includePostText: false,
    feedLocation: null,
    maxConcurrency: 5,
    proxyCountry: 'US',
    proxyGroups: ['RESIDENTIAL'],
    proxyTier: 'auto',
    onlyCommentsNewerThan: null,
    startCursorByPost: {},
  });
  assert.equal(readRunSettings({ maxConcurrency: 3 }).maxConcurrency, 3);
  assert.throws(() => readRunSettings({ maxConcurrency: 21 }), /Invalid maxConcurrency/);
  assert.deepEqual(readRunSettings({ proxyGroups: ['DATACENTER'] }).proxyGroups, ['DATACENTER']);
  assert.equal(readRunSettings({}).proxyTier, 'auto');
  assert.equal(readRunSettings({ proxyTier: 'residential' }).proxyTier, 'residential');
  assert.equal(readRunSettings({ proxyTier: 'datacenter' }).proxyTier, 'datacenter');
  assert.equal(readRunSettings({ proxyTier: 'nonsense' }).proxyTier, 'auto');
  assert.equal(readRunSettings({}).commentsSortOrder, 'MOST_RELEVANT');
  assert.equal(readRunSettings({ commentsSortOrder: 'NEWEST' }).commentsSortOrder, 'NEWEST');
  assert.equal(readRunSettings({ commentsSortOrder: 'ALL_COMMENTS' }).commentsSortOrder, 'ALL_COMMENTS');
  assert.equal(readRunSettings({ commentsSortOrder: 'GARBAGE' }).commentsSortOrder, 'MOST_RELEVANT');
  assert.deepEqual(readRunSettings({ knownCommentIds: [1, '2'] }).knownCommentIds, ['1', '2']);
  assert.equal(readRunSettings({ knownDatasetId: 'abc123' }).knownDatasetId, 'abc123');
  assert.equal(readRunSettings({ dedupeStoreName: 'my-monitor' }).dedupeStoreName, 'my-monitor');
  assert.equal(readRunSettings({}).dedupeStoreName, null);
  assert.equal(readRunSettings({ failOnEmpty: true }).failOnEmpty, true);
  assert.equal(readRunSettings({}).failOnEmpty, false);
  assert.equal(readRunSettings({}).includePostText, false);
  assert.equal(readRunSettings({ includePostText: true }).includePostText, true);
  assert.equal(readRunSettings({ onlyCommentsNewerThan: '30 days' }).onlyCommentsNewerThan, '30 days');
  assert.throws(() => readRunSettings({ maxCommentsPerPost: 2000 }), /Invalid maxCommentsPerPost/);
  assert.throws(() => readRunSettings({ maxPostsPerRun: 0 }), /Invalid maxPostsPerRun/);
  assert.throws(() => readRunSettings({ maxCommentsPerPost: 'lots' }), /Invalid maxCommentsPerPost/);
  assert.throws(() => readRunSettings({ minCommentsPerPost: -1 }), /Invalid minCommentsPerPost/);
  assert.throws(() => readRunSettings({ minCommentsPerPost: 2000 }), /Invalid minCommentsPerPost/);
  assert.equal(readRunSettings({ minCommentsPerPost: 5 }).minCommentsPerPost, 5);
  assert.equal(readRunSettings({ sortMode: 'NEWEST_FIRST' }).sortMode, 'NEWEST_FIRST');
  assert.equal(readRunSettings({ sortMode: 'ALL_COMMENTS' }).sortMode, 'ALL_COMMENTS');
  assert.equal(readRunSettings({ sortMode: 'GARBAGE' }).sortMode, 'TOP_COMMENTS');
  assert.equal(readRunSettings({}).queryMode, 'FRESH_LIST');
  assert.equal(readRunSettings({ queryMode: 'FRESH_LIST' }).queryMode, 'FRESH_LIST');
  assert.equal(readRunSettings({ queryMode: 'FRESH_LIST_WITH_REPLIES' }).queryMode, 'FRESH_LIST_WITH_REPLIES');
  assert.equal(readRunSettings({ queryMode: 'GARBAGE' }).queryMode, 'FRESH_LIST');
  assert.ok(QUERY_MODES.includes('LEGACY_TOPLEVEL') && QUERY_MODES.includes('FRESH_LIST'));
  assert.equal(readRunSettings({ pageSize: 25 }).pageSize, 25);
  assert.throws(() => readRunSettings({ pageSize: 4 }), /Invalid pageSize/);
  assert.throws(() => readRunSettings({ pageSize: 51 }), /Invalid pageSize/);
  assert.equal(readRunSettings({}).maxReplyExpansionsPerPost, 0);
  assert.equal(readRunSettings({ maxReplyExpansionsPerPost: 5 }).maxReplyExpansionsPerPost, 5);
  assert.throws(() => readRunSettings({ maxReplyExpansionsPerPost: 21 }), /Invalid maxReplyExpansionsPerPost/);
  assert.equal(DEFAULT_REPLY_EXPANSIONS, 0);
  assert.equal(readRunSettings({}).maxReplyExpansionsPerPost, DEFAULT_REPLY_EXPANSIONS);
});

test('postIdFromUrl extracts numeric ids', () => {
  assert.equal(postIdFromUrl('https://www.facebook.com/groups/2333220550043074/permalink/29037764019162031/'), '29037764019162031');
  assert.equal(postIdFromUrl('https://www.facebook.com/humansofnewyork/posts/1234567890123456'), '1234567890123456');
  assert.equal(postIdFromUrl('not a url'), null);
  assert.equal(postIdFromUrl(null), null);
});

test('parseDateFilter handles relative and absolute dates', () => {
  const now = Date.now();
  const days30 = parseDateFilter('30 days');
  assert.ok(Math.abs((now - days30) - 30 * 86400000) < 5000);
  const hours12 = parseDateFilter('12 hours');
  assert.ok(Math.abs((now - hours12) - 12 * 3600000) < 5000);
  const weeks2 = parseDateFilter('2 weeks');
  assert.ok(Math.abs((now - weeks2) - 14 * 86400000) < 5000);
  assert.equal(parseDateFilter('2026-04-20'), Date.parse('2026-04-20'));
  assert.equal(parseDateFilter(''), null);
  assert.equal(parseDateFilter(null), null);
  assert.equal(parseDateFilter('not a date'), null);
});

test('surfaceOfUrl classifies input URLs', () => {
  assert.equal(surfaceOfUrl('https://www.facebook.com/reel/1733966934399341'), 'reel');
  assert.equal(surfaceOfUrl('https://www.facebook.com/watch/?v=1733966934399341'), 'watch');
  assert.equal(surfaceOfUrl('https://www.facebook.com/photo?fbid=910582434846742'), 'photo');
  assert.equal(surfaceOfUrl('https://www.facebook.com/photo/?fbid=910582434846742&set=gm.1'), 'photo');
  assert.equal(surfaceOfUrl('https://www.facebook.com/story.php?story_fbid=2001486937181800&id=212952699368575'), 'story');
  assert.equal(surfaceOfUrl('https://www.facebook.com/groups/1/permalink/2/'), 'group');
  assert.equal(surfaceOfUrl('https://www.facebook.com/page/posts/123456789012345'), 'post');
  assert.equal(surfaceOfUrl('https://www.facebook.com/NASA/videos/1587860636042640'), 'video');
  assert.equal(surfaceOfUrl('https://www.facebook.com/'), 'unknown');
});

test('live template docs match the 2026-09-29 browser intercept', () => {
  assert.equal(DOC_COMMENTS_LIST, '38580553541588665');
  assert.equal(DOC_REPLIES_DEPTH1, '39246134745000506');
  assert.equal(DOC_REPLIES_DEPTH2, '28907335732287199');
});

test('live template builders mirror the browser variables shape', () => {
  const groupUrl = 'https://www.facebook.com/groups/2333220550043074/permalink/29094255886846177/';
  const pageUrl = 'https://www.facebook.com/humansofnewyork/posts/1234567890123456';
  // Groups used to get 3/page under GROUP_PERMALINK; the dialog surface gives 10.
  assert.equal(feedLocationForUrl(groupUrl), 'POST_PERMALINK_DIALOG');
  assert.equal(feedLocationForUrl(pageUrl), 'POST_PERMALINK_DIALOG');
  const fb = feedbackId('29094255886846177');
  assert.equal(Buffer.from(fb, 'base64').toString(), 'feedback:29094255886846177');
  const top1 = buildFreshTopVars(fb, null, groupUrl);
  assert.equal(top1.commentsAfterCount, -1);
  assert.equal(top1.commentsAfterCursor, null);
  assert.equal(top1.commentsIntentToken, null);
  assert.equal(top1.feedLocation, 'POST_PERMALINK_DIALOG');
  assert.equal(top1.scale, 1);
  assert.equal(top1.useDefaultActor, false);
  assert.equal(top1.__relay_internal__pv__CometUFICommentAutoTranslationTyperelayprovider, 'AUTO_TRANSLATE');
  const top2 = buildFreshTopVars(fb, 'OPAQUE-CURSOR', pageUrl);
  assert.equal(top2.commentsAfterCursor, 'OPAQUE-CURSOR');
  assert.equal(top2.feedLocation, 'POST_PERMALINK_DIALOG');
  const topRecent = buildFreshTopVars(fb, null, pageUrl, 'RECENT_ACTIVITY_INTENT_V1');
  assert.equal(topRecent.commentsIntentToken, 'RECENT_ACTIVITY_INTENT_V1');
  const topForced = buildFreshTopVars(fb, null, pageUrl, null, 'GROUP');
  assert.equal(topForced.feedLocation, 'GROUP');
  const d1 = buildDepth1Vars('29094255886846177', '29095310073407425', 'EXP-TOKEN', groupUrl);
  assert.equal(d1.expansionToken, 'EXP-TOKEN');
  assert.equal(d1.repliesAfterCount, null);
  assert.equal(d1.repliesAfterCursor, null);
  assert.equal(Buffer.from(d1.id, 'base64').toString(), 'feedback:29094255886846177_29095310073407425');
  const d1p2 = buildDepth1Vars('29094255886846177', '29095310073407425', 'EXP-TOKEN', groupUrl, 'REPLY-CURSOR');
  assert.equal(d1p2.repliesAfterCount, -1);
  assert.equal(d1p2.repliesAfterCursor, 'REPLY-CURSOR');
  const d2 = buildDepth2Vars('29094255886846177', '29095379083400524', 'EXP2', groupUrl);
  assert.equal(d2.subRepliesAfterCount, null);
  assert.equal(Buffer.from(d2.id, 'base64').toString(), 'feedback:29094255886846177_29095379083400524');
  const d2p2 = buildDepth2Vars('29094255886846177', '29095379083400524', 'EXP2', groupUrl, 'SUB-CURSOR');
  assert.equal(d2p2.subRepliesAfterCount, -1);
  assert.equal(d2p2.subRepliesAfterCursor, 'SUB-CURSOR');
});

test('thin thread guard skips below minimum', () => {
  const skipThin = ({ pages, totalCount, min }) => pages === 1 && min > 0 && totalCount !== null && totalCount !== undefined && Number.isFinite(Number(totalCount)) && Number(totalCount) < min;
  assert.equal(skipThin({ pages: 1, totalCount: 2, min: 5 }), true);
  assert.equal(skipThin({ pages: 1, totalCount: 10, min: 5 }), false);
  assert.equal(skipThin({ pages: 1, totalCount: 0, min: 0 }), false);
  assert.equal(skipThin({ pages: 2, totalCount: 2, min: 5 }), false);
  assert.equal(skipThin({ pages: 1, totalCount: null, min: 5 }), false);
  assert.equal(skipThin({ pages: 1, totalCount: undefined, min: 5 }), false);
});

test('readCursorMap validates per-post continuation cursors', () => {
  const PID = '29037764019162031';
  assert.deepEqual(readCursorMap(undefined), {});
  const exp = {};
  exp[PID] = { endCursor: 'abc', afterCursor: null };
  const src1 = {};
  src1[PID] = { endCursor: 'abc', afterCursor: null };
  assert.deepEqual(readCursorMap(src1), exp);
  // snake_case aliases accepted (KV OUTPUT shape).
  const src2 = {};
  src2[PID] = { end_cursor: 'abc' };
  assert.deepEqual(readCursorMap(src2), exp);
  // JSON string form accepted (easy console paste).
  assert.deepEqual(readCursorMap('{"29037764019162031":{"endCursor":"abc"}}'), exp);
  assert.deepEqual(readCursorMap({}), {});
  assert.throws(() => readCursorMap([]), /Invalid startCursorByPost/);
  assert.throws(() => readCursorMap({ notanid: { endCursor: 'x' } }), /bad post id/);
  const bad1 = {};
  bad1[PID] = 'abc';
  assert.throws(() => readCursorMap(bad1), /expected an object/);
  const bad2 = {};
  bad2[PID] = { endCursor: 5 };
  assert.throws(() => readCursorMap(bad2), /must be strings/);
  const src3 = {};
  src3[PID] = { endCursor: 'abc' };
  assert.deepEqual(readRunSettings({ startCursorByPost: src3 }).startCursorByPost, exp);
});

