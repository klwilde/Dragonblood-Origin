// Approximate lunar-phase math for scheduling the Lunar tier's New Moon /
// Full Moon posts. Accurate to within a few hours — good enough for
// editorial scheduling, not for astronomy.

const { dateToJD, jdToDate } = require('./julianDate');

const SYNODIC_MONTH = 29.530588853; // days
const KNOWN_NEW_MOON_JD = 2451550.1; // 2000-01-06 18:14 UTC

function ageInDays(date) {
  const days = dateToJD(date) - KNOWN_NEW_MOON_JD;
  return ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
}

function nextNewMoon(fromDate = new Date()) {
  const age = ageInDays(fromDate);
  const daysUntil = SYNODIC_MONTH - age;
  return jdToDate(dateToJD(fromDate) + daysUntil);
}

function nextFullMoon(fromDate = new Date()) {
  const age = ageInDays(fromDate);
  const targetAge = SYNODIC_MONTH / 2;
  const daysUntil = age < targetAge ? targetAge - age : SYNODIC_MONTH - age + targetAge;
  return jdToDate(dateToJD(fromDate) + daysUntil);
}

module.exports = { ageInDays, nextNewMoon, nextFullMoon, SYNODIC_MONTH };
