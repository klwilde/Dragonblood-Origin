// Approximate solstice/equinox instants using Meeus' low-precision formula
// (Astronomical Algorithms, ch. 27), valid ~1000-3000 CE to within minutes.
// Good enough for scheduling seasonal editorial content, not for ephemeris work.

const { jdToDate } = require('./julianDate');

const SEASONS = ['marchEquinox', 'juneSolstice', 'septemberEquinox', 'decemberSolstice'];

function jde0(year, season) {
  const Y = (year - 2000) / 1000;
  const Y2 = Y * Y;
  const Y3 = Y2 * Y;
  const Y4 = Y3 * Y;
  switch (season) {
    case 'marchEquinox':
      return 2451623.80984 + 365242.37404 * Y + 0.05169 * Y2 - 0.00411 * Y3 - 0.00057 * Y4;
    case 'juneSolstice':
      return 2451716.56767 + 365241.62603 * Y + 0.00325 * Y2 + 0.00888 * Y3 - 0.0003 * Y4;
    case 'septemberEquinox':
      return 2451810.21715 + 365242.01767 * Y + 0.11575 * Y2 - 0.00337 * Y3 + 0.00078 * Y4;
    case 'decemberSolstice':
      return 2451900.05952 + 365242.74049 * Y - 0.06223 * Y2 - 0.00823 * Y3 + 0.00032 * Y4;
    default:
      throw new Error(`Unknown season: ${season}`);
  }
}

function seasonDate(year, season) {
  return jdToDate(jde0(year, season));
}

function yearSchedule(year) {
  return Object.fromEntries(SEASONS.map((season) => [season, seasonDate(year, season)]));
}

function nextSeasonalEvent(fromDate = new Date()) {
  const candidates = [
    ...Object.entries(yearSchedule(fromDate.getUTCFullYear())),
    ...Object.entries(yearSchedule(fromDate.getUTCFullYear() + 1)),
  ];
  const upcoming = candidates
    .map(([season, date]) => ({ season, date }))
    .filter(({ date }) => date > fromDate)
    .sort((a, b) => a.date - b.date);
  return upcoming[0];
}

module.exports = { SEASONS, seasonDate, yearSchedule, nextSeasonalEvent };
