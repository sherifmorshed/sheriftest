# Sinai Field — Changelog

## v15 — PETRECO scanners every three hours

Service-worker cache `sinai-field-v15`. Only `index.html` and `sw.js` change;
`firestore.rules` is unchanged.

**All five PETRECO scanners — 29 BIS, GB #1, GB #3, L.O.T.F and M.O.T.F — are
now entered every three hours from 06:00**, eight periods a shift
(06:00→09:00 … 03:00→06:00), the same cadence as the tank battery scanners. It
was twice a day on twelve-hour periods.

The entry table keeps the twelve-hour figures as subtotal rows under the four
periods they cover, because that is how the shift is reported. Below them the
day total, yesterday, and the change — and the change appears only once all
eight periods are entered, the same rule the report card uses.

**Old days are not touched and not misread.** Every day recorded before this
release is stored as two twelve-hour halves and is read exactly as it always
was: it still totals, and still compares over 12 and 24 hours. Over 3 or 6
hours it says **12 h only** rather than showing a figure it does not have.
Each half decides this for itself, so a changeover day — the morning entered
the old way, the evening the new — is right on both halves. The moment any
three-hour period of a half is typed, that half is three-hour data and the old
figure for it stops counting.

**The report card.** L.O.T.F and M.O.T.F now have their own 3- and 6-hour
figures, so the PTB Production total adds up over those windows too — it
previously could not, and read "12 h only". The drain section likewise.

**Scanner analysis.** The PETRECO charts are now eight three-hour bars per
section and per meter, today against yesterday. The KPI cards show the day,
the change against yesterday and the 7-day average, then each twelve-hour
half. The five PETRECO scanners also appear in the Monitoring Production grid,
under their own 06:00 header row and clearly labelled PETRECO — they are not
tank batteries and are never added into a battery total. Comparisons there
follow the same rule: a shift still being read is not compared, and the 7-day
average counts complete days only.

**The tank battery side of Scanner analysis now follows the same rule**, which
it did not: the "Twenty-four hours — today vs yesterday" table, the twelve-hour
halves table and the chips on the three-hour charts compared a shift still
being read against a finished one and reported the unread hours as a loss. They
now say **not complete** until the shift (or that half) is fully read, and mark
today's figure in italics. The printed day report carries the same table, so it
is fixed there too.

Storage: three-hour periods are written to a new `q` field on the same
document; the old `v` is left alone. Nothing is migrated and nothing is
rewritten.

## v14 — report card: 3, 6, 12 and 24 hours

Service-worker cache `sinai-field-v14`. Only `index.html` and `sw.js` change.

**The report card period now offers First 3 hours, First 6 hours, First 12
hours and 24 hours** (Second 12 hours is still there, last). Every line reads
the window on its own clock, and each block heading now prints it: for the
first 3 hours that is 05:00–08:00 for the Belayim batteries and 06:00–09:00 for
T.B. 10/1, PETRECO and R/G.

**Nothing is compared until today's window is complete.** A window is complete
when every reading inside it exists — both three-hour intervals for 6 hours,
all six hourly R/G readings for 6 hours, and so on. Until then:

- today's figure is shown in italics marked **SO FAR**;
- yesterday's figure is still shown, for reference;
- the Difference reads **not complete** instead of a gain or loss;
- the heading adds **IN PROGRESS**.

The rule applies line by line and to every total: the Belayim TOTAL is compared
only when all four batteries have the whole window, and the R/G gap only when
both meters do. A short window on yesterday's side (a missed reading) is marked
**incomplete** and is not compared either.

This replaces the earlier "like for like" method, which compared today's part
window against the same hours of yesterday. That still produced a difference
for an unfinished window; now there is none until it is finished.

**PETRECO's scanners are read per twelve hours**, so they have no 3- or 6-hour
figure. Over those windows their lines read **12 h only**, and so does the PTB
Production TOTAL, because two of its four streams (L.O.T.F, M.O.T.F) are
missing — a total without them is not the PTB figure. T.B. 10/1 and Received at
PETRECO still show their own 3- and 6-hour figures.

The printed card stays one A4 page for every period (861–903px of 1085).

## v13 — no lost readings

Service-worker cache `sinai-field-v13`. Ten files deploy (see `SETUP.md`).

Seven faults, all reproduced in a browser before they were fixed and each now
covered by a check that fails on v12. The first three lost readings silently.

**A reading typed while another device saved was lost.** Every save bumps a
version stamp that all devices watch, and a device that sees it downloads the
data again and replaces its own copy wholesale — including a value typed less
than a second earlier and still waiting to upload. The box then showed the old
value and the new one was never sent. With five battery phones sharing one
stamp, and PETRECO and Ras Gara sharing another, this was not rare. The same
re-download rebuilt the table under the operator's finger, which also closed
the phone's keyboard mid-number.

Now every typed cell is held in a queue, with its value, until the cloud
accepts it (`makePending()` in the shell). A download is laid back over with
whatever is still queued, and a table whose box is being typed in is updated
in place around that box instead of being rebuilt.

**A save could erase someone else's correction.** A save sent more than was
typed — a whole row for the tank batteries (scanner, WHP and correction
together), both periods for a PETRECO meter, and every PETRECO or Ras Gara
hour of the day for R/G. A phone that had not synced since the admin corrected
a value sent its old copy back over the correction: an operator who changed
only a WHP reset the admin's correction to nothing. Saves now send exactly the
fields that were typed and nothing else.

**Changing the date before the save went out stranded the entry.** R/G and
PETRECO saved whichever day was on screen when the one-second delay ran out.
Type on the 17th, switch to the 16th, and the 16th was written while the 17th
stayed on the phone only, until the next sync overwrote it. The queue is keyed
by the date the value was typed on.

**The queue survives.** It is kept on the device per account, so a save that
fails — no signal — is retried, and one still waiting when the app is closed is
sent the next time the same account opens it. It is never sent by a different
account signing in on that phone. Pending saves are also sent immediately when
the app is put in the background and before signing out, rather than waiting
out the delay.

**The PETRECO entry tables appeared under R/G Production for admin.** They are
embedded in A/R Production → Entry, but every tank battery refresh re-showed
them whatever tab was open, so they sat at the bottom of the R/G page. They now
follow the open tab, and the PETRECO page lives inside the app body so signing
out hides it with everything else.

**PETRECO's tab lost its heading and date picker after an admin sign-out.** The
"embedded" marker was added for admin and never removed, so PETRECO signing in
on the same page got a tab with no date box. It is now set from the role at
every sign-in.

**The report card's 12-hour periods ignored R/G.** "First 12 hours" printed the
whole day's From Ras Gara and Received at PETRECO, and added that whole day into
the PTB Production total beside twelve-hour figures. R/G now uses rows 06:00–17:00
for the first half and 18:00–05:00 for the second.

**An account in no role list saw an error instead of an explanation.** The code
treated it as a read-only viewer, but the rules refuse it every collection, so
it got an empty app and "Cloud refused access" in the footer. It now gets a
"No access" page, starts no listener, and the footer says the account has no
access. The rules are unchanged — widening them so any account created in the
console could read production data would be the wrong fix.

Also fixed: PETRECO's own calculated Cumulative column did not update while
typing, only on the next full redraw.

Rules: **no change.** `firestore.rules` is the same as v12.

Development only: `firebase-stub.js` now enforces every collection's rules, not
just the tank batteries', and a new harness `test_viewer.html` signs in as an
account with no role.

## v12 — PETRECO scanners, report card, chart detail

Service-worker cache `sinai-field-v12`. Twelve files deploy.

## v11 — Tank Batteries

"Where the hours went" is now **Monitoring Production real-time**. The grid is
sized to the page — 90% of the available width, centred, large figures — and
carries no note underneath it at all.

Its columns are clock times, headed with the time each interval ENDS — the
05:00→08:00 three hours is headed 08:00, because that is the reading the figure
came from. The two shifts get a header row each, sitting directly above the
batteries that run them (08:00…05:00 for the Belayim four, 09:00…06:00 for
10/1), so nothing is ever labelled with a time it was not read at and the
ordinals are gone.

Fixed: the grid was reading the date SELECTED ON SCREEN rather than the date it
was asked to draw, so a printed report for any other day came out empty. Found
by looking at a rendered report; the tests had never caught it because they set
the date first. There is now a test that prints one day while another is
selected.
**Top battery / lowest battery cards are gone**, replaced by **vs 14-day** and
**vs 21-day** averages alongside the 7-day. Ranking four batteries said nothing
about whether the line is performing; three trailing baselines tell a bad day
apart from a bad fortnight.

Comparisons are in **m³, not percentages** — everywhere. "Down 4%" at Belayim
and "down 4%" at 10/1 are very different barrels, and barrels are what ships.

The pair of daily gain/loss charts is gone, replaced by a **24-hour today vs
yesterday table**: every battery and both group totals, with the gain or loss as
a plain figure in green or red. Reading a number off a bar is worse than reading
the number.

The **daily totals table** is rebuilt for its real job — scanning a long run of
days for where production fell away. Weekday spelled out, larger type, sticky
header, zebra rows, a red edge on any day Belayim produced less than the day
before, and a change column per group in m³. Group columns are tinted so the two
lines read apart at a glance.

"shipped to PETRECO" replaces "own line to PETRECO".

Date axes read "10 Jul", not "07-10". The same page carries three-hour ranges
written "05–08", and a date in the same NN-NN shape was read as a time — the
gain/loss chart looked like it was plotting 07:00–10:00. The gain/loss chart
also now states outright that each bar is one day against the day before, and a
stepped axis label is dropped when it would crowd the final date.

**Daily-only history.** A day can now carry a `dayTotal` with no readings
behind it — a figure taken from the daily scanner sheet. It totals, compares and
averages like any other day, but has no three-hour detail and never pretends to:
the panel says "Daily figure only", the record table tags the row `daily`, and
the monitoring grid shows dashes. The moment a real reading is entered for that
battery and day, the measured figure wins and the imported one steps aside.

**The shift boundary is one reading, not two.** A day's closing reading and the
next day's opening reading are the same meter at the same moment, written down
twice. Operators were entering it on one day and not the other, which left
whichever day missed out a full interval short — through no fault of theirs,
because there is only one reading to take.

It is now entered once, on EITHER day, and written to both. Nothing is invented:
this is not a guess at a reading nobody took, it is the reading they did take,
filed where it also belongs. There is no new control, no marker and no wording
to read — the other day is simply already correct when they reach it.

Days recorded before this can still be missing one end; the reading is on the
neighbouring day, so it is read across rather than leaving an interval
unaccounted for. That fill is read-only and writes nothing.

A correction is deliberately NOT mirrored. At index 8 it belongs to that day's
last interval; at index 0 of the next day it would belong to an interval that
does not exist.

This revises an earlier decision. The opening reading was deliberately left
un-filled on the grounds that "a meter reading nobody took is worse than a blank
one". That reasoning was about inventing a figure, and it does not apply here:
the boundary reading was taken, it was just filed on the other day.

Dirty-tracking is keyed by DATE now, since one entry legitimately changes two
days and both have to reach the cloud.

**Charts open.** Tapping any chart on the Scanners page opens it larger with
the figures written out underneath — every value on the bars, and a table of
the numbers with a Total row. A bar is a shape; reconciling production needs
the number. Closes on Escape, on the backdrop, or on the X. Keyboard-reachable.

A difference column is shown only where the two series are the SAME measurement
at two different times. It is never inferred from "there are two series": the
daily chart carries Belayim and T.B. 10/1, and subtracting one delivery line
from the other would have been a number that means nothing. Caught by testing
the opened table rather than the chart.

**The admin's tabs are two, not three.** `R/G Production` keeps its name;
everything downstream of it — the tank batteries and PETRECO's own scanners —
is now `A/R Production`, with three pages under it:

- **Entry** — the tank battery panels AND the PETRECO scanners on one screen,
  so a correction to the day is one place, not two tabs
- **Report card**
- **Scanner analysis** (was `Scanners`)

The embedded PETRECO entry drops its own page header and date bar and follows
the date chosen above it: two "Shift day" boxes on one screen is a question, not
a tool. PETRECO's own operators keep their own top-level tab, unchanged — this
is an admin-side grouping only, and tank battery operators see none of it.

Admin now starts the PETRECO listener despite having no PETRECO tab, because
the data feeds both that entry page and the report card.

**PETRECO scanners.** PETRECO run the central processing facility the tank
batteries feed, and they now record its own readings on their own tab:

- **Drain of the tanks** — 29 BIS, GB #1, GB #3
- **PETRECO Crude Oil** — L.O.T.F, M.O.T.F

Laid out TIME DOWN THE LEFT and SCANNERS ACROSS THE TOP — the same way round as
the PETRECO/Ras Gara readings these same operators already fill in every day. It
was the other way round at first; an operator moving between the two screens
should not have to work out which axis is which. Two typed rows, one per
twelve-hour period (06:00→18:00 and 18:00→06:00), then day total, yesterday and
the difference derived beneath them, with a Total column down the right. A period is a QUANTITY for those twelve hours,
not a meter reading to be differenced — so unlike the tank batteries there is no
opening reading and no shared boundary. A missing period is never counted as
zero, which would report a shut-in that did not happen.

Own collection `pfReadings/{date}__{meter}`, own rules: admin and PETRECO only.
A tank battery operator cannot see it and a PETRECO operator still cannot see
the tank batteries.

**Remarks** are a free-text note per day, entered on the same tab and printed on
the report card. The card omits the block when there is no note — an empty box
on a printed report is a question nobody can answer.

**The card is tighter.** Row padding, the gap between sections and the header
were all cut back: 1,124px to 946px on a phone and 1,355px to 987px on a desktop,
with nothing removed. Five sections read as one card now rather than as five
tables with space between them. The printed version already had its own
measurements and is unchanged.

**Fixed: the card's total row did not shrink on a phone.** `tr.tot td` carries
its own font-size, which outranks the rule the phone sizes were written on, so
every cell shrank except the totals — 12.5px rows with an 18px total, and the
columns stopped reading as columns. The phone rules now answer every size set
above them, and there is a second step down below 400px. Anything that sets a
size on a cell has to be answered in both.

**Every section is always drawn**, filled or not. Sections used to be omitted on
a day with no readings, which meant PETRECO's two blocks were invisible until
somebody entered data and looked like they had never been added. The card is a
standing form: an unfilled section shows dashes, which is a smaller question
than a section that vanishes.

The printed card is **one A4 page** — measured at 881px against 1085px of
printable height, with all five sections and the remarks on it. It gets its own
set of measurements rather than the screen's: five sections and sixteen rows fit
paper only if the paper version is sized for paper. The screen card is
unchanged.

**Temperature, in °C, on every tank battery.** A fourth column beside Scanner,
Production and WHP, read at the SAME nine times as the scanner — the table is
unchanged at nine rows and nothing about the scanner moved.

Temperatures are stored against the HOUR OFFSET from the shift start in their
own `temp` map on the same document, rather than inside the scanner rows, so a
battery could be put on a different cadence later without moving anybody's data.
A temperature save writes only the `temp` map and leaves the scanner rows alone.

**No rules change** — temperature lives in the document the battery already
owns, so the existing per-battery access covers it.

**Temperature tab** for admin, alongside Entry, Report card and Scanner
analysis: average, range and spread per battery; all five plotted through the
day on one clock face, openable for the exact figures; and a reading-by-reading
grid shaded against each battery's OWN range for the day, so a hot battery and a
cool one are each read against themselves.

**Fixed: a cached day belonged to whoever cached it.** An operator caches ONE
battery; an admin caches all five. The local cache was not stamped with the
account, so an admin signing in on a device an operator had used inherited that
single-battery cache — and because the version stamp still matched, the full
read was skipped and the admin saw one battery and four blanks. The cache now
carries the account that wrote it and is dropped when the account changes. Found
by looking at a rendered screenshot, not by a failing test.

Temperatures are spot readings — never differenced, never summed.

**PETRECO on the Scanner analysis page**, given the same treatment the tank
batteries already had, on its own shape — two twelve-hour periods rather than
eight three-hour ones:

- Today at a glance per section: today, vs yesterday, vs the 7-day average, and
  each period on its own card
- Twelve-hour production today vs yesterday — one chart per section and one per
  meter, all of them openable for the exact figures
- A twenty-four-hour table: every meter with its section total underneath
- Daily production across the range, driven by the same 30/90/All chips as the
  battery record, with a day-by-day table

Also fixed while adding it: paired bars were separated by a fixed 2px, which is
fine for eight intervals and far too close for two — the value labels of today
and yesterday overlapped each other in the opened view. The gap is a share of
the band now, so it scales with how many bars there are.

**Fixed: a part day was compared against a whole one.** Six hours read today
against twenty-four of yesterday reported a collapse in production that had not
happened — the rest of today simply had not been read yet, and the card said so
in red as if it were a loss.

Yesterday is now summed over EXACTLY the readings today holds and no others, so
what is compared is like for like. Applied to every line on the card: each
battery, the Belayim total, both PETRECO sections, PTB Production, and the R/G
rows hour by hour. Where nothing has been read today, yesterday stands on its
own and there is no difference drawn at all rather than a difference against
zero. The gap between Ras Gara and PETRECO needs both sides on both days, or it
is not a gap.

When the day is short the heading says so — "12 HRS READ SO FAR" — because every
figure below it is then "so far" rather than "for the period".

**The card follows the circulated layout**, four sections in this order:

1. **Belayim T.B. Scanners** — 6/1, 6/2, 8/1, 8/2 and their total
2. **PETRECO Scanners — drain of the tanks** — 29 BIS, GB #1, GB #3 and their total
3. **PTB Production** — L.O.T.F, M.O.T.F, T.B. 10/1 and Received at PETRECO,
   added together: the streams that reach PETRECO in their own right
4. **R/G Production** — From Ras Gara, Received at PETRECO, then the gap between
   them, in the order the oil travels

T.B. 10/1 no longer has a block of its own; it is a line inside PTB Production.
"Received at PETRECO" appears twice on purpose — once as a contributor to the
PTB total, once against what Ras Gara sent. Remarks always appear and read
"— No remarks —" when empty, rather than the block disappearing.

**The report card now carries all of it** in the order of the card colleagues
use: the Belayim batteries, T.B. 10/1, PETRECO drains, PETRECO crude oil, the
R/G comparison, then remarks. Each section carries its own total and no section
is added to another.

**T.B. 10/1's pressure column reads `bar`**, the other four read `psi`. Like the
shift start, the unit is a property of the BATTERY rather than of the module.
Display only: WHP is never summed and never compared across batteries, so the
two units never meet in one figure.

**Operators get the entry table and nothing above it.** The summary cards are
admin only now. For an operator they were worse than surplus: he holds only his
own battery's data, so a card headed "Belayim Tank Batteries" was showing ONE
battery's figure under the name of the whole group. His own day total is still
on the panel header, where he is already looking.

**The reading-time explanations are gone.** The operators entering these
readings do not read English, so sentences about shift windows and boundary
readings were never going to help them — and since the boundary is now one
reading written to both days, the disagreement they described cannot happen.
Removed: the per-panel shift window, the hint above the table, the
opening-does-not-match-yesterday's-closing warning, and the shift label on the
card's R/G block.

What stays is what does not need reading: the times run down the left of the
table, and the meter-reset warning remains because a backwards scanner is a
fault somebody has to look at.

The card also carries the **R/G production comparison** — "Received at PETRECO",
"From Ras Gara" and the difference between them, named for what each figure is
rather than for the meter it came from, today against yesterday, in the same layout. Read
through `window.__RG`, so it stays a view of the readings module rather than a
second copy of its arithmetic. There is deliberately NO total row: the two
meter the same oil at two points and adding them would count it twice, so the
figure that means something is the difference, and that gets its own row. The
block is omitted entirely on a day with no readings rather than printing a row
of dashes.

**Report card tab.** A third page on Tank Batteries, admin only, reproducing the
card colleagues already read every morning — scanner, today, yesterday,
difference — in the app's own colours rather than the original blue and yellow.
Print and e-mail buttons; the printed card is one A4 page.

It follows the group model: the Belayim four with their TOTAL, then T.B. 10/1 on
its own. A group of one gets no TOTAL row — the same figure twice under two
names only invites the question of why they differ.

The original card covered twelve hours, so the period is selectable — 24 hours,
first 12, second 12 — and the heading says which is on the page. An imported
daily-only day answers for the whole day and shows a dash for either half,
because it has no intervals to halve.

**Password reveal on the login screen.** A long password typed on a phone with
nothing but dots to check it against is how people get locked out. It lives in
its OWN script block and is delegated from the document: the first attempt sat
in the shell block beside the Firebase boot, and when that boot throws — a
placeholder API key is enough — the listener was never reached and the button
did nothing. It also climbs to the button by hand instead of using closest(),
because a real tap lands on the icon inside it.

**The monitoring grid fits a phone.** Its columns were divided evenly whatever
was in them, so a five-figure number in a 30px column spilled straight out of
its cell. On narrow screens the columns are sized to their CONTENT instead, and
the type steps down: the grid went from 549px wide to 372px, fits outright at
412px and above, and scrolls 10-25px inside its own box on a smaller phone
without ever dragging the page sideways. Measured at 375, 390, 412 and 768px,
with a test that fails if any cell is narrower than the number in it.

A related trap worth knowing: the mobile rules were written ABOVE the base
rules, so the base won and nothing changed. Same specificity means source order
decides.

**Fixed a crash on upload.** The first version of the import read the sheet's
DECLARED range. This workbook declares A2:XFD1955 — every one of Excel's 16,384
columns — so a dense grid of it came to 32 million cells and killed the browser
tab; nothing was imported and the app had to be restarted. The grid is now sized
from the cells that actually exist (only populated cells are keys on the sheet),
capped as a backstop. The same file now parses in under two seconds at ~35 MB of
heap. There is a test that drives the real file through the real file input in a
real browser and fails if the tab dies — the earlier tests only exercised the
parser in Node, where the larger heap hid the problem.

The month dropdown defaults to the last month with at least 20 days, not simply
the newest — the newest is usually a few days of the current month.

**Import is a file upload**, on the Scanners page, admin only. Pick the daily
scanner workbook, get a preview — days found, date range, and every problem
spotted — then choose which month to import.

Columns are found by their HEADINGS, never by position: a column inserted into
the sheet would otherwise file the right figures under the wrong battery in
silence. A heading that no longer matches stops the import with the battery
named. The 10/1 column is picked by NET OIL, so the gas column of the same name
is not taken; TOTAL GROSS is excluded so it is never read as a battery.

The preview reports, before anything is written: days where the sheet's own
TOTAL GROSS disagrees with its four batteries added up, days missing a battery
figure, and that the Belayim columns are gross while 10/1 is net oil.

Writes go to Firestore with merge, so real readings already entered survive.
`xlsx.full.min.js` (861 KB) is deployed but deliberately NOT precached — it is
fetched on demand, so an operator's phone never stores a library for a screen
they cannot open.

**Two groups, not one field.** 6/1, 6/2, 8/1 and 8/2 sit at Belayim and send
their gross to PETRECO down ONE line; T.B. 10/1 is at a separate location and
sends its oil on its own line. Every total, comparison, chart and printed figure
is now per GROUP — **Belayim Tank Batteries** and **T.B. 10/1** — and there is no
all-five total anywhere, because adding two delivery lines together was never a
number anyone delivers. It also settles the clock question: the Belayim four all
start at 05:00, so their sum is clock-consistent, and 10/1 carries its 06:00
alone.

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
