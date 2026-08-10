// Shared human-in-the-loop decision providers for cadence pipelines
// (daily confirmation, lunar guided prompts, ...). A decision provider is
// `(draftEntry, fragment) => Promise<{ action: 'publish'|'skip'|'edit', body? }>`.

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

module.exports = { interactiveDecisionProvider, autoDecisionProvider };
