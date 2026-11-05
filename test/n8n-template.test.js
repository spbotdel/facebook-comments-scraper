import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'docs', 'n8n', 'comments-to-slack-alerts.json');
const workflow = JSON.parse(fs.readFileSync(file, 'utf8'));

test('comments n8n workflow is inactive and has a valid node graph', () => {
  assert.equal(workflow.active, false);
  const names = workflow.nodes.map((node) => node.name);
  assert.ok(names.length >= 10);
  assert.equal(new Set(names).size, names.length);
  for (const node of workflow.nodes) {
    assert.equal(node.parameters?.requestMethod, undefined, `${node.name} must use method, not requestMethod`);
    if (node.type === 'n8n-nodes-base.httpRequest') {
      assert.ok(node.parameters?.method, `${node.name} must declare an HTTP method`);
    }
    if (node.parameters?.jsCode) {
      assert.doesNotThrow(() => new Function(node.parameters.jsCode), `${node.name} must compile`);
    }
  }

  for (const [source, output] of Object.entries(workflow.connections)) {
    assert.ok(names.includes(source), `unknown source node: ${source}`);
    for (const branch of output.main || []) {
      for (const connection of branch) {
        assert.ok(names.includes(connection.node), `unknown target node: ${connection.node}`);
      }
    }
  }
});

test('comments n8n workflow preserves the dedupe and alert contract', () => {
  const byName = new Map(workflow.nodes.map((node) => [node.name, node]));
  assert.equal(byName.get('Every 15 minutes')?.type, 'n8n-nodes-base.scheduleTrigger');
  assert.equal(byName.get('Start Apify Comments run')?.type, 'n8n-nodes-base.httpRequest');
  assert.equal(byName.get('Start Apify Comments run')?.parameters?.method, 'POST');
  assert.equal(byName.get('Get Apify run')?.parameters?.method, 'GET');
  assert.match(
    byName.get('Start Apify Comments run')?.parameters?.url,
    /maxTotalChargeUsd=\{\{ \$json\.maxTotalChargeUsd \}\}/,
  );
  assert.equal(
    byName.get('Start Apify Comments run')?.parameters?.headerParameters?.parameters?.[0]?.name,
    'Authorization',
  );
  assert.match(
    byName.get('Get new comments')?.parameters?.url,
    /datasets\/\{\{ \$json\.data\.defaultDatasetId \}\}\/items/,
  );
  assert.match(
    byName.get('Run finished?')?.parameters?.conditions?.conditions?.[0]?.leftValue,
    /SUCCEEDED.*FAILED.*ABORTED.*TIMED_OUT.*runIndex >= 40/,
  );
  assert.equal(byName.get('Build comment alert')?.type, 'n8n-nodes-base.code');

  const config = byName.get('Configure alert run')?.parameters?.assignments?.assignments || [];
  const maxCharge = config.find((assignment) => assignment.name === 'maxTotalChargeUsd');
  assert.equal(maxCharge?.value, 0.05);
  const dedupe = config.find((assignment) => assignment.name === 'dedupeStoreName');
  assert.equal(dedupe?.value, 'facebook-comment-monitor');

  const http = JSON.stringify(workflow);
  assert.match(http, /dedupeStoreName/);
  assert.match(http, /onlyCommentsNewerThan/);
});

test('comments n8n workflow does not embed credentials', () => {
  const serialized = JSON.stringify(workflow);
  assert.doesNotMatch(serialized, /apify_api_[A-Za-z0-9]+/);
  assert.doesNotMatch(serialized, /hooks\.slack\.com\/services\/[A-Za-z0-9/]+/);
  assert.match(serialized, /\$env\.APIFY_TOKEN/);
  assert.match(serialized, /\$env\.SLACK_WEBHOOK_URL/);
});
