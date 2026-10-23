# Renewly

**Live demo:** https://renewly-beryl.vercel.app/ **Demo video:** _add link here_

A small web tool that tracks licence, registration and certificate expiry dates and tells you what needs attention next.

## Problem and user
Small business owners (a café, clinic or retail shop) hold many renewals: food licence, shop registration, fire certificate, insurance. Each has its own date and portal, usually tracked in memory, WhatsApp or a scattered spreadsheet. Missing one means fines or a shutdown. Renewly gives one sorted list with clear urgency, plus calendar reminders.

## Features
- Add an item with name, category, expiry date, renewal cycle and notes
- Most urgent item shown first, with days left or days overdue
- Filters: overdue, due in 30 days, on track
- "Mark renewed" moves the expiry forward by one cycle
- Export CSV, or export a `.ics` file with reminders 30 and 7 days before expiry
- Data stays in your browser (localStorage). No account, no server.

## Run locally
```bash
git clone <your-repo-url> && cd renewly
# open index.html in a browser, or:
npx serve .
# run unit tests (Node 16+, no dependencies)
node test.js
```

## Deploy
Static site. Push to GitHub, then enable GitHub Pages (Settings > Pages > main branch, root), or drag the folder into Netlify.

## Testing
`test.js` has 11 unit tests covering date maths (leap years, month-end, invalid dates), status thresholds, validation, renewal, sorting, CSV escaping and ICS output. Manual test plan: add valid and invalid items, filter, renew, delete, reload to confirm persistence, import the `.ics` into a calendar.

## Known limitations
- Data lives in one browser on one device, with no sync or sharing
- Reminders depend on the calendar app, not push notifications
- Dates use your local "today"; no timezone selection

## Product write-up
**Problem and user.** Small business owners lose track of licence renewals scattered across portals and paper. Renewly is one list sorted by urgency.

**Key decisions.** (1) No backend or login: the user's data is a short list, and zero setup makes it instantly usable and reliable to deploy. (2) Reminders through a `.ics` export instead of building email/SMS, because people already trust their calendar and it works offline. (3) "Mark renewed" shifts the date by the cycle, so the yearly routine is one click.

**Cut from scope.** Accounts and sync, document uploads, email/WhatsApp reminders, team assignment. Next I would add a backend with email reminders and file attachments for the licence copy.

**What surprised me.** Date maths. Comparing `Date` objects in local time gave off-by-one days around DST, and adding one month to 31 Jan overflowed into March. I moved all calculations to UTC date-only parsing, clamped month ends, and wrote tests for both cases.

## Credits
Fonts: Bricolage Grotesque and Instrument Sans (Google Fonts, OFL). Built with help from an AI assistant (Claude); I reviewed and can explain all code.
