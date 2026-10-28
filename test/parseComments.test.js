import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCommentUrl, decodeB64Legacy, decodeHtmlEntities, decodeId, extractPostText, extractUrls, parseCommentEdges, summarizePayload, sumIdKeyedReactions, toIso, REACTION_ID_TO_NAME } from '../src/parseComments.js';

const b64 = (s) => Buffer.from(s).toString('base64');

test('decodeId handles feedback and comment blobs', () => {
  assert.equal(decodeId(b64('feedback:29037764019162031')), 'feedback:29037764019162031');
  assert.equal(decodeId(b64('comment:29037764019162031_29042327032039063')), 'comment:29037764019162031_29042327032039063');
  assert.equal(decodeId(null), null);
  assert.equal(decodeId('!!!'), null);
  assert.equal(decodeId(''), null);
});

test('fresh CLCPQ helpers map id-keyed reactions (fbscrape shape)', () => {
  assert.equal(REACTION_ID_TO_NAME['1635855486666999'], 'like');
  assert.equal(decodeB64Legacy(b64('feedback:29037764019162031')), '29037764019162031');
  assert.equal(decodeB64Legacy(b64('comment:1_2')), '1_2');
  assert.equal(decodeB64Legacy(null), null);
  const node = { feedback: { top_reactions: { edges: [
    { node: { id: '1635855486666999' }, reaction_count: 5 },
    { node: { id: '115940658764963' }, reaction_count: 3 },
    { node: { id: '9999999999999999' }, reaction_count: 2 },
  ] } } };
  const sums = sumIdKeyedReactions(node);
  assert.equal(sums.total, 10);
  assert.equal(sums.byName.like, 5);
  assert.equal(sums.byName.haha, 3);
  assert.equal(sums.other['9999999999999999'], 2);
  assert.equal(sumIdKeyedReactions({}), null);
});

test('parseCommentEdges extracts flat rows + paging', () => {
  const payload = { data: { node: { __typename: 'Feedback', comment_rendering_instance_for_feed_location: { selected_intent: { intent_token: 'RANKED_FILTERED_INTENT_V1' }, comments: { count: 27, page_size: 10, total_count: 58, page_info: { has_next_page: true, end_cursor: 'CUR123' }, edges: [
    { node: { id: b64('comment:29037764019162031_29042327032039063'), body: { text: 'Hello Tay Ninh' }, author: { id: '1001', name: 'Red Redden', url: 'https://www.facebook.com/red' }, created_time: 1790170268, reaction_count: 12, reply_count: 3 } },
    { node: { id: b64('comment:29037764019162031_29041682608770172'), body: { text: 'Congrats' }, author: { id: '1002', name: 'Phil Watson' }, created_time: 1790170300 } },
    { garbage: true },
  ] } } } } };
  const out = parseCommentEdges(payload);
  assert.equal(out.comments.length, 2);
  assert.equal(out.comments[0].source_comment_id, '29042327032039063');
  assert.equal(out.comments[0].post_hint, '29037764019162031');
  assert.equal(out.comments[0].author_name, 'Red Redden');
  assert.equal(out.comments[0].raw_text, 'Hello Tay Ninh');
  assert.equal(out.comments[0].reactions, 12);
  assert.equal(out.comments[0].reply_count, 3);
  assert.equal(out.totalCount, 58);
  assert.equal(out.pageSize, 10);
  assert.equal(out.intentToken, 'RANKED_FILTERED_INTENT_V1');
  assert.equal(out.pageInfo.end_cursor, 'CUR123');
  const s = summarizePayload(payload);
  assert.equal(s.hasNextPage, true);
  assert.equal(s.endCursor, 'CUR123');
  assert.equal(s.commentCount, 2);
});

test('parseCommentEdges tolerates empty shapes', () => {
  assert.deepEqual(parseCommentEdges({}).comments, []);
  assert.deepEqual(parseCommentEdges({ data: { node: null } }).comments, []);
  assert.deepEqual(parseCommentEdges({ data: { node: { comments: null } } }).comments, []);
});

test('parseCommentEdges captures two-step tokens + parity fields', () => {
  const payload = { data: { node: { __typename: 'Feedback',
    comment_rendering_instance_for_feed_location: {
      selected_intent: { intent_token: 'RANKED_FILTERED_INTENT_V1' },
      comments_intent_token: 'ROOT-INTENT',
      comments_after_cursor: 'AFTER-1',
      expansion_token: 'EXP-1',
      comments: { total_count: 58, page_info: { has_next_page: true, end_cursor: 'CUR1' }, edges: [
        { expansion_token: 'EDGE-EXP', node: { id: b64('comment:1_2'), body: { text: 'hi' },
          author: { id: '1001', name: 'A B', url: 'https://www.facebook.com/a' },
          created_time: 1790170268, reaction_count: 4,
          replies_fields: { total_count: 7 } } },
      ] } } } } };
  const out = parseCommentEdges(payload);
  assert.equal(out.comments.length, 1);
  assert.equal(out.comments[0].likes, 4);
  assert.equal(out.comments[0].comments_count, 7);
  assert.equal(out.comments[0].expansion_token, 'EDGE-EXP');
  assert.equal(out.comments[0].parent_comment_id, null);
  assert.equal(out.comments[0].depth, 0);
  assert.ok(out.comments[0].created_at.startsWith('2026-'));
  assert.equal(out.intentToken, 'RANKED_FILTERED_INTENT_V1');
  assert.equal(out.afterCursor, 'AFTER-1');
  assert.equal(out.expansionToken, 'EXP-1');
  const s = summarizePayload(payload);
  assert.equal(s.afterCursor, 'AFTER-1');
  assert.equal(s.expansionToken, 'EXP-1');
});

test('buildCommentUrl mirrors leader permalink shape', () => {
  assert.equal(
    buildCommentUrl('https://www.facebook.com/groups/1/permalink/2/', '3', null),
    'https://www.facebook.com/groups/1/permalink/2?comment_id=3',
  );
  assert.equal(
    buildCommentUrl('https://www.facebook.com/groups/1/permalink/2/', '4', '3'),
    'https://www.facebook.com/groups/1/permalink/2?comment_id=3&reply_comment_id=4',
  );
  assert.equal(buildCommentUrl(null, '3', null), null);
  assert.equal(toIso(1790170268).slice(0, 4), '2026');
  assert.equal(toIso(null), null);
});

test('parseCommentEdges reads real feedback shape (likes, pic, url, depth)', () => {
  const payload = { data: { node: { __typename: 'Feedback',
    comment_rendering_instance_for_feed_location: { comments: { total_count: 63,
      page_info: { has_next_page: true, end_cursor: 'CUR' }, edges: [
      { node: { id: b64('comment:1_2'), legacy_fbid: '2', depth: 0,
        body: { text: 'hello' }, created_time: 1790194419,
        author: { id: 'u1', name: 'A B', profile_picture_depth_0: { uri: 'https://pic/x.jpg' } },
        feedback: {
          url: 'https://www.facebook.com/groups/1/posts/1/?comment_id=2',
          expansion_info: { expansion_token: 'EXP-FB' },
          replies_fields: { total_count: 5 },
          top_reactions: { edges: [{ reaction_count: 13 }, { reaction_count: 2 }, { reaction_count: 1 }] },
          reactors: { count_reduced: '16' },
        } } },
    ] } } } } };
  const out = parseCommentEdges(payload);
  assert.equal(out.comments.length, 1);
  const c = out.comments[0];
  assert.equal(c.source_comment_id, '2');
  assert.equal(c.likes, 16);
  assert.equal(c.reactions, 16);
  assert.equal(c.author_picture, 'https://pic/x.jpg');
  assert.equal(c.feedback_url, 'https://www.facebook.com/groups/1/posts/1/?comment_id=2');
  assert.equal(c.expansion_token, 'EXP-FB');
  assert.equal(c.reply_count, 5);
  assert.equal(c.depth, 0);
});

test('parseCommentEdges keeps two-step tokens on empty edges (throttle-shaped pages)', () => {
  const payload = { data: { node: { __typename: 'Feedback',
    comment_rendering_instance_for_feed_location: {
      comments_intent_token: 'ROOT-INTENT-2',
      comments_after_cursor: 'AFTER-2',
      comments: { total_count: 64, page_info: { has_next_page: true, end_cursor: 'CUR2' }, edges: [] } } } } };
  const out = parseCommentEdges(payload);
  assert.equal(out.comments.length, 0);
  assert.equal(out.afterCursor, 'AFTER-2');
  assert.equal(out.totalCount, 64);
  const s = summarizePayload(payload);
  assert.equal(s.afterCursor, 'AFTER-2');
  assert.equal(s.commentCount, 0);
});

test('parseCommentEdges flattens nested replies with parent linkage', () => {
  const payload = { data: { node: { __typename: 'Feedback',
    comment_rendering_instance_for_feed_location: { comments: { total_count: 3,
      page_info: { has_next_page: false, end_cursor: null }, edges: [
      { node: { id: b64('comment:1_10'), legacy_fbid: '10', depth: 0,
        body: { text: 'parent' }, created_time: 1790194419,
        author: { id: 'u1', name: 'P A' },
        feedback: {
          replies_fields: { total_count: 2 },
          replies_connection: { edges: [
            { node: { id: b64('comment:1_11'), legacy_fbid: '11',
              body: { text: 'child one' }, created_time: 1790194420,
              author: { id: 'u2', name: 'C O' } } },
            { node: { id: b64('comment:1_12'), legacy_fbid: '12',
              body: { text: 'child two' }, created_time: 1790194421,
              author: { id: 'u3', name: 'C T' } } },
          ] } } } },
    ] } } } } };
  const out = parseCommentEdges(payload);
  assert.equal(out.comments.length, 3);
  assert.equal(out.comments[0].source_comment_id, '10');
  assert.equal(out.comments[0].depth, 0);
  assert.equal(out.comments[1].parent_comment_id, '10');
  assert.equal(out.comments[1].depth, 1);
  assert.equal(out.comments[1].raw_text, 'child one');
  assert.equal(out.comments[2].parent_comment_id, '10');
  assert.equal(out.comments[2].depth, 1);
  const replyUrl = buildCommentUrl('https://www.facebook.com/groups/1/permalink/2/', '11', '10');
  assert.equal(replyUrl, 'https://www.facebook.com/groups/1/permalink/2?comment_id=10&reply_comment_id=11');
});

test('parseCommentEdges reads Depth1 replies_connection pages', () => {
  // Live Depth1 shape (public post, 2026-09-30): the connection sits directly
  // on data.node instead of comment_rendering_instance_for_feed_location.
  const payload = { data: { node: { __typename: 'Comment', id: b64('comment:1_2'),
    replies_connection: {
      edges: [
        { node: { id: b64('comment:1_11'), legacy_fbid: '11', depth: 1,
          body: { text: 'first reply' }, created_time: 1790194420,
          author: { id: 'u2', name: 'C O' },
          comment_direct_parent: { id: b64('comment:1_10') },
          feedback: { top_reactions: { edges: [{ node: { id: '1635855486666999' }, reaction_count: 2 }] } } } },
        { node: { id: b64('comment:1_12'), legacy_fbid: '12', depth: 1,
          body: { text: 'second reply' }, created_time: 1790194421, author: { id: 'u3', name: 'C T' } } },
      ],
      page_info: { has_next_page: true, end_cursor: 'REPLY-CURSOR', has_previous_page: false },
    } } } };
  const out = parseCommentEdges(payload);
  assert.equal(out.comments.length, 2);
  assert.equal(out.comments[0].source_comment_id, '11');
  assert.equal(out.comments[0].raw_text, 'first reply');
  assert.equal(out.comments[0].parent_comment_id, '10');
  assert.equal(out.comments[0].reactions, 2);
  const s = summarizePayload(payload);
  assert.equal(s.hasNextPage, true);
  assert.equal(s.endCursor, 'REPLY-CURSOR');
  assert.equal(s.commentCount, 2);
});

test('extractUrls pulls links out of comment text', () => {
  assert.deepEqual(
    extractUrls('check https://example.com/offer and https://fb.me/x, thanks'),
    ['https://example.com/offer', 'https://fb.me/x'],
  );
  assert.deepEqual(extractUrls('dupe https://a.com and https://a.com'), ['https://a.com']);
  assert.equal(extractUrls('no links here'), null);
  assert.equal(extractUrls(''), null);
  assert.equal(extractUrls(null), null);
});

test('parseCommentEdges exposes reaction breakdown and extracted urls', () => {
  const payload = { data: { node: { __typename: 'Feedback',
    comment_rendering_instance_for_feed_location: { comments: { total_count: 1,
      page_info: { has_next_page: false, end_cursor: null }, edges: [
      { node: { id: b64('comment:1_2'), legacy_fbid: '2', depth: 0,
        body: { text: 'hit me at https://example.com/deal now' }, created_time: 1790194419,
        author: { id: 'u1', name: 'A B' },
        feedback: { top_reactions: { edges: [
          { node: { id: '1635855486666999' }, reaction_count: 5 },
          { node: { id: '115940658764963' }, reaction_count: 2 },
        ] } } } },
    ] } } } } };
  const out = parseCommentEdges(payload);
  assert.equal(out.comments.length, 1);
  assert.deepEqual(out.comments[0].reactions_breakdown, { like: 5, haha: 2 });
  assert.equal(out.comments[0].reactions, 7);
  assert.deepEqual(out.comments[0].extracted_urls, ['https://example.com/deal']);
});

test('extractPostText reads message JSON and falls back to og:description', () => {
  const withMessage = '<html><script>{"message":{"text":"Hello \\"world\\" from the post \\u2014 with details"}}</script></html>';
  assert.equal(extractPostText(withMessage), 'Hello "world" from the post — with details');
  const withOg = '<html><head><meta property="og:description" content="Second post caption &#x201c;quoted&#x201d; &amp; more text here"></head></html>';
  assert.equal(extractPostText(withOg), 'Second post caption “quoted” & more text here');
  assert.equal(extractPostText('<html>nothing useful</html>'), null);
  assert.equal(extractPostText(''), null);
  assert.equal(decodeHtmlEntities('&#x41;&#66;&amp;'), 'AB&');
});
