const assert = require('node:assert');
const { routeTier, routeAll } = require('./lib/tierRouter');
const { nextNewMoon, nextFullMoon, ageInDays, SYNODIC_MONTH } = require('./lib/moonPhase');
const { nextSeasonalEvent, yearSchedule, SEASONS } = require('./lib/solarEvents');
const { createMockClient } = require('./lib/substackClient');

async function run(name, fn) {
  await fn();
  console.log(`ok - ${name}`);
}

async function main() {
  await run('routeAll covers all four cadences with escalating tiers', () => {
    const routes = routeAll();
    assert.strictEqual(routes.length, 4);
    assert.deepStrictEqual(
      routes.map((r) => r.tier),
      ['free', 'free', 'followers', 'premium'],
    );
  });

  await run('unknown cadence throws', () => {
    assert.throws(() => routeTier('yearly'), /Unknown cadence/);
  });

  await run('next full moon is ~half a synodic month from next new moon boundary', () => {
    const now = new Date('2026-07-26T00:00:00Z');
    const newMoon = nextNewMoon(now);
    const fullMoon = nextFullMoon(now);
    assert.ok(newMoon > now);
    assert.ok(fullMoon > now);
    assert.ok(ageInDays(now) >= 0 && ageInDays(now) < SYNODIC_MONTH);
  });

  await run('seasonal events land in the expected months', () => {
    const schedule = yearSchedule(2026);
    assert.strictEqual(Object.keys(schedule).length, SEASONS.length);
    assert.strictEqual(schedule.marchEquinox.getUTCMonth(), 2); // March
    assert.strictEqual(schedule.juneSolstice.getUTCMonth(), 5); // June
    assert.strictEqual(schedule.septemberEquinox.getUTCMonth(), 8); // September
    assert.strictEqual(schedule.decemberSolstice.getUTCMonth(), 11); // December
  });

  await run('nextSeasonalEvent returns the nearest future event', () => {
    const event = nextSeasonalEvent(new Date('2026-07-26T00:00:00Z'));
    assert.strictEqual(event.season, 'septemberEquinox');
    assert.ok(event.date > new Date('2026-07-26T00:00:00Z'));
  });

  await run('mock substack client drafts then publishes', async () => {
    const client = createMockClient();
    const draft = await client.draft({ cadence: 'daily', tier: 'free', title: 'Field note', body: '...' });
    assert.strictEqual(client._drafts.length, 1);
    const post = await client.publish(draft.id);
    assert.strictEqual(client._drafts.length, 0);
    assert.strictEqual(client._published.length, 1);
    assert.strictEqual(post.tier, 'free');
  });

  console.log('\nAll substack-engine tests passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
