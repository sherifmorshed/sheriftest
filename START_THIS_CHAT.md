# Sinai Field — start here

**Attach `sinai-field-v11.zip` to the new chat and paste the block below as your
first message.** Everything Claude needs is in the zip; nothing from any other
conversation is required.

---

## Paste this

> This chat is **only** for the Sinai Field — Production Readings app. There is a
> separate app of mine called Land Wells; it is a different application, a
> different Firebase project and a different chat. Never touch it, never refer to
> it, and if something here seems to need it, stop and tell me instead.
>
> The attached zip is the whole project. Read `README.md`, then
> `DEVELOPER_REFERENCE.md`, then `CHANGELOG.md` before changing anything.
>
> Current release: **v11**, service-worker cache `sinai-field-v11`.
>
> How I work: show me the change, test it before you say it is done, and tell me
> plainly when something I asked for is a bad idea.

---

## What this app is

Hourly PETRECO and Ras Gara oil readings for one shift day (06:00 → 05:00), the
difference between them, and a daily record across days. One HTML file, no build
step, Firebase/Firestore behind it, used on phones in the field.

Accounts: `sherifmorshed@gmail.com` (admin, sees everything),
`petreco@petrobel.org` and `rasgara@petrobel.org` (each sees only its own
columns), and `tb10-1@`…`tb8-2@petrobel.org` (each sees one tank battery only).

## The rules of the codebase

- `index.html` is edited **directly** — there is a map of the file in a comment
  at the top. No build step, no bundler.
- **Bump `CACHE_NAME` in `sw.js` on every release** or nobody sees the change.
- After editing `index.html`, **regenerate the test harnesses** or you are
  testing the old build:
  ```bash
  python3 test_build.py        # 3 days, all three roles, plus empty & stray states
  python3 test_build_hist.py   # ~120 generated days across 5 months
  ```
- `firestore.rules` is the real access control. The e-mail lists in `index.html`
  only decide what the screen offers. Change them together.
- Ten files get deployed; `README.md` lists exactly which. Everything else is
  documentation or the offline test harness — do not upload those.

## The two tabs

**R/G Production** — hourly PETRECO vs Ras Gara, 06:00 → 05:00. Unchanged.

**Tank Batteries** — five batteries, one totalizing scanner each, read every
three hours. T.B. 10/1 runs 06:00 → 06:00; the other four run 05:00 → 05:00, so
a reading time belongs to the battery, not the module. Admin gets two sub-pages,
Entry and Scanners. Nine readings give eight intervals;
production is the difference between consecutive readings. WHP typed alongside.
One account per battery (`tb10-1@`, `tb6-1@`, `tb6-2@`, `tb8-1@`,
`tb8-2@petrobel.org`). Each sees ONLY its own readings — enforced in
firestore.rules, not hidden on screen: the shift day is five documents, one per
battery (`2026-08-14__tb6_2`), so a rule can allow or deny a single battery.
Admin gets a breakdown across days and two reports: a one-page day report and a
record over the selected range. Operators get one tab and no tab bar.

The two shifts are an hour apart and are NOT the same 24 hours. Do not add a
tank battery total to a Ras Gara total.

## Where things stand

Nothing is outstanding. The last few releases fixed: the cloud status line
(it used to say "Connecting…" forever), "Send by e-mail" (it silently did
nothing), the daily-record header and ranges, the chart's x-axis stopping two
hours early, and the printed day report spilling onto a second page.

The 2026 history import was built and then removed at my request — do not
reintroduce it.
