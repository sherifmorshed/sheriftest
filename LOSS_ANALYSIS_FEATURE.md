# 📉 Loss Analysis Feature — PETROBEL Land Wells PWA

This document describes the **Loss Analysis** tab and the monthly baseline
snapshot system added to the app. It is written so any admin or developer can
understand what was built, how to use it, and what (if anything) to configure.

> **All changes are additive.** No existing functionality, page, or data flow
> was modified in a breaking way. The live well dataset (`wells/landWells`) and
> every other tab work exactly as before.

---

## 1. What it does

A new **📉 Analysis** tab compares each well's **ACT** production between two
dates and reports **production losses per well, ranked biggest → smallest**,
with an automatic diagnosis of *why* each well lost oil.

It focuses on the ACT columns from the DATA BASE sheet:

- **ACT , M3/D** — gross rate
- **ACT.W.C %** — water cut
- **ACT NET** — net oil (the number losses are measured on)
- **DH Pump** — pump model (for pump up/downsize detection)

For every well present on both dates it computes:

```
Net-oil loss = (Baseline ACT NET) − (Current ACT NET)
```

and then explains the loss by decomposing it into:

- **Rate effect** — how much net oil was lost because the gross rate dropped
- **Water-cut effect** — how much was lost because water cut rose
- **Pump change** — downsized / upsized / type-changed, with an
  "upsized but no production gain" flag

---

## 2. How the data gets there (monthly snapshots)

The comparison is powered by dated **snapshots** stored in Firebase. There are
**two ways** a snapshot is created — both admin-only:

1. **Automatically on every `Update DB` upload.**
   When an admin uploads the normal monthly situation file through
   **Update DB**, the app updates the live data *and* saves that day as a
   baseline snapshot (keyed by the file's situation date).

2. **Manually via the "Comparison File" section (Update DB panel).**
   A dedicated upload zone — **📉 Comparison File (Loss Analysis)** — lets an
   admin upload an *older* month to store as a baseline snapshot **without
   changing the live well data**. Use this to backfill history (e.g. load an old
   June file while today's data stays live).

Each snapshot stores a slimmed-down copy of the wells (only the fields needed
for analysis) so the Firestore document stays small.

---

## 3. Using the Analysis tab

1. Open the **📉 Analysis** tab.
2. Pick a **Baseline (older)** date and a **Compare to** date from the
   dropdowns (they list every stored snapshot). The app defaults the baseline to
   roughly one month before the newest snapshot.
3. Tap **Compare**.

> **Fluctuation filter:** any loss or gain **below 5 m³/d** is ignored, because
> that is within the normal test-separator reading fluctuation and not a real
> production change.

You get:

### Summary cards
- Wells with loss + total net oil lost
- Wells improved + total net oil gained
- **Total net change** (losses minus gains) and its barrels/day equivalent —
  shown red if the field lost oil overall, green if it gained

### Losses sub-tab
Every losing well, ranked biggest loss first. Each row shows:
- Rank, well name, type
- NET before → after
- Colour-coded **reason chips** with the **main cause highlighted**:
  - 🟡 Rate ↓/↑
  - 🔵 W.C ↑/↓
  - 🔴 Pump downsized
  - 🟢 Pump upsized
  - 🟣 Pump type changed
  - "Missing in current snapshot" (well existed in baseline but not in the
    current file — counted as a full loss)
- Tap a row to expand a full breakdown (ACT rate / W.C / net before→after,
  pump before→after, stages, and the loss split into rate vs water-cut), plus
  manifold / tank battery / substation.
- A search box filters by well name.
- A **size filter** (two dropdowns: *from → to*) narrows the list to a chosen
  loss band, e.g. `5 → 50`, `50 → ∞`, or `<5 → 5` to reveal the small
  fluctuations. **Reset** returns to the default (`5 → ∞`). A live count shows
  how many wells match. The same size filter works on the Gains tab.
- **Work-Over / Rig status changes are detected automatically** by comparing
  each well's *Status* (and *Shut Down Reason*) between the two dates:
  - On the **Gains** tab, a well that went from *Waiting Work Over* / *Rig On*
    to *Producer* gets a green **"Restarted after W.O."** tag. A toggle button
    **🔧 Restarted after W.O. (N)** filters the gains to just those wells.
  - On the **Losses** tab, a well that went from *Producer* to *Waiting Work
    Over* / *Rig On* gets a red **"Stopped for …"** tag, and the
    **🔧 Stopped for W.O./Rig (N)** button filters the losses to just those.
  - The button count and the filtered list both respect the active size band;
    tap the button again (or switch tabs) to clear it.

### Shut/Start balance tab

A dedicated **Shut/Start** sub-tab summarises the whole work-over cycle for the
comparison period in one place:

1. **🔻 Lost to W.O. / Rig On** — every well that went from *Producer* to
   *Waiting Work Over* / *Rig On* (ranked by biggest net loss first).
2. **🔼 Restarted after W.O. / Rig On** — every well that came back to
   *Producer* from those states (ranked by biggest net gain first).
3. **📊 Work-Over balance footer** — sums the ACT data across both groups:
   - *Lost to shut-in (net)* and *Gained from restart (net)*
   - **Net oil balance** = restart gains − shut-in losses (green if the field
     is net-ahead on work-over activity, red if net-behind)
   - **Gross lost / Gross gained / Net gross balance** — the same totals on the
     ACT gross rate (`ACT , M3/D`).

Unlike the Losses/Gains tabs, this tab lists **all** shut/restart wells
regardless of the 5 m³/d fluctuation threshold, because a status change is a
real event even when the well was producing very little.

### Gains sub-tab
Same layout as Losses, but ranks the wells that **increased** net oil, biggest
gain first (green). Useful to see the impact of workovers, new pumps, or wells
brought back online.

### Pump changes sub-tab
All wells whose pump changed between the two dates, grouped as:
- ⬇ Downsized pumps
- ⚠ Upsized — **no production gain** (bigger pump, net oil did not improve)
- ⬆ Upsized — with gain
- ↔ Pump type changed

---

## 4. Do I need to change Firebase code?

**No app/SDK/config code changes.** Same project (`land-wells-petrobel`), same
`db`, same auth, no new API keys, no composite indexes (the feature only does
single-document reads and one single-document `onSnapshot`).

**You do need to update Firestore Security Rules** to allow the admin to
read/write the two new collections, otherwise snapshot saves fail with
`permission-denied`.

New collections:

| Collection / Doc | Holds |
|------------------|-------|
| `wellsSnapshots/{date}` | One baseline snapshot per situation date (slim wells) |
| `wellsSnapshotsMeta/info` | The list of available snapshot dates |

Add these blocks inside your existing
`match /databases/{database}/documents { … }` (use the **same admin-email
condition your existing `wells` rule uses**):

```
// Loss Analysis — monthly baseline snapshots
match /wellsSnapshots/{date} {
  allow read: if request.auth != null;
  allow write: if request.auth != null
               && request.auth.token.email == 'sherifmorshed@gmail.com';
}
match /wellsSnapshotsMeta/{doc} {
  allow read: if request.auth != null;
  allow write: if request.auth != null
               && request.auth.token.email == 'sherifmorshed@gmail.com';
}
```

Apply: Firebase Console → **Firestore Database → Rules** → paste alongside your
existing rules → **Publish**. If your current rules already grant the admin
write access via a broad catch-all (`match /{document=**}`), you may not need to
change anything, but adding the explicit blocks is clearer and safer.

---

## 5. First-time setup with your two files

To load the two months you already have (2 June 2026 and 8 July 2026):

1. Publish the Firestore rules from section 4.
2. Sign in as admin.
3. Go to **Update DB**:
   - Use **Comparison File** to upload the **June (02-06-2026)** file →
     stored as baseline `2026-06-02` (live data untouched).
   - Use the main **Update DB** upload for the **July (8-7-2026)** file →
     updates live data *and* stores snapshot `2026-07-08`.
4. Open **Analysis**, pick Baseline = 2 Jun 2026, Compare = 8 Jul 2026, tap
   **Compare**.

*(Validated result for these two files, with the 5 m³/d fluctuation filter:
436 real wells matched, 44 wells with a real loss (−652 m³/d), 39 wells with a
real gain (+802 m³/d) → net **+150 m³/d gained** field-wide. Biggest loss:
113-152 (119 → 10); biggest gain: 113-141 (+243).)*

---

## 6. Technical summary (for developers)

- **New nav button + page:** `nav-analysis` / `page-analysis`, wired into
  `showPage()`, `_refreshPage()`, and the `_stalePages` sync map.
- **New Firestore layer** (isolated in an IIFE at the end of `index.html`):
  - `wellsSnapshots/{date}` + `wellsSnapshotsMeta/info`.
  - `saveWellsSnapshot(wellsArr, dateStr)` — writes a slim snapshot + updates
    the meta date list (admin only).
  - `startSnapshotsListener()` / `stopSnapshotsListener()` — wired into the
    existing `startFirestoreListener` / `stopFirestoreListener`.
  - `uploadBaselineSnapshot(file, onDone)` — shared Excel→snapshot path used by
    both the Update DB "Comparison File" input and the Analysis backfill button.
  - Comparison, loss decomposition, pump heuristic, and rendering are all in the
    same IIFE, exposing only `window.refreshAnalysisPage / anlRun /
    saveWellsSnapshot / uploadBaselineSnapshot / start+stopSnapshotsListener`.
- **Auto-snapshot hook:** `importDataFile()` calls `saveWellsSnapshot()` after
  saving the live data.
- **XSS-safe:** all dynamic values escaped with `escHtml`/`escAttr`; row
  interactions use `data-*` attributes + a single delegated click listener (no
  inline handlers built from data).
- **Fluctuation filter:** a single constant `ANL_MIN = 5` (m³/d) gates every
  loss/gain calc, the summary totals, and the "upsized but no gain" pump flag.
- **Service worker:** `CACHE_NAME` bumped to `land-wells-v65`. (Every future
  change must keep bumping this or users won't get updates.)

---

## 7. Files in this delivery

| File | Purpose |
|------|---------|
| `index.html` | The whole app (now includes the Analysis tab) |
| `sw.js` | Service worker (cache `land-wells-v61`) |
| `manifest.json` | PWA manifest |
| `xlsx.full.min.js` | SheetJS (Excel parsing) |
| `html2canvas.min.js` | Screenshot/export helper |
| `icon.png`, `icon-192.png` | App icons |
| `well_locations.json`, `manifold_substation_locations.json` | Map data |
| `DEVELOPER_REFERENCE.md` | Full developer guide (updated) |
| `LOSS_ANALYSIS_FEATURE.md` | This document |
