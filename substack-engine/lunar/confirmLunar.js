// Lunar cadence pipeline: draft a followers-only New Moon (origin question)
// or Full Moon (synthesis + investigation) post, require human confirmation,
// and — on publish — record the insight to the ledger so the Solstice tier
// can fold this cycle's mythic-mechanics material into its seasonal arc.
//
//   node substack-engine/lunar/confirmLunar.js                       auto-detects the nearer phase, interactive
//   node substack-engine/lunar/confirmLunar.js --phase=newMoon       force a phase
//   node substack-engine/lunar/confirmLunar.js --auto=publish        scripted, skips the prompt
//
// `runLunarCycle` is exported separately so the pipeline logic can be tested
// without a real TTY/readline prompt.

const { routeTier } = require('../lib/tierRouter');
const { nextPhase } = require('../lib/moonPhase');
const { createCorpusSource } = require('../lib/corpusSource');
const { createMockClient } = require('../lib/substackClient');
const { NEW_MOON_FRAGMENTS, FULL_MOON_FRAGMENTS } = require('./lunarTemplates');
const draftQueue = require('../lib/draftQueue');
const analyticsLog = require('../lib/analyticsLog');
const insightsLedger = require('../lib/insightsLedger');
const { interactiveDecisionProvider, autoDecisionProvider } = require('../lib/decisionProviders');
const path = require('node:path');

const PHASE_LABELS = {
  newMoon: 'New Moon — Origin Question',
  fullMoon: 'Full Moon — Synthesis & Investigation',
};

function queueStatePathFor(phase) {
  return path.join(__dirname, '..', 'data', `lunar-recycle-${phase}.json`);
}

function fragmentsFor(phase) {
  return phase === 'newMoon' ? NEW_MOON_FRAGMENTS : FULL_MOON_FRAGMENTS;
}

function renderDraft(phase, fragment, route) {
  const date = new Date().toISOString().slice(0, 10);
  return {
    title: `${PHASE_LABELS[phase]} — ${date}`,
    body: `[${fragment.form}]\n\n${fragment.text}`,
  };
}

// decisionProvider(draft, fragment) => Promise<{ action: 'publish'|'skip'|'edit', body? }>
async function runLunarCycle({
  phase = nextPhase().phase,
  corpusSource = createCorpusSource(fragmentsFor(phase)),
  client = createMockClient(),
  decisionProvider,
  queueStatePath = queueStatePathFor(phase),
  logPath = analyticsLog.DEFAULT_LOG_PATH,
  ledgerPath = insightsLedger.DEFAULT_LEDGER_PATH,
} = {}) {
  const route = routeTier('lunar');
  const state = draftQueue.loadState(queueStatePath);
  const { fragment, source, state: stateAfterGet } = draftQueue.getNext(state, corpusSource);

  const { title, body } = renderDraft(phase, fragment, route);
  const draftEntry = await client.draft({ cadence: 'lunar', tier: route.tier, title, body });

  const decision = await decisionProvider(draftEntry, fragment);

  if (decision.action === 'publish' || decision.action === 'edit') {
    const finalBody = decision.action === 'edit' ? decision.body : body;
    const post = await client.publish(draftEntry.id, { tier: route.tier, body: finalBody });
    analyticsLog.append(
      { cadence: 'lunar', phase, outcome: 'published', fragmentForm: fragment.form, fragmentSource: source, draftId: draftEntry.id },
      logPath,
    );
    const insight = insightsLedger.record(
      { cadence: 'lunar', phase, form: fragment.form, text: finalBody, draftId: draftEntry.id },
      ledgerPath,
    );
    draftQueue.saveState(stateAfterGet, queueStatePath);
    return { outcome: 'published', post, insight };
  }

  if (decision.action === 'skip') {
    const { state: stateAfterSkip, retired } = draftQueue.recordSkip(stateAfterGet, fragment);
    analyticsLog.append(
      {
        cadence: 'lunar',
        phase,
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

if (require.main === module) {
  const phaseFlag = process.argv.find((arg) => arg.startsWith('--phase='));
  const phase = phaseFlag ? phaseFlag.split('=')[1] : nextPhase().phase;
  if (!PHASE_LABELS[phase]) {
    console.error(`Unknown phase: ${phase} (expected newMoon or fullMoon)`);
    process.exit(1);
  }

  const autoFlag = process.argv.find((arg) => arg.startsWith('--auto='));
  const decisionProvider = autoFlag
    ? autoDecisionProvider(autoFlag.split('=')[1])
    : interactiveDecisionProvider;

  runLunarCycle({ phase, decisionProvider })
    .then((result) => console.log(`\nLunar cycle (${phase}) result: ${result.outcome}`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runLunarCycle, renderDraft, PHASE_LABELS };
