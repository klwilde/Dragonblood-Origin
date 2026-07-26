const { nextNewMoon, nextFullMoon } = require('./moonPhase');
const { nextSeasonalEvent } = require('./solarEvents');

const MS_PER_DAY = 86400000;

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

// Next occurrence of a given UTC weekday (0=Sunday) at a fixed publish hour.
function nextWeekday(fromDate, targetDay, hourUTC = 9) {
  const result = new Date(fromDate);
  result.setUTCHours(hourUTC, 0, 0, 0);
  let delta = (targetDay - result.getUTCDay() + 7) % 7;
  if (delta === 0 && result <= fromDate) delta = 7;
  return addDays(result, delta);
}

function nextOccurrence(cadence, fromDate = new Date(), options = {}) {
  switch (cadence) {
    case 'daily': {
      const hourUTC = options.hourUTC ?? 8;
      const next = new Date(fromDate);
      next.setUTCHours(hourUTC, 0, 0, 0);
      if (next <= fromDate) return addDays(next, 1);
      return next;
    }
    case 'weekly': {
      const weekday = options.weekday ?? 0; // default Sunday
      return { publish: nextWeekday(fromDate, weekday, options.hourUTC ?? 9) };
    }
    case 'lunar': {
      return {
        newMoon: nextNewMoon(fromDate),
        fullMoon: nextFullMoon(fromDate),
      };
    }
    case 'solstice': {
      return nextSeasonalEvent(fromDate);
    }
    default:
      throw new Error(`Unknown cadence: ${cadence}`);
  }
}

module.exports = { nextOccurrence, addDays, nextWeekday };
