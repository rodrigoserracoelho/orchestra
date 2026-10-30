// The orchestra's wall clock. Rehearsal DATETIMEs are stored as local Brussels
// time with no offset, so anything comparing them against "now" has to use the
// same frame — MySQL's NOW() is the database container's clock (UTC in
// production), which runs 1–2 hours behind Brussels and would keep finished
// rehearsals looking upcoming.
const APP_TZ = 'Europe/Brussels';

const FORMATTER = new Intl.DateTimeFormat('sv-SE', {
  timeZone: APP_TZ,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
});

/** Current time in the orchestra's timezone, as 'YYYY-MM-DD HH:MM:SS'. */
function appNow(date = new Date()) {
  return FORMATTER.format(date).replace('T', ' ');
}

module.exports = { APP_TZ, appNow };
