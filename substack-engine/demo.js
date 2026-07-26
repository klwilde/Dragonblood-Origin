// Prints the current routing decision + upcoming schedule for all four
// tiers. Run with: npm run substack:demo

const { routeAll } = require('./index');

function formatDate(date) {
  return date instanceof Date ? date.toISOString() : date;
}

for (const route of routeAll()) {
  console.log(`\n${route.label}`);
  console.log(`  tier: ${route.tier}  gate: ${route.gate}  human-in-loop: ${route.humanInLoop}`);
  console.log(`  narrative layer: ${route.narrative.layer} (voice: ${route.narrative.voice})`);
  console.log(`  forms: ${route.narrative.forms.join(', ')}`);

  const next = route.nextOccurrence;
  if (next instanceof Date) {
    console.log(`  next publish: ${formatDate(next)}`);
  } else if (next?.publish) {
    console.log(`  next publish: ${formatDate(next.publish)}`);
  } else if (next?.newMoon || next?.fullMoon) {
    console.log(`  next new moon: ${formatDate(next.newMoon)}`);
    console.log(`  next full moon: ${formatDate(next.fullMoon)}`);
  } else if (next?.season) {
    console.log(`  next seasonal event: ${next.season} on ${formatDate(next.date)}`);
  }
}
