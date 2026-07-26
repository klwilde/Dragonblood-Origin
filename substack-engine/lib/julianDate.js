// Julian Date conversions anchored on the Unix epoch. Valid for the
// Gregorian calendar (all dates this project will ever schedule against).

const MS_PER_DAY = 86400000;
const JD_UNIX_EPOCH = 2440587.5; // JD at 1970-01-01T00:00:00Z

function dateToJD(date) {
  return date.getTime() / MS_PER_DAY + JD_UNIX_EPOCH;
}

function jdToDate(jd) {
  return new Date((jd - JD_UNIX_EPOCH) * MS_PER_DAY);
}

module.exports = { dateToJD, jdToDate, MS_PER_DAY };
