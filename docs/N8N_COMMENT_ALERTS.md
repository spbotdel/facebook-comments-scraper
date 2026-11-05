# n8n workflow: new comments -> Slack alerts

[`importable workflow JSON`](n8n/comments-to-slack-alerts.json) checks one public Facebook post every 15 minutes and sends a Slack digest only when new comments were returned.

## What it does

1. Starts **Facebook Post Comments Scraper** for one public post.
2. Uses `commentsSortOrder=NEWEST`, `onlyCommentsNewerThan=7 days`, replies enabled, and a `$0.05` charge cap.
3. Polls the run every 15 seconds, with a maximum of 40 polls (about 10 minutes).
4. Reuses the same `dedupeStoreName` on every run, so already delivered comment IDs are skipped by the Actor.
5. Reads the new dataset rows.
6. Sends one compact Slack digest, with a maximum of 10 preview lines and a link to the Apify run.
7. Sends a separate Slack message when the run fails or the poll limit is reached.

If the Actor returns no new rows, the Slack alert node receives no items and stays silent. That is intentional: a healthy empty poll should not wake anyone.

The `$0.05` cap is per Actor run. At a 15-minute schedule, the theoretical upper bound is about `$4.80/day` if every run reaches the cap. Lower the cap or lengthen the interval when that ceiling is too high.

## Prerequisites

- An Apify token with permission to run the Actor.
- A Slack incoming webhook.
- These n8n environment variables:

```text
APIFY_TOKEN=apify_api_...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

The workflow does not contain either secret.

## Setup

1. Import [`comments-to-slack-alerts.json`](n8n/comments-to-slack-alerts.json).
2. Open `Configure alert run` and set the public post URL.
3. Keep the dedupe store name stable across runs. Changing it starts a fresh delivery history.
4. Raise `maxCommentsPerPost` and `maxTotalChargeUsd` only after a manual run.
5. Run manually and inspect the Apify run plus Slack message.
6. Activate the workflow after the manual run succeeds.

Direct import URL:

```text
https://raw.githubusercontent.com/spbotdel/facebook-comments-scraper/main/docs/n8n/comments-to-slack-alerts.json
```

## Operational notes

- `source_comment_id` is the dedupe key inside the Actor's named key-value store.
- `reply_count` and `depth` are preserved in each row; the Slack digest marks replies.
- `onlyCommentsNewerThan=7 days` is a second safety boundary for a post with a stale comment stream.
- Keep `includeReplies=true`; otherwise the alert silently ignores the noisiest part of the conversation.
- The Slack digest is not a replacement for the Apify dataset. Open the run when you need the full text, reaction breakdown, or raw identifiers.
- The Actor records delivered IDs in the dedupe store during its run. If the Slack node fails after a successful Actor run, inspect the failed n8n execution; a blind retry may find no rows because the Actor already considers those comments delivered.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| No Slack messages | Confirm there were genuinely new comments, the dedupe store is stable, and the Actor run succeeded. |
| Duplicate comments | A changed `dedupeStoreName` or a different Apify account resets the delivery history. |
| Slack receives a failure alert | Inspect the Apify run; the Actor reports `blocked`, `stopReason`, and coverage in its `OUTPUT` summary. |
| `comment_list_not_served_without_login` | The public surface does not expose comments to logged-out visitors; switch to a supported post or video permalink. |
| Too many alerts | Use a longer schedule or add a downstream threshold/filter node; do not raise the charge cap to make it quieter. |

## Limits

- Public Facebook content only.
- The Actor does not bypass login-only, private, or hidden comments.
- The template uses `$env` expressions, which require a self-hosted n8n instance with environment access enabled.
