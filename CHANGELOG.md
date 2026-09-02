# Sinai Field — Changelog

## v11 — Tank Batteries

Second tab, renamed **R/G Production** for the first. Five tank batteries —
T.B. 10/1, 6/1, 6/2, 8/1, 8/2 — each with one totalizing scanner read every
three hours.

**Two shift clocks.** T.B. 10/1 runs 06:00 → 06:00; the other four run
05:00 → 05:00. A reading time is a property of the BATTERY, not of the module —
every label, row date and shift window takes the battery and nothing assumes
05:00. Each panel states its own window. On the printed report the Time column
is the 05:00 schedule with 10/1's own time in brackets on every row, because a
cell under a heading saying 05:00 must not hold a reading taken at 06:00. Each battery total covers exactly that battery's own nine readings; the field
figure is the sum of five days that begin an hour apart.

**The Scanners page** is an analysis page, not a second copy of the data. It
carries no totalizer readings at all — a totalizer is working data for the man
at the tank; what an engineer wants is production and whether it is normal:

- **Three-hour production, today against yesterday** — grouped bars, field-wide
  and one chart per battery, each on its own clock. Bars not lines: eight
  discrete buckets, and a line would imply production between readings that
  nobody measured.
- **Where the hours went** — a grid of battery × interval, each cell shaded
  against that battery's OWN average for the day, never against the field, so a
  small battery does not read as permanently failing. Columns become ordinals
  when the batteries do not share a clock.
- Day KPIs including **vs the 7-day average**, which is the context that says
  whether "down 8% on yesterday" is a problem or just Tuesday.

**The tank battery tab has two pages for admin:** Entry and Scanners. Entry is
done standing at a tank with a phone, the overview sitting down; burying the
entry table above five charts served neither. Operators have Entry only and see
no chips.

- **Nine readings, eight intervals.** Production is the difference between a
  reading and the one before it, so the day carries a closing 05:00 reading as
  well as an opening one. Without the ninth, 02:00 → 05:00 has no production.
  Production is derived, never stored.
- **The 05:00 shift is NOT the 06:00 one.** Tank battery days and Ras Gara days
  with the same date cover different 24 hours. Nothing adds them together.
- **WHP** typed at each of the nine times. Stored, shown, never summed.
- **A scanner that reads lower than it did three hours ago** is flagged red and
  named as a reset, rollover or misread rather than dragging the total down.
- **Opening vs yesterday's closing** is compared and any disagreement reported.
  It does NOT auto-fill — a meter reading nobody took is worse than a blank.
- **Part-filled days say so** ("5 of 8 intervals") and never get a day-over-day
  percentage, which at 11:00 would otherwise read as a catastrophic decline.
- **One account per battery** — `tb10-1@`, `tb6-1@`, `tb6-2@`, `tb8-1@`,
  `tb8-2@petrobel.org`. The address is the battery, so a login is
  self-documenting and `updatedBy` names the source without a lookup table.
  Note this maps an account to a BATTERY, not a person: two men rotating on the
  same battery share a login, and the save timestamp plus the roster is what
  separates them.
- **Each battery now sees ONLY its own readings, and this is enforced, not
  hidden.** The shift day was split from one document into FIVE — one per
  battery per day, id `2026-08-14__tb6_2`, with the battery also stored as a
  field. While a whole day was a single document a rule could only allow or
  deny the lot, so per-battery access could never have been more than a curtain
  on the screen. Now the rule is a comparison against that field and the server
  refuses. An operator's client queries `.where('battery','==',his own)`; an
  unfiltered query is rejected outright rather than trimmed, which is how
  Firestore evaluates queries and what the app relies on.
- Splitting the documents also removed the last way two operators could tread on
  each other: they no longer write to the same document at all. Saves still
  patch only the cells that client typed, so an admin editing another hour of
  the same battery is not overwritten.
- An operator sees one panel, headed with his battery, and no "Field total" —
  that card would be his own battery under a name implying four others.
- **Collection renamed** `tankBatteries` → `tbReadings`, meta likewise. No
  migration: this shape had not been deployed.
- **Admin breakdown:** day-over-day comparison on every total card, a record
  across days with 30/90/All ranges, one chart per battery, all five plus the
  field total in one chart, and a daily totals table with vs-prev.
- **Access:** tank battery operators get one tab and no tab bar. `isTankBattery()`
  is deliberately kept OUT of `isOperator()` in firestore.rules, so they cannot
  read rasGara even from a browser console. `firebase-stub.js` now simulates
  these rules, so the isolation tests fail if the enforcement is ever weakened. Their client does not start the
  Ras Gara listener at all — that read would be refused and would paint a false
  "Cloud refused access" error in the footer of a healthy app.
- **The footer status line now aggregates.** Two datasets report to it; the worst
  status wins, and when both are healthy their counts are joined. Previously the
  last writer won, which could paint over a real error.
- **Printed day report and e-mail PDF**, admin only, one A4 portrait page:
  totals cards with vs-yesterday, scanner readings interleaved with production
  (12 columns), WHP in its own table, and a production-per-interval chart.
  Measured in Chrome at A4/9mm — 928px clean, 957px with the warning banners,
  against 1054px printable. A backwards scanner or a part day is named in a
  banner at the top, not left as a cell colour.
- **Printed record and e-mail PDF** over the selected range. NOT held to one
  page and cannot be — "All" is however many days there are. What is guaranteed
  is that PAGE ONE is a complete report on its own: range, headline numbers,
  per-battery breakdown with shares and reset-flag counts, and the chart. The
  summary block ends at 620px at every range and is kept off a page break; the
  day-by-day table runs on after it. 30 days prints as 2 pages, 119 as 4.
  Averages and best/lowest day use COMPLETE days only, and the page says how
  many part days were excluded.
- The PDF writer and the delivery sheet moved to `window.__REPORT__` and are now
  shared rather than copied, so a fix to either lands in both reports.
- New harness `test_tb.html`. `test_build.py` seeds 14 tank battery days
  including a meter reset and a part-filled day; `test_build_hist.py` now seeds
  the same 119-day span for the batteries so the record report and its ranges
  are exercised against real length.

## v10  (cache `sinai-field-v10`)

**The chart now reaches the end of the shift.** The x-axis stepped by three
hours from 06:00 and stopped at index 21 — 03:00 — so the last two hours were
never labelled and the graph read as though the shift ended two hours early. The
line was always drawn to 05:00; only the axis was lying. The final point now
always gets a label, and if that would crowd the one before it, it replaces it
instead.

The daily-trend chart had the same fault: the most recent day was usually
unlabelled, so the record appeared to stop short of the newest reading. Same
fix, one shared helper (`rgAxisMarks`).

**The printed day report fits one A4 page.** It was 1,147px against roughly
1,047px of printable A4, so it always spilled a few rows onto a second sheet —
two things to staple and one to lose.

Print now gets its own set of numbers rather than a scale hack: `@page` at A4
with 9mm margins, and tightened type, padding, card and chart sizes inside
`@media print`. That brings it to 987px — one page, with about 60px of headroom
so a longer figure or a wrapped heading cannot push it over. Screen and the
e-mailed PDF are untouched; the PDF was already a single page, because it scales
a rendered image to fit.

The **daily record** printout still runs to as many pages as the range needs —
116 days cannot be one sheet, and its table headers repeat on each.

---

## v9  (cache `sinai-field-v9`)

**The 2026 history import is gone.** Removed entirely, as asked — the panel, its
styles, the loader, the data file and every mention of it in the documentation.
`index.html` is ~7 KB smaller and contains nothing about importing anything.

Nothing else changed: the daily record, its ranges, the month and custom
pickers, the chart, the table and both printouts are untouched. Any readings
already in the cloud stay exactly as they are — this release only removes the
thing that could put more in.

**The long-run test harnesses now generate their own days.** `test_hist.html`
and `test_hist_rg.html` used to be seeded from the workbook extract; that file
is deleted, so `test_build_hist.py` builds **~120 days across five calendar
months** instead. They are shaped to hit the cases the record has to survive
rather than to look plausible — gaps where a day is missing, days where only one
side reported, and differences in both directions. Three days cannot show you a
month dropdown with more than one entry, a 100-point chart, or a date-label
collision, and those are the things that break.

---

## v8  (cache `sinai-field-v8`)

**The history import was hidden from the one person who needed it.** I gated it
on the project being *completely* empty. A project holding a few unrelated test
days — which is what a real deployment looks like after somebody has tried the
app — never showed the panel, with no way to reach it and nothing on screen
explaining why. That is why the history would not load however many times the
files were uploaded.

It now asks the right question: **is the 2026 record here?** Days outside its
span are irrelevant. The panel appears whenever any of the 116 days are missing,
and says which case it is:

```
The 2026 history is not loaded          →  [ Load the 2026 history ]
Part of the 2026 history is missing     →  [ Load the missing 3 day(s) ]
```

Unrelated days are left alone: loading into a project holding three August test
days gives 119 days, not 116, and those three keep their readings.

**Ranges are calendar months now, not rolling windows.** "The last 30 days" and
"this month" answer different questions, and a monthly report wants the second —
a range starting on the 1st can be compared with the one before it, and 9 July
to 8 August cannot be compared with anything.

| | |
|---|---|
| **This month** | the 1st onward — `August 2026 · 8 days · 1 Aug – 8 Aug 2026` |
| **90 days** | the last 90 recorded days |
| **All** | everything |
| **Custom** | opens the panel below |

**Custom takes a whole month or an explicit span.** A dropdown lists every month
that has readings, newest first — one click for "show me June". Underneath,
**From** and **To** for anything else. Dates entered backwards move the end you
did *not* just type, rather than rewriting the one you are looking at.

The chart, the table and **Print daily record** all follow the selection, so
printing a single month is now picking the month and pressing print.

**New harness `test_stray.html`** — a project with unrelated days but no 2026
record. That state had no name, which is how the import bug got past me.

---

## v7  (cache `sinai-field-v7`)

**The daily record has a proper header.** It was a bare uppercase label like the
smaller sections, which undersold it — it opens a whole second view with its own
range, chart, table and printout. It is now a titled panel with a navy-to-gold
rule across the top, and a line underneath saying exactly what is on screen:

```
Daily record
Showing 30 of 116 days  ·  9 Jul – 8 Aug 2026
```

switching to `All 116 recorded days · 8 Apr – 8 Aug 2026` when you pick All. The
range chips sit below a divider inside the same panel, so the header and the
control that governs it read as one thing.

**The chips no longer carry counts.** "All 3" was the giveaway — a number inside
a button label reads as part of what you are choosing, when it is really a fact
about the data. The chips are now plainly `30 days` · `90 days` · `All`, and the
count lives in the header line where it belongs.

**A single chip is no longer shown at all.** With only a few days recorded the
only surviving option was "All", already selected — a chip you cannot change is
furniture. Below two options the row is dropped, and the header still says how
many days there are.

---

## v6  (cache `sinai-field-v6`)

**"Send by e-mail" never worked.** It built the PDF, then called a helper —
`_downloadBlob()` — that **was never written**. The call threw, the rejected
promise went nowhere, and the button sat on "Building PDF…" doing nothing. My
mistake, and it shipped because a click handler that returns a rejected promise
fails completely silently: no toast, no visible console entry, nothing an
operator could report beyond "nothing happens".

Three fixes, because one of them is the actual bug and two are why it survived:

**1. The helper exists.** It also revokes its object URL on a delay — revoking
straight after `click()` cancels the download in some browsers before they have
finished reading the blob.

**2. The PDF is now handed over behind a fresh tap.** Building takes several
seconds, and *both* delivery routes need a live user gesture: `navigator.share()`
throws `NotAllowedError` without one, and `window.open()` is blocked as a pop-up
for the same reason. The tap that started the build is long spent by the time
the file exists, so even with the helper in place the phone would have refused —
silently. A **Report ready** sheet now appears with **Share / e-mail**, **Save
PDF**, **Open Gmail** and **Cancel**; each runs inside its own tap. It also lets
whoever is holding the phone choose, instead of the app deciding for them.

**3. No button can fail silently again.** Print, Send by e-mail and Print daily
record all run through one wrapper that catches both thrown errors and rejected
promises and puts the message in a toast. A failed build now says
`Could not build the PDF: <reason>` instead of nothing.

Verified end to end: with no Web Share the sheet offers Save/Gmail and saves a
valid 355 KB single-page A4 PDF; with Web Share present the file reaches
`navigator.share()` with the right name and size; a simulated build failure
raises a warning toast and leaves the sheet closed.

Also swept the whole file for any other identifier that is called but never
defined — `_downloadBlob` was the only one.

---

## v5  (cache `sinai-field-v5`)

Two things you reported, and they turned out to share a cause: **the app never
said anything about the state of its cloud connection.**

**The footer said "Connecting…" forever.** It was written in exactly one place —
after a successful save — so an app that was connected, authenticated and
working sat on "Connecting…" until somebody typed a reading. Worse, a rules
failure looked identical to a slow network. Every outcome now reaches that line:

| | |
|---|---|
| `Cloud connected · 116 day(s)` | working, and how much it can see |
| `Cloud connected · no readings yet` | working; the project is simply empty |
| `Loading readings…` | fetching |
| `Offline — showing 116 saved day(s)` | no network, serving the local cache |
| `Cloud refused access — publish firestore.rules` | the rules were never published |
| `Cloud error: <code>` | anything else, with the code |

Losing the network does not fire Firestore's error callback — it goes quiet and
keeps serving its cache — so the online/offline events are wired up too.

**The history is now loaded from inside the app.** A separate loader page was
the wrong shape: it had to be uploaded, opened, signed into and then deleted,
and until all four happened the app showed no history and no reason why. Sign in
as admin and look under **Daily record** — while the project holds no readings, a
panel there offers to load the 116 days from `Ras Gara Test 2026.xlsx`. Press it
once; it disappears as soon as there is any history.

Safe to leave in production: admin only (enforced by the rules, not just the
screen), visible only when there are no days at all, and it skips any day that
already holds readings. `load-history.html` is deleted — one way to do this, not
two. `history-data.js` is now a deployed file, but it is fetched only when that
button is pressed.

**New harness: `test_empty.html`** — connected, authenticated, and completely
empty. That is the state a fresh deployment is actually in, and the one where
"no data" and "not connected" look the same if the status line is wrong.

---

## v4  (cache `sinai-field-v4`)

**116 days of history, and a daily record to read it in.**

**The 2026 history is loadable.** `history-data.js` holds every recorded day
from `Ras Gara Test 2026.xlsx` — 2026-04-08 to 2026-08-08, 2,783 hours with
readings — and `load-history.html` writes them into Firestore once. It reads the
Firebase config out of `index.html`, and it skips any day that already holds
readings, so running it twice cannot overwrite work the operators have done.
Delete both files from the server afterwards.

> The workbook types midnight as `0.5` (12:00) on **all 116 sheets** — a
> template typo. Keying the hourly slots off the TIME cell therefore drops one
> reading per day silently. The extraction uses **row position** instead, since
> the rows are chronological, and reads TIME only to learn the shift start.
> 228 of 232 daily totals reconcile against each sheet's own total row; the four
> that do not are listed at the end of this entry.

**Daily record.** Under the day view: every shift day, one row each, newest
first, tap to open. Range chips for **30 / 90 / All**, governing the chart, the
table and the printout together.

**Day-by-day chart** — each day's total, PETRECO against Ras Gara. Drift that is
invisible hour to hour shows up as two lines separating. Markers up to 45 days,
dropped beyond that where they merge into a band. An operator sees only their
own line.

**Print daily record** — its own document: range totals, trend chart, and the
full day-by-day table with the same red/green Difference column. Admin only.

**Two counting bugs found while testing against the real days, both fixed:**

- A day where only **one side** reported was showing a full-size difference
  against the other side's implied zero — 2026-04-25 read **−180 m³** when the
  truth is that PETRECO has no sheet for that day. The difference is now "—"
  unless both sides reported. `rgCalc` used `pAny || rAny`; it needed `&&`.
- The range totals summed each column over every day, comparing 116 Ras Gara
  days against 114 PETRECO ones and booking the two missing sheets as loss
  (−1,412.9 m³ against a true −1,046.9 m³). They now cover only the days both
  sides reported, and the subtitle says how many were excluded.

Also: `Math.abs(null)` is `0`, so a missing difference printed as a confident
"0" in two places. `rgAbs()` replaces that pattern. The daily-record report was
missing the legend's stylesheet, so its two series names ran together as
"PETRECORas Gara".

**Four days where the source workbook disagrees with itself.** Loaded as the
hourly readings say, and listed here rather than quietly smoothed:

| Day | |
|---|---|
| 2026-04-08 | hourly PETRECO sums to 92.5; the sheet's own total row says 51.5 |
| 2026-04-27 | no PETRECO hourly data at all; the HISTORY sheet says 193 |
| 2026-06-06 | Ras Gara hourly sums 5 short of the sheet total |
| 2026-06-07 | same, 5 short |

**New test harnesses.** `test_hist.html` and `test_hist_rg.html` are the offline
harness seeded with the 116 real days instead of three synthetic ones —
`python3 test_build_hist.py` regenerates them. A range chip, a 116-point chart
and a one-sided day are not things three days can show you.

---

## v3  (cache `sinai-field-v3`)

**The difference now shows its own sign.** It is PETRECO − Ras Gara, so a day
where Ras Gara metered more reads **−143**, not "+143". The card had been
inverting the sign while the Difference column of the daily history right below
it printed the raw value — the two disagreed on screen. They now agree, and the
printed report agrees with both.

| | Difference | |
|---|---|---|
| Ras Gara metered **more** than PETRECO received | negative | red |
| PETRECO received at least what Ras Gara sent | positive | green |

**Footer credit** — "Powered by Sherif Morshed" under PETROBEL · Sinai Field,
on screen and at the foot of the printed report.

## v2  (cache `sinai-field-v2`)

**Backup & migration removed.** The admin JSON export/import is gone, along with
its markup, styles and code. This application no longer has any path in or out
of another PETROBEL system.

> If the readings taken while Ras Gara was a tab in Land Wells are still wanted,
> `wells/archive-rasgara-readings.html` saves them as a JSON file — but that is
> an **archive**, not a migration. There is no longer anything here that can
> read it back.

**The difference is now highlighted, and the colour means something.** Oil
leaves Ras Gara and is received at PETRECO, so the two totals should agree:

| | |
|---|---|
| **Red** | Ras Gara metered **more** than PETRECO received — oil PETRECO cannot account for |
| **Green** | PETRECO received at least what Ras Gara sent |

The card takes a tinted ground and a coloured edge, not just coloured digits,
and the same rule colours the Difference column of the daily history. The
decision lives in one place, `rgDiffIsBad()`, with the reasoning beside it —
the sign reads backwards if you think of it as a plain shortfall, so it is
written down once rather than inlined three times.

**The written summary is gone from the printed report.** It now runs KPI cards →
hourly table → rate chart. The summary text is still generated for the body of
the e-mail, where it is the only thing carrying the numbers.

**The source is clean.** Every reference to Land Wells, to versions of it, and
to migration has been removed from `index.html` and from all three documents.
The folder is `sinai-field/`. Someone opening this project now has no reason to
go looking at another one.

---

## v1  (cache `sinai-field-v1`)

First standalone release. Hourly PETRECO and Ras Gara entry on a 06:00 → 05:00
shift day, three roles, the comparison chart, the printed report and the
e-mailed PDF, offline support, and per-side merge writes so two operator groups
cannot overwrite each other.
