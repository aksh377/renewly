// Pure date/renewal logic. No DOM access, so it can be unit tested in Node.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Logic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const DAY = 86400000;

  // Parse YYYY-MM-DD as a UTC date; returns null for bad or impossible dates (e.g. 2026-02-31).
  function parse(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCMonth() === +m[2] - 1 ? d : null;
  }
  const fmt = (d) => d.toISOString().slice(0, 10);

  function daysUntil(due, today) {
    const a = parse(due), b = parse(today);
    return a && b ? Math.round((a - b) / DAY) : null;
  }

  function statusOf(days, warn = 30) {
    if (days === null) return 'invalid';
    if (days < 0) return 'overdue';
    return days <= warn ? 'soon' : 'ok';
  }

  // Adds months and clamps the day (31 Jan + 1 month = 28/29 Feb).
  function addMonths(s, n) {
    const d = parse(s);
    if (!d) return null;
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
    const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
    t.setUTCDate(Math.min(d.getUTCDate(), last));
    return fmt(t);
  }

  function validate(item) {
    const errors = [];
    if (!item.name || !item.name.trim()) errors.push('Enter a name.');
    if (!parse(item.due)) errors.push('Enter a valid expiry date.');
    const c = Number(item.cycle);
    if (!Number.isInteger(c) || c < 0 || c > 120) errors.push('Renewal cycle must be a whole number from 0 to 120 months.');
    return errors;
  }

  // Renewing moves the expiry forward by one cycle. One-time items (cycle 0) cannot be renewed.
  function renew(item) {
    if (!Number(item.cycle)) return item;
    return { ...item, due: addMonths(item.due, Number(item.cycle)) };
  }

  const sortItems = (items, today) =>
    items.slice().sort((a, b) => daysUntil(a.due, today) - daysUntil(b.due, today));

  function counts(items, today, warn = 30) {
    const c = { overdue: 0, soon: 0, ok: 0 };
    items.forEach((i) => { const s = statusOf(daysUntil(i.due, today), warn); if (c[s] !== undefined) c[s]++; });
    return c;
  }

  const csvCell = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  function toCSV(items) {
    const rows = [['Name', 'Category', 'Expiry date', 'Cycle (months)', 'Notes']];
    items.forEach((i) => rows.push([i.name, i.category, i.due, i.cycle, i.notes]));
    return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  }

  // All-day calendar events with a reminder 30 days and 7 days before expiry.
  const icsText = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  function toICS(items, now = new Date()) {
    const stamp = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const ev = items.filter((i) => parse(i.due)).map((i) => [
      'BEGIN:VEVENT', 'UID:' + i.id + '@renewly', 'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + i.due.replace(/-/g, ''),
      'SUMMARY:' + icsText(i.name + ' expires'),
      'DESCRIPTION:' + icsText(i.notes),
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Renewal due', 'TRIGGER:-P30D', 'END:VALARM',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Renewal due', 'TRIGGER:-P7D', 'END:VALARM',
      'END:VEVENT'].join('\r\n'));
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Renewly//EN', ...ev, 'END:VCALENDAR'].join('\r\n');
  }

  return { parse, daysUntil, statusOf, addMonths, validate, renew, sortItems, counts, toCSV, toICS };
});
