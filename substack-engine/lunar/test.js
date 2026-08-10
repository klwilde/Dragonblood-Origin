const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { nextPhase } = require('../lib/moonPhase');
const { NEW_MOON_FRAGMENTS, FULL_MOON_FRAGMENTS } = require('./lunarTemplates');
const { createMockClient } = require('../lib/substackClient');
const draftQueue = require('../lib/draftQueue');
const analyticsLog = require('../lib/analyticsLog');
const insightsLedger = require('../lib/insightsLedger');
const { runLunarCycle, renderDraft, PHASE_LABELS } = require('./confirmLunar');
const { autoDecisionProvider } = require('../lib/decisionProviders');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'substack-lunar-test-'));

async function run(name, fn) {
  await fn();
  console.log(`ok - ${name}`);
}

function paths(label) {
  return {
    queueStatePath: path.join(tmpDir, `${label}-queue.json`),
    logPath: path.join(tmpDir, `${label}-analytics.log.jsonl`),
    ledgerPath: path.join(tmpDir, `${label}-insights.json`),
  };
}

async function main() {
  await run('nextPhase picks whichever lunar event is sooner', () => {
    const { phase, date } = nextPhase(new Date('2026-07-26T00:00:00Z'));
    assert.ok(phase === 'newMoon' || phase === 'fullMoon');
    assert.ok(date instanceof Date);
  });

  await run('renderDraft labels new moon and full moon distinctly', () => {
    const newMoonDraft = renderDraft('newMoon', NEW_MOON_FRAGMENTS[0], {});
    const fullMoonDraft = renderDraft('fullMoon', FULL_MOON_FRAGMENTS[0], {});
    assert.ok(newMoonDraft.title.includes(PHASE_LABELS.newMoon));
    assert.ok(fullMoonDraft.title.includes(PHASE_LABELS.fullMoon));
    assert.ok(newMoonDraft.body.includes(NEW_MOON_FRAGMENTS[0].text));
  });

  await run('runLunarCycle publishes a new moon draft to the followers tier', async () => {
    const { queueStatePath, logPath, ledgerPath } = paths('new-moon-publish');
    const client = createMockClient();
    const result = await runLunarCycle({
      phase: 'newMoon',
      client,
      decisionProvider: autoDecisionProvider('publish'),
      queueStatePath,
      logPath,
      ledgerPath,
    });
    assert.strictEqual(result.outcome, 'published');
    assert.strictEqual(result.post.tier, 'followers');
    assert.strictEqual(client._published.length, 1);
    assert.strictEqual(analyticsLog.read(logPath)[0].phase, 'newMoon');
  });

  await run('runLunarCycle records a published full moon insight to the ledger', async () => {
    const { queueStatePath, logPath, ledgerPath } = paths('full-moon-ledger');
    const client = createMockClient();
    await runLunarCycle({
      phase: 'fullMoon',
      client,
      decisionProvider: autoDecisionProvider('publish'),
      queueStatePath,
      logPath,
      ledgerPath,
    });
    const insights = insightsLedger.loadAll(ledgerPath);
    assert.strictEqual(insights.length, 1);
    assert.strictEqual(insights[0].phase, 'fullMoon');
    assert.strictEqual(insights[0].cadence, 'lunar');
    assert.ok(insights[0].recordedAt);
  });

  await run('runLunarCycle recycles a skipped draft instead of dropping it', async () => {
    const { queueStatePath, logPath, ledgerPath } = paths('skip-cycle');
    const client = createMockClient();
    const result = await runLunarCycle({
      phase: 'newMoon',
      client,
      decisionProvider: autoDecisionProvider('skip'),
      queueStatePath,
      logPath,
      ledgerPath,
    });
    assert.strictEqual(result.outcome, 'skipped-recycled');
    const state = draftQueue.loadState(queueStatePath);
    assert.strictEqual(state.recycled.length, 1);
    assert.strictEqual(insightsLedger.loadAll(ledgerPath).length, 0);
  });

  await run('new moon and full moon phases keep independent recycle queues', async () => {
    const newMoonPaths = paths('independent-new');
    const fullMoonPaths = paths('independent-full');
    const client = createMockClient();

    await runLunarCycle({
      phase: 'newMoon',
      client,
      decisionProvider: autoDecisionProvider('skip'),
      ...newMoonPaths,
    });
    await runLunarCycle({
      phase: 'fullMoon',
      client,
      decisionProvider: autoDecisionProvider('skip'),
      ...fullMoonPaths,
    });

    const newMoonState = draftQueue.loadState(newMoonPaths.queueStatePath);
    const fullMoonState = draftQueue.loadState(fullMoonPaths.queueStatePath);
    assert.strictEqual(newMoonState.recycled[0].form, NEW_MOON_FRAGMENTS[0].form);
    assert.strictEqual(fullMoonState.recycled[0].form, FULL_MOON_FRAGMENTS[0].form);
  });

  console.log('\nAll lunar-cycle tests passed.');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
