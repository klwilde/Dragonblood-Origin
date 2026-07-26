const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createCorpusSource, SAMPLE_FRAGMENTS } = require('../lib/corpusSource');
const draftQueue = require('../lib/draftQueue');
const analyticsLog = require('../lib/analyticsLog');
const { createMockClient } = require('../lib/substackClient');
const { runDailyCycle, autoDecisionProvider } = require('./confirmDaily');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'substack-daily-test-'));
const queueStatePath = path.join(tmpDir, 'recycle-queue.json');
const logPath = path.join(tmpDir, 'analytics.log.jsonl');

async function run(name, fn) {
  await fn();
  console.log(`ok - ${name}`);
}

async function main() {
  await run('corpus source cycles and wraps', () => {
    const source = createCorpusSource();
    assert.deepStrictEqual(source.nextFragment(0), SAMPLE_FRAGMENTS[0]);
    assert.deepStrictEqual(source.nextFragment(source.size()), SAMPLE_FRAGMENTS[0]);
  });

  await run('draftQueue retries a skipped fragment on the very next pull', () => {
    const source = createCorpusSource();
    let state = { cursor: 0, recycled: [] };

    const first = draftQueue.getNext(state, source);
    assert.strictEqual(first.source, 'fresh');
    state = first.state;

    const { state: afterSkip, retired } = draftQueue.recordSkip(state, first.fragment);
    assert.strictEqual(retired, false);
    assert.strictEqual(afterSkip.recycled.length, 1);
    assert.strictEqual(afterSkip.recycled[0].skipCount, 1);
    state = afterSkip;

    // Recycled fragments take priority over fresh corpus pulls.
    const recycledPull = draftQueue.getNext(state, source);
    assert.strictEqual(recycledPull.source, 'recycled');
    assert.strictEqual(recycledPull.fragment.skipCount, 1);
    assert.strictEqual(recycledPull.state.recycled.length, 0);
    // Cursor for fresh fragments hasn't advanced further.
    assert.strictEqual(recycledPull.state.cursor, state.cursor);
  });

  await run('draftQueue retires a fragment after max skips', () => {
    let fragment = { form: 'field notes', text: 'x', skipCount: 0 };
    let state = { cursor: 0, recycled: [] };
    let retired = false;
    for (let i = 0; i < draftQueue.DEFAULT_MAX_SKIPS; i += 1) {
      const result = draftQueue.recordSkip(state, fragment, draftQueue.DEFAULT_MAX_SKIPS);
      state = result.state;
      retired = result.retired;
      if (!retired) fragment = state.recycled[state.recycled.length - 1];
    }
    assert.strictEqual(retired, true);
  });

  await run('draftQueue state persists to disk and back', () => {
    const statePath = path.join(tmpDir, 'persist-check.json');
    const state = { cursor: 2, recycled: [{ form: 'field notes', text: 'x', skipCount: 1 }] };
    draftQueue.saveState(state, statePath);
    const loaded = draftQueue.loadState(statePath);
    assert.deepStrictEqual(loaded, state);
  });

  await run('analyticsLog appends and reads back JSONL entries', () => {
    analyticsLog.append({ cadence: 'daily', outcome: 'published' }, logPath);
    analyticsLog.append({ cadence: 'daily', outcome: 'skipped-recycled' }, logPath);
    const entries = analyticsLog.read(logPath);
    assert.strictEqual(entries.length, 2);
    assert.strictEqual(entries[0].outcome, 'published');
    assert.strictEqual(entries[1].outcome, 'skipped-recycled');
    assert.ok(entries[0].loggedAt);
  });

  await run('runDailyCycle publishes on an auto-publish decision', async () => {
    const cyclePath = path.join(tmpDir, 'publish-cycle.json');
    const cycleLog = path.join(tmpDir, 'publish-cycle.log.jsonl');
    const client = createMockClient();
    const result = await runDailyCycle({
      client,
      decisionProvider: autoDecisionProvider('publish'),
      queueStatePath: cyclePath,
      logPath: cycleLog,
    });
    assert.strictEqual(result.outcome, 'published');
    assert.strictEqual(client._published.length, 1);
    assert.strictEqual(analyticsLog.read(cycleLog)[0].outcome, 'published');
  });

  await run('runDailyCycle recycles a skipped draft instead of dropping it', async () => {
    const cyclePath = path.join(tmpDir, 'skip-cycle.json');
    const cycleLog = path.join(tmpDir, 'skip-cycle.log.jsonl');
    const client = createMockClient();
    const result = await runDailyCycle({
      client,
      decisionProvider: autoDecisionProvider('skip'),
      queueStatePath: cyclePath,
      logPath: cycleLog,
    });
    assert.strictEqual(result.outcome, 'skipped-recycled');
    const state = draftQueue.loadState(cyclePath);
    assert.strictEqual(state.recycled.length, 1);
  });

  console.log('\nAll daily-confirmation tests passed.');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
