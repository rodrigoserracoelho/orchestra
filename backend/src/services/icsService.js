// RFC 5545 calendar feed. Rehearsal times are stored as wall-clock Brussels
// time, so events carry TZID=Europe/Brussels with the matching VTIMEZONE
// rather than being converted to UTC (which would need per-date DST maths).
const TZID = 'Europe/Brussels';

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${TZID}`,
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

// Backslash, semicolon and comma are field separators; newlines become \n.
function escapeText(value) {
  return String(value == null ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Content lines are capped at 75 octets and continue with CRLF + one space.
function fold(line) {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const out = [];
  let start = 0;
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Never split a multi-byte character across a fold.
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    out.push((out.length ? ' ' : '') + bytes.slice(start, end).toString('utf8'));
    start = end;
    limit = 74;
  }
  return out.join('\r\n');
}

// A DATETIME read out of MySQL is a JS Date in wall-clock terms (the pool is
// pinned to UTC), so the UTC getters give back exactly what was entered.
function localStamp(value) {
  const d = value instanceof Date ? value : new Date(String(value).replace('Z', ''));
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}`
    + `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}00`;
}

function utcStamp(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}`
    + `T${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}Z`;
}

function addMinutes(value, minutes) {
  const d = value instanceof Date ? new Date(value) : new Date(String(value).replace('Z', ''));
  d.setUTCMinutes(d.getUTCMinutes() + (minutes || 0));
  return d;
}

/**
 * @param {Array} events  rows with id, title, rehearsal_date, duration_minutes,
 *                        location, notes, concert_id
 * @param {object} opts   { calendarName, host, stamp }
 */
function buildCalendar(events, { calendarName = 'Orchestra', host = 'orchestra', stamp } = {}) {
  const dtstamp = utcStamp(stamp || new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Orchestra Manager//Rehearsals//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    `X-WR-TIMEZONE:${TZID}`,
    ...VTIMEZONE,
  ];

  for (const ev of events) {
    const end = addMinutes(ev.rehearsal_date, ev.duration_minutes || 120);
    lines.push(
      'BEGIN:VEVENT',
      `UID:rehearsal-${ev.id}@${host}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=${TZID}:${localStamp(ev.rehearsal_date)}`,
      `DTEND;TZID=${TZID}:${localStamp(end)}`,
      `SUMMARY:${escapeText(ev.title)}`,
    );
    if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`);
    if (ev.notes) lines.push(`DESCRIPTION:${escapeText(ev.notes)}`);
    lines.push(
      `CATEGORIES:${ev.concert_id ? 'Concert' : 'Rehearsal'}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

module.exports = { buildCalendar, escapeText, fold, TZID };
