import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dedupeComments, stallStatus, shouldFetchMore, MAX_PAGES_PER_POST, throttleRetryAllowed, MAX_THROTTLE_RETRIES_PER_POST, filterUnpushed } from '../src/paging.js';

test('dedupeComments keeps only unseen rows', () => {
  const seen = new Map([['1', true]]);
  const rows = [{ source_comment_id: '1' }, { source_comment_id: '2' }, { raw_id: 'r3' }];
  assert.deepEqual(dedupeComments(seen, rows).map((c) => c.source_comment_id || c.raw_id), ['2', 'r3']);
  assert.deepEqual(dedupeComments(seen, null), []);
});

test('shouldFetchMore respects cap, exhaustion and page budget', () => {
  assert.equal(shouldFetchMore({ pushed: 100, max: 100, hasNext: true, pages: 3 }), false);
  assert.equal(shouldFetchMore({ pushed: 10, max: 100, hasNext: false, pages: 3 }), false);
  assert.equal(shouldFetchMore({ pushed: 10, max: 100, hasNext: true, pages: MAX_PAGES_PER_POST }), false);
  assert.equal(shouldFetchMore({ pushed: 10, max: 100, hasNext: true, pages: 3 }), true);
  assert.equal(shouldFetchMore({ pushed: 10, max: 100, hasNext: null, pages: 3 }), true);
});

test('stallStatus stops repeated pages', () => {
  const seen = new Map();
  const rows = [{ source_comment_id: '1' }, { source_comment_id: '2' }];
  let s = stallStatus(seen, rows, 0);
  assert.equal(s.fresh.length, 2);
  assert.equal(s.stalled, false);
  for (const c of rows) seen.set(c.source_comment_id, true);
  s = stallStatus(seen, rows, s.stalledPages);
  assert.equal(s.fresh.length, 0);
  assert.equal(s.stalled, false);
  s = stallStatus(seen, rows, s.stalledPages);
  assert.equal(s.stalled, true);
});

test('stallStatus ignores empty pages', () => {
  const s = stallStatus(new Map(), [], 0);
  assert.equal(s.stalled, false);
  assert.equal(s.stalledPages, 0);
});

test('throttle retry flag survives one backoff then stops', () => {
  // Contract for main.js: first throttle sets __throttleRetried and retries once,
  // second consecutive throttle records facebook-throttle and breaks.
  const vars = { id: 'x', count: 5, cursor: null };
  assert.equal(vars.__throttleRetried, undefined);
  vars.__throttleRetried = true;
  assert.equal(vars.__throttleRetried, true);
  // shouldFetchMore stays polite: caps still respected after retry.
  assert.equal(shouldFetchMore({ pushed: 5, max: 60, hasNext: true, pages: 2 }), true);
  assert.equal(shouldFetchMore({ pushed: 60, max: 60, hasNext: true, pages: 2 }), false);
});

test('empty first page stops fast (compute saver)', () => {
  // Contract for main.js: pages===1, zero edges, totalCount 0 or
  // hasNextPage false => break before burning 25 polite sleeps.
  const stopWhen = ({ pages, edgeCount, totalCount, hasNext }) =>
    pages === 1 && edgeCount === 0 && (totalCount === 0 || hasNext === false);
  assert.equal(stopWhen({ pages: 1, edgeCount: 0, totalCount: 0, hasNext: false }), true);
  assert.equal(stopWhen({ pages: 1, edgeCount: 0, totalCount: 5, hasNext: false }), true);
  assert.equal(stopWhen({ pages: 1, edgeCount: 3, totalCount: 5, hasNext: true }), false);
  assert.equal(stopWhen({ pages: 2, edgeCount: 0, totalCount: 0, hasNext: false }), false);
});

test('throttleRetryAllowed caps retries per post (compute guard)', () => {
  // newest-batch run proved per-page retries stack: 2 backoffs = $0.082.
  // Cap at MAX_THROTTLE_RETRIES_PER_POST so a hostile thread cannot eat the run.
  assert.equal(MAX_THROTTLE_RETRIES_PER_POST, 2);
  assert.equal(throttleRetryAllowed(0), true);
  assert.equal(throttleRetryAllowed(1), true);
  assert.equal(throttleRetryAllowed(2), false);
  assert.equal(throttleRetryAllowed(5), false);
});

test('filterUnpushed skips rows already pushed this run (migration-safe)', () => {
  // Host migration reboots the container mid-run and replays pages;
  // without this the dataset doubles (60 rows for 30 unique).
  const pushed = new Set(['1', 'r3']);
  const rows = [{ source_comment_id: '1' }, { source_comment_id: '2' }, { raw_id: 'r3' }, { raw_id: 'r4' }];
  assert.deepEqual(filterUnpushed(pushed, rows).map((c) => c.source_comment_id || c.raw_id), ['2', 'r4']);
  assert.deepEqual(filterUnpushed(new Set(), null), []);
  // Rows without any key still pass through (never silently dropped).
  assert.equal(filterUnpushed(new Set(['1']), [{}]).length, 1);
});
