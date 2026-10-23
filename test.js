// Run with: node test.js
const assert = require('assert');
const L = require('./logic.js');
let passed = 0;
const t = (name, fn) => { fn(); passed++; console.log('ok -', name); };

t('daysUntil counts calendar days', () => {
  assert.strictEqual(L.daysUntil('2026-11-01', '2026-10-23'), 9);
  assert.strictEqual(L.daysUntil('2026-10-23', '2026-10-23'), 0);
  assert.strictEqual(L.daysUntil('2026-10-20', '2026-10-23'), -3);
});
t('daysUntil is correct across DST and year boundaries', () => {
  assert.strictEqual(L.daysUntil('2027-01-01', '2026-12-31'), 1);
  assert.strictEqual(L.daysUntil('2024-03-01', '2024-02-28'), 2); // leap year
});
t('invalid dates are rejected', () => {
  assert.strictEqual(L.parse('2026-02-31'), null);
  assert.strictEqual(L.parse('31-12-2026'), null);
  assert.strictEqual(L.parse(''), null);
  assert.strictEqual(L.daysUntil('nope', '2026-10-23'), null);
});
t('statusOf thresholds', () => {
  assert.strictEqual(L.statusOf(-1), 'overdue');
  assert.strictEqual(L.statusOf(0), 'soon');
  assert.strictEqual(L.statusOf(30), 'soon');
  assert.strictEqual(L.statusOf(31), 'ok');
  assert.strictEqual(L.statusOf(null), 'invalid');
});
t('addMonths clamps month-end', () => {
  assert.strictEqual(L.addMonths('2026-01-31', 1), '2026-02-28');
  assert.strictEqual(L.addMonths('2024-01-31', 1), '2024-02-29');
  assert.strictEqual(L.addMonths('2026-11-15', 12), '2027-11-15');
});
t('validate catches bad input', () => {
  assert.strictEqual(L.validate({ name: 'FSSAI', due: '2026-12-01', cycle: 12 }).length, 0);
  assert.strictEqual(L.validate({ name: '  ', due: '2026-12-01', cycle: 12 }).length, 1);
  assert.strictEqual(L.validate({ name: 'x', due: '2026-13-01', cycle: 12 }).length, 1);
  assert.strictEqual(L.validate({ name: 'x', due: '2026-12-01', cycle: -2 }).length, 1);
  assert.strictEqual(L.validate({ name: 'x', due: '2026-12-01', cycle: 1.5 }).length, 1);
});
t('renew moves by one cycle; one-time items unchanged', () => {
  assert.strictEqual(L.renew({ due: '2026-10-30', cycle: 12 }).due, '2027-10-30');
  assert.strictEqual(L.renew({ due: '2026-10-30', cycle: 0 }).due, '2026-10-30');
});
t('sortItems puts most urgent first without mutating input', () => {
  const items = [{ due: '2027-01-01' }, { due: '2026-10-01' }, { due: '2026-11-01' }];
  const sorted = L.sortItems(items, '2026-10-23');
  assert.deepStrictEqual(sorted.map((i) => i.due), ['2026-10-01', '2026-11-01', '2027-01-01']);
  assert.strictEqual(items[0].due, '2027-01-01');
});
t('counts groups by status', () => {
  const c = L.counts([{ due: '2026-10-01' }, { due: '2026-11-01' }, { due: '2027-06-01' }], '2026-10-23');
  assert.deepStrictEqual(c, { overdue: 1, soon: 1, ok: 1 });
});
t('toCSV escapes commas, quotes and newlines', () => {
  const csv = L.toCSV([{ name: 'A, "B"', category: 'Tax', due: '2026-12-01', cycle: 12, notes: 'l1\nl2' }]);
  assert.ok(csv.includes('"A, ""B"""'));
  assert.ok(csv.includes('"l1\nl2"'));
});
t('toICS produces valid skeleton with reminders', () => {
  const ics = L.toICS([{ id: '1', name: 'Licence; A', due: '2026-12-01', notes: '' }], new Date('2026-10-23T00:00:00Z'));
  assert.ok(ics.startsWith('BEGIN:VCALENDAR') && ics.endsWith('END:VCALENDAR'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261201'));
  assert.ok(ics.includes('Licence\\; A expires'));
  assert.ok(ics.includes('TRIGGER:-P7D'));
});
console.log(`\n${passed} tests passed`);
