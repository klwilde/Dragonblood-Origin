// Append-only ledger of published Lunar-tier insights (New Moon origin
// questions, Full Moon synthesis), so the Solstice/Equinox tier can pull
// this cycle's mythic-mechanics material into its narrative cartography
// instead of starting from a blank page each season.

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_LEDGER_PATH = path.join(__dirname, '..', 'data', 'lunar-insights.json');

function loadAll(ledgerPath = DEFAULT_LEDGER_PATH) {
  try {
    const raw = fs.readFileSync(ledgerPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    return [];
  }
}

function record(insight, ledgerPath = DEFAULT_LEDGER_PATH) {
  const all = loadAll(ledgerPath);
  const entry = { ...insight, recordedAt: new Date().toISOString() };
  all.push(entry);
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.writeFileSync(ledgerPath, JSON.stringify(all, null, 2));
  return entry;
}

// Insights recorded since a given seasonal boundary, for a solstice pipeline
// to fold into its narrative-cartography draft.
function since(date, ledgerPath = DEFAULT_LEDGER_PATH) {
  return loadAll(ledgerPath).filter((entry) => new Date(entry.recordedAt) >= date);
}

module.exports = { loadAll, record, since, DEFAULT_LEDGER_PATH };
