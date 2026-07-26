// Append-only JSONL analytics log for cadence runs (published / skipped /
// retired outcomes), so daily runs can be reviewed and adaptive-cadence
// decisions can be made later from real history.

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_LOG_PATH = path.join(__dirname, '..', 'data', 'analytics.log.jsonl');

function append(entry, logPath = DEFAULT_LOG_PATH) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  const line = JSON.stringify({ ...entry, loggedAt: new Date().toISOString() });
  fs.appendFileSync(logPath, `${line}\n`);
}

function read(logPath = DEFAULT_LOG_PATH) {
  try {
    const raw = fs.readFileSync(logPath, 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    return [];
  }
}

module.exports = { append, read, DEFAULT_LOG_PATH };
