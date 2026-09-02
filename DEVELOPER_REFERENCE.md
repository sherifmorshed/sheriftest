# Sinai Field PWA — Developer Reference

Read this before editing. It is short, and most of it is things that have
already gone wrong once.

---

## 1. What this is

A single-page PWA: one HTML file, no framework, no build step in the npm sense.
Firebase Auth for sign-in, Firestore for storage, localStorage as the offline
mirror, a service worker for offline loading.

**This application stands alone.** Its own Firebase project, its own accounts,
its own release cycle. Nothing here reads from or writes to any other PETROBEL
app, and nothing should ever need to.

The app is called **Sinai Field**; `rasGara` is the Firestore collection name,
the localStorage key prefix and the `rg*` function prefix. That mismatch is
deliberate — renaming storage identifiers buys nothing a user can see and would
orphan every existing document and cached day.

---

## 2. Layout of `index.html`

One file, edited directly — no build step. There is a map
in a comment at the top of the file; in short:

| | |
|---|---|
| `<style>` | tokens, then chrome (header / login / toast), then the readings page |
| sprite | all 11 icons, inline `<symbol>`s |
| markup | login screen, header bar, readings page |
| script 1 | **CONFIGURATION** (Firebase + role lists), boot, helpers, auth |
| script 2 | the app — entry, calc, chart, daily record, report, PDF, cloud sync |
| script 3 | theme, service-worker registration |

Script 2 is one IIFE. It reaches the shell only through the contract in §3 —
keep it that way, so the page around it can change without touching the
readings logic.

**Two things to check by eye after editing**, since nothing checks them for you
any more:

- every `<use href="#i-…">` names a `<symbol>` that exists — a typo renders as
  nothing at all, silently;
- the three role lists in CONFIGURATION still match `firestore.rules`.

---

## 3. The host contract

Script 2 expects these from the page. If you ever lift it somewhere else, this
is the list to provide:

```
db, firebase, FIREBASE_OK          Firestore handle and a "did it initialise" flag
currentUser                        who is signed in
isAdmin, isRasGara, isPetreco      role flags (isRasGara = the Ras Gara plant)
escHtml, escAttr                   HTML escaping
showToast, updateCloudStatus       user feedback
seriesColor(slot, forPrint)        chart colours
_isoDate(date)                     local-calendar ISO date
lsGet, lsSet                       localStorage with try/catch
getSyncedVersion, setSyncedVersion, isCacheCurrent
checkStorageHeadroom
html2canvas                        global, for the PDF
```

It exposes `window.__RG` (used by the tests),
`window.refreshRasGaraPage`, `window.startRasGaraListener`,
`window.stopRasGaraListener`.

---

## 4. Data

**Firestore**

| Path | |
|---|---|
| `rasGara/{YYYY-MM-DD}` | one shift day: `{ date, startHour, rows{…}, updatedBy, updatedAt }` |
| `rasGaraMeta/info` | `{ dates[], count, updatedAt, updatedBy }` — the version stamp |

A row is `{ p, r, rc }` — PETRECO m³/hr, Ras Gara m³/hr, Ras Gara cumulative.
`null` means "not entered", which is **not** the same as zero and must stay
distinguishable: an un-entered hour must not be counted as a zero reading.

PETRECO's cumulative is never stored — it is derived as a running total. Storing
it would create two sources of truth that could disagree.

### `rows` is a MAP on the wire and an ARRAY in memory

In Firestore, `rows` is a map keyed `"0"`…`"23"`. In memory it is always a
24-element array — every render and calculation depends on that, and
`rgRowsToArray()` converts on the way in.

The map is not cosmetic. A Firestore array is a single atomic value, so writing
it always replaces the whole thing. A map can be written with `merge:true`,
which deep-merges key by key, so each role writes **only the fields it owns**.
Without that, two operator groups working in different places overwrite each
other: PETRECO saves at 14:10 carrying a copy of the Ras Gara column from
13:00, and Ras Gara's 14:00 entry is silently gone. Worst offline, where a
phone can queue a write for hours — which is the case this app exists for.

Documents written before this change hold an array. Reads accept either shape;
a day that arrived as an array is flagged `_legacyRows`, and the next save
sends it whole once to convert it, because merging a map into an array
**replaces** it rather than merging. After that conversion, saves are partial
again.

**localStorage**

| Key | |
|---|---|
| `rasgara_days_v1` | every day, mirrored for offline |
| `rasgara_days_v1__syncver` | which cloud version that mirror came from |
| `rasgara_theme` | light / dark |

**Sync**, in one paragraph: devices watch `rasGaraMeta/info`, not the day
documents. When its `updatedAt` changes, the device compares it against the
stored version stamp; if they match it already has that data and skips the
download entirely. This is why a save writes the day *and then* the meta doc —
writing meta first would tell everyone to fetch a half-written set.

---

## 5. Things that will bite you

- **`var(--…)` does not resolve in the printed report or the PDF.** Both render
  in a detached document with no token scope. An unresolved colour paints black;
  an unresolved font silently falls back. Anything reachable from `forPrint`
  needs a literal — see `PRINT_SERIES` and `numFont` in `rgChartSVG`.

- **`<use href="#i-…">` does not resolve there either.** The sprite is in the
  main document. The report carries its own inline markup; do not "tidy" it to
  use the sprite.

- **`.rg-calc` is on the `<td>` itself, not on a child.** Never give it a
  `display` — an `inline-block` table cell drops out of table layout and the
  value drifts out of its row.

- **`textContent` on an element containing an SVG icon deletes the icon.** Use
  `innerHTML` and re-emit the `<svg><use/></svg>`, or wrap the label in a
  `<span>` and write to that — `#rgHistTitle` does exactly this.

- **Never `!important` a `display`.** Visibility is toggled with inline
  `style.display` — login vs app, and the action buttons an operator must not
  see — and an `!important` stylesheet rule beats an inline style. Doing this
  once unhid controls for an account that was supposed to be restricted.

- **`_isoDate` takes a local `Date` meaning "now".** Never feed it a UTC-midnight
  value from a parser: local midnight converted to UTC rolls back a day in
  positive offsets, and Egypt is UTC+2/+3. That family of bug is expensive —
  it produces readings filed under the wrong shift day, which nobody notices
  for weeks.

- **`Math.abs(null)` is `0`.** A difference that does not exist would print as
  a confident "0" rather than an em dash. Anywhere a sign is printed separately
  from a magnitude, use `rgAbs(v, dp)` — never `rgFmt(Math.abs(v), dp)`.

- **A comparison needs two numbers.** `rgCalc` returns `loss: null` unless
  **both** sides reported something that day. With `||` instead of `&&`, a day
  where only Ras Gara logged readings compares 186 against an implied zero and
  files a −186 m³ "loss" that is really a missing sheet. The daily record's
  range totals exclude those days for the same reason, and say so in the
  subtitle.

- **Every path through the listener must set a cloud status.** The footer line
  is the only thing telling anyone whether the app is talking to Firestore, and
  it used to be written in one place — after a successful save — so a healthy
  app read "Connecting…" indefinitely and a rules failure looked identical to a
  slow network. `rgCloudIdle()` and `rgCloudError()` exist so a new branch costs
  one line. A missing meta document is **not** an error: it is the normal state
  of a new project, and saying so is what separates "empty" from "broken".

- **A rejected promise from a click handler is completely silent.** No toast,
  no error the operator will ever see — the button simply does nothing. That is
  how "Send by e-mail" shipped broken for a release. Bind actions with the
  `_bind()` wrapper in the DOMContentLoaded block, which catches both throws and
  rejections and puts the reason in a toast.

- **`navigator.share()` and `window.open()` both need a LIVE user gesture.**
  Anything that takes seconds to prepare — the PDF takes several — has spent its
  activation by the time it is ready, and the call is refused silently on a
  phone. Deliver behind a second, explicit tap; that is what `rgOfferPdf()` is
  for. Never `await` something slow and then try to share or open a window.

- **An axis that steps by N usually never labels its last point.** 24 hours
  stepping by 3 stops at 03:00, so a shift running to 05:00 looked two hours
  short. Use `rgAxisMarks(n, step)` — it guarantees the final index is labelled.

- **The day report must stay ONE A4 page.** It does not fit at screen sizes, so
  `@media print` in `rgReportHTML` carries its own type, padding and chart
  sizes. If you add a row or a card, re-measure: render the report at 718px wide
  under `emulateMedia({media:'print'})` and keep `document.body.scrollHeight`
  under about 1,047px. (The e-mailed PDF is not affected — it scales an image.)

- **Bump `CACHE_NAME` in `sw.js` on every release.** Otherwise nobody sees the
  change and you will spend an afternoon debugging a fix that already shipped.

- **The rules and the email lists are two halves of one decision.** Change
  `ADMIN_EMAILS` / `PETRECO_EMAILS` / `PLANT_EMAILS` in `index.html` and
  `isAdmin()` / `isPetreco()` / `isPlant()` in `firestore.rules` together. Drift
  shows up as "the button is there but saving fails".

- **A top-level `let` is NOT on `window`.** The role flags are `let` bindings in
  script 1 and the app reads them from script 2 by lexical scope. Reaching them
  as `window.isAdmin` silently returns undefined and every role collapses to
  read-only viewer. Use the `typeof x !== 'undefined' && x` form — that is what
  `_admin()` / `_plant()` / `_petreco()` are for.

- **Adding a role means four edits, not one.** The list in CONFIGURATION,
  `rgSide()`, the rules, and `test_build.py`. `rgSide()` is the single place
  that decides which columns, totals, history and heading a user gets — put
  branching there rather than sprinkling `if(isX)` through the renderers.

---

## 6. Testing

`test.html` (admin), `test_petreco.html`, `test_plant.html` and `test_tb.html`
(tank battery operator) stub Firebase and
seed three days, so everything works with no project and no network. The stub
implements `merge:true` with real deep-merge semantics — without that, the
merge-write test would pass for the wrong reason.

`test_empty.html` seeds **nothing** — connected, authenticated, empty. That is
what a fresh deployment actually looks like, and where a wrong status line makes
"no data" indistinguishable from "not connected".

`test_hist.html` (admin) and `test_hist_rg.html` (Ras Gara) seed **~120
generated days across five calendar months** instead. Use these for anything
touching the daily record: three days cannot show you a month chip, a populated
month dropdown, a 100-point chart, a date-label collision, a gap in the record
or a day where one side never reported. The generator shapes the data to hit
exactly those cases — see the docstring in `test_build_hist.py`.

Also worth knowing: `rgDiffIsBad()` is the single place that decides which way
the difference is bad. Red means Ras Gara metered more than PETRECO received.
It reads backwards if you think of `loss` as a plain shortfall, which is why it
is written down once with the reasoning beside it — do not inline it again.

They are **snapshots of `index.html`**. After editing it, run:

```bash
python3 test_build.py        # three synthetic days, all three roles
python3 test_build_hist.py   # the 116 real days, admin + Ras Gara
```

or you are testing the previous version — an easy hour to lose.

Worth exercising after any change: each role seeing and editing only its own
columns; entry recalculating and debouncing to a single cloud write; **a save
from one operator not wiping the other side** even when the local copy is
stale; a legacy array day converting without loss; the chart in both themes;
the report rendering with no unresolved `var(--` and no unresolved `<use>`; the
PDF building;
wiping a real day; and an offline reload still showing the cached days.

For the daily record specifically: each range chip changing the chart, the table
**and** the printed report together; the Difference column staying on a 412px
screen (the hourly table's 520px `min-width` used to push it off — `#rgHistory
table.rg-tbl` overrides it); an operator seeing one column and no print button;
and a one-sided day reading "—" rather than a full-size fake loss.

When testing the clobber case, call `window.__RG.setDate('…')` first. Without
it the inputs on screen belong to today's blank document and the test measures
nothing — that cost me a wrong "FAIL" once.

Run the app in a non-UTC timezone. Cairo and São Paulo between them catch the
date bugs that are invisible at UTC — a positive offset and a negative one
behave differently, and only testing at UTC hides both.

---

## 7. Design

Never hard-code a colour — every value lives in the token block at the top.

`--s1` / `--s2` are the chart series and were chosen by running a palette
validator, not by eye: the PETROBEL brand navy and gold **failed** it, only
ΔE 4.9 apart under colour-blind simulation against a target of ≥ 8. Brand
colours stay on the interface chrome. If you add a third series, validate it.

Every control carries a visible frame at rest — see "Why the frames" in
`README.md` for why that is not a matter of taste.

No web font is bundled. It would cost ~300 KB and break the offline guarantee,
which matters more at a plant than the typeface does.

## Tank batteries

Second tab, its own collection, its own shift. Five batteries, one totalizing
scanner each, read every three hours on an **05:00 → 05:00** day.

**Two clocks.** T.B. 10/1 starts at 06:00, the rest at 05:00 — see `start` in
`TB_LIST`, and `tbStart(b)`. `tbLabel`, `tbHour`, `tbRowDate` and `tbShiftDates`
all take a battery. Never reintroduce a module-wide start hour: `TB_START_HOUR`
is the page default and the fallback, not a truth about the shift.
`tbOneClock()` reports whether the visible batteries agree, and is what decides
whether a shared Time column can be printed without mislabelling a reading — the
printed report falls back to bracketed second times, the heat grid to ordinal
columns. Those are LABELS and must stay; the commentary that used to sit beside
them was removed at the owner's request.

**Nine readings, eight intervals.** Production is `reading[i] − reading[i-1]`.
The ninth reading (the closing 05:00, on the NEXT calendar day) is not a spare —
without it the 02:00 → 05:00 interval has no production. Production is derived
and never stored, for the same reason PETRECO's cumulative is not.

**The 05:00 shift is not the 06:00 one.** A tank battery day and a Ras Gara day
carrying the same date cover different 24 hours. Never add their totals.

**Storage.** ONE DOCUMENT PER BATTERY PER DAY: `tbReadings/{date}__{batteryId}`,
carrying `date`, `battery`, and `rows.{"0".."8"} = {s,w}` — a map, never an
array. `tbReadingsMeta/info` is the version stamp, watched as `rasGaraMeta` is.

The split exists so per-battery access can be ENFORCED. While a whole shift day
was one document a rule could only allow or deny the lot. `battery` is stored as
a field, not just embedded in the id, because that is what a rule and a query
can both match on.

**Querying.** Admin reads the collection unfiltered. An operator MUST query
`.where('battery','==', his own)` — Firestore rejects a query it cannot prove
safe rather than trimming the result, so an unfiltered read is denied outright
even though some documents are his. `firebase-stub.js` simulates this.

**Concurrency.** `tbPushToCloud` sends ONLY the cells that client typed, tracked
in `_tbDirty`, one write per battery that changed. Sending whole rows would let
a phone that has been in a pocket since 08:00 push its blanks over an admin's
corrections. The dirty set is taken and cleared before the await, and restored
if the write fails.

**Listeners are role-gated.** `_tabsFor()` decides both which tabs are drawn and
which listeners start. A tank battery operator never attaches the Ras Gara
listener — the rules would refuse that read and the refusal would paint a red
"Cloud refused access" in the footer of a perfectly healthy app.

**The footer status line aggregates.** Two datasets report to it. Each source
keeps its own state, the worst wins, and when all are healthy their fragments
are joined. On `synced` a module passes only its fragment ("116 day(s)"); on any
other status it passes a whole sentence.

**Reports.** The day report is ONE A4 page — measured in Chrome, 928px clean and
957px with the warning banners, against 1054px printable. The record report is
deliberately not one page; its summary block is `break-inside:avoid` and ends at
620px at every range, so page one always stands alone. Both use
`window.__REPORT__` (`buildPdf`, `pdfFromHTML`, `printHTML`, `offerPdf`) rather
than carrying their own PDF writer.

**Charts pass `forPrint`.** A report renders in a detached document where the
theme tokens are not in scope, and an unresolved `var(--…)` paints black.
