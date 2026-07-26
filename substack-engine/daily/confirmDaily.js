// Daily cadence pipeline: pull the next corpus fragment (recycled skip or
// fresh pull), draft it, and require human confirmation before publishing.
//
//   node substack-engine/daily/confirmDaily.js            interactive (prompts on stdin)
//   node substack-engine/daily/confirmDaily.js --auto=publish   scripted, skips the prompt
//   node substack-engine/daily/confirmDaily.js --auto=skip
//
// `runDailyCycle` is exported separately so the pipeline logic can be tested
// without a real TTY/readline prompt.

const { routeTier } = require('../lib/tierRouter');
const { createCorpusSource } = require('../lib/corpusSource');
const { createMockClient } = require('../lib/substackClient');
const draftQueue = require('../lib/draftQueue');
const analyticsLog = require('../lib/analyticsLog');

function renderDraft(fragment, route) {
  const date = new Date().toISOString().slice(0, 10);
  return {
    title: `Field note — ${date}`,
    body: `[${fragment.form}]\n\n${fragment.text}`,
  };
}

// decisionProvider(draft, fragment) => Promise<{ action: 'publish'|'skip'|'edit', body? }>
async function runDailyCycle({
  corpusSource = createCorpusSource(),
  client = createMockClient(),
  decisionProvider,
  queueStatePath = draftQueue.DEFAULT_STATE_PATH,
  logPath = analyticsLog.DEFAULT_LOG_PATH,
} = {}) {
  const route = routeTier('daily');
  const state = draftQueue.loadState(queueStatePath);
  const { fragment, source, state: stateAfterGet } = draftQueue.getNext(state, corpusSource);

  const { title, body } = renderDraft(fragment, route);
  const draftEntry = await client.draft({ cadence: 'daily', tier: route.tier, title, body });

  const decision = await decisionProvider(draftEntry, fragment);

  if (decision.action === 'publish' || decision.action === 'edit') {
    const finalBody = decision.action === 'edit' ? decision.body : body;
    const post = await client.publish(draftEntry.id, { tier: route.tier, body: finalBody });
    analyticsLog.append(
      { cadence: 'daily', outcome: 'published', fragmentForm: fragment.form, fragmentSource: source, draftId: draftEntry.id },
      logPath,
    );
    draftQueue.saveState(stateAfterGet, queueStatePath);
    return { outcome: 'published', post };
  }

  if (decision.action === 'skip') {
    const { state: stateAfterSkip, retired } = draftQueue.recordSkip(stateAfterGet, fragment);
    analyticsLog.append(
      {
        cadence: 'daily',
        outcome: retired ? 'retired' : 'skipped-recycled',
        fragmentForm: fragment.form,
        fragmentSource: source,
        draftId: draftEntry.id,
      },
      logPath,
    );
    draftQueue.saveState(stateAfterSkip, queueStatePath);
    return { outcome: retired ? 'retired' : 'skipped-recycled' };
  }

  throw new Error(`Unknown decision action: ${decision.action}`);
}

async function interactiveDecisionProvider(draftEntry) {
  const readline = require('node:readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log(`\n--- ${draftEntry.title} ---\n${draftEntry.body}\n`);
    const answer = (await rl.question('[p]ublish / [s]kip / [e]dit then publish / [q]uit? ')).trim().toLowerCase();
    if (answer === 'q') {
      console.log('Quit without recording a decision.');
      process.exit(0);
    }
    if (answer === 'e') {
      const body = await rl.question('New body text:\n');
      return { action: 'edit', body };
    }
    if (answer === 's') return { action: 'skip' };
    return { action: 'publish' };
  } finally {
    rl.close();
  }
}

function autoDecisionProvider(action) {
  return async () => ({ action });
}

if (require.main === module) {
  const autoFlag = process.argv.find((arg) => arg.startsWith('--auto='));
  const decisionProvider = autoFlag
    ? autoDecisionProvider(autoFlag.split('=')[1])
    : interactiveDecisionProvider;

  runDailyCycle({ decisionProvider })
    .then((result) => console.log(`\nDaily cycle result: ${result.outcome}`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runDailyCycle, renderDraft, autoDecisionProvider };
