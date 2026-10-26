# Physics breakthrough index: calculation and maintenance

Version: 3.0. Updated: 2026-10-27. Chinese counterpart: [计算与维护说明](physics-breakthrough-index.zh.md).

## 1. Purpose and accounting unit

The index describes the historical distribution of physical achievements recorded in this archive, combining the number of results with their importance. Its accounting unit is **one explicitly described achievement**: a theory, experimental discovery, observational dataset, measurement system, instrument or method, or substantive synthesis of physical knowledge. People are associated participants, not accounting units. Author counts, paper counts, lifespans, awards and page views do not directly add points.

The project uses a common editorial grading scale. Journals, original documents and historical institutions support facts, dates and attribution; they do not supply an “official score” for this project. Assessment rationales and versions are stored with the data so individual decisions can be revised.

Keep three dates separate:

- **Achievement date:** determines the annual index, using evidence of proposal, completion, first public report or discovery.
- **Person navigation date:** locates each person at a representative achievement in the directory. An estimated activity period may be used when achievement dates are unavailable, solely for navigation and density display.
- **Birth and death dates:** belong to the biography and do not replace achievement dates.

For example, the 1964 mass-generation mechanism and the 2012 discovery of the Higgs boson contribute to 1964 and 2012 respectively. The 2013 Nobel Prize moves neither result to 2013 and does not automatically create a third achievement budget.

## 2. Evaluation routes across historical periods

`assessment.route` has three values. A route selects appropriate evidence and evaluation practice, not an age multiplier. Achievements of comparable physical significance use the same grade scale, without an abrupt multiplier between routes.

| Route | Evidence and evaluation priorities |
| --- | --- |
| `historical` | Antiquity through the early modern period: books, manuscripts, observational records and reliable historical scholarship. Reconstruct contribution units such as concepts, quantitative relations, experimental traditions, datasets and systematic knowledge. Lack of a modern paper, DOI or citation count does not reduce importance. |
| `classical` | Formation and development of classical physics: original books, learned-society reports, experimental records and instruments. Evaluate quantitative laws, mathematical unification, precision measurement and reproducible experimental capabilities. |
| `modern` | Modern physics: original papers, collaboration reports, institutional records and journal milestones. Distinguish theoretical proposals, experimental discoveries, decisive tests and reusable methods. Paper counts and collaboration size do not measure achievement size. |

Select the route by historical context and evidence, rather than imposing one calendar boundary on every discipline. Early contributions may be assessed directly by the editors, provided the record identifies **what was actually accomplished**, the dating basis and the assessment rationale. Tycho's precision planetary observations, for example, deserve evaluation as a dataset and measurement contribution rather than a small residual factor assigned to Tycho as a person.

Historical naming must stay precise: Copernicus's early heliocentric proposal uses an editorial formation interval of 1502–1514. Around 1510 is a common estimate; 1514 is a documented circulation upper bound. The complete De revolutionibus publication in 1543 remains reporting metadata without a second budget. Kepler's planetary laws are separate achievements. The first two laws were published in 1609; the third was established in 1618 and published in 1619. Scoring follows each record's formation interval or year, not an indiscriminate publication-date rule. These results must not be merged into ‘Kepler proposed heliocentrism.’

## 3. Importance grades

`score` takes one of five values: `1, 2, 4, 8, 16`. The compatibility field `weight` must equal it. A grade is the total achievement budget, not a budget per author or per year.

| Score | Calibration meaning |
| ---: | --- |
| 1 | An incremental advance, local measurement or methodological improvement with identifiable physical content. |
| 2 | An important independent result that substantially improves understanding or experimental capability for a problem. |
| 4 | A major advance within a research direction, establishing an important phenomenon, quantitative law or broadly useful method. |
| 8 | A field-founding or major cross-field contribution, creating durable theoretical, experimental or observational capabilities. |
| 16 | A transformation of foundational frameworks or exceptionally broad unification. Newton's 1687 system of motion and universal gravitation is one calibration anchor for this highest grade. |

Evaluation considers conceptual novelty, quantitative explanation and prediction, empirical or measurement capability, scope and subsequent influence. These considerations guide an auditable rationale; they are not mechanically multiplied, and small tasks should not be assembled into a scoring contest. Long-term observations, instruments and theoretical unifications can all receive high grades. The specific decision belongs in the record's `assessment.rationale`.

`assessment.confidence` is `high / medium / low`, indicating editorial confidence in the assigned grade. It is not a probability or the probability that a scientific theory is true. Dating evidence may be recorded independently in `dateConfidence`. **Importance, confidence in grading and date precision are separate.** Sparse records do not automatically imply low importance, and a broad date range does not reduce the total achievement budget.

## 4. Achievement dates and annual allocation

`dateModel` takes precedence over legacy `year / dateRange` fields. `basis` records the dating basis; the builder can retain the original date fields in `sourceDate`. Negative years denote BCE. Year 1 BCE is followed directly by year 1 CE, with no historical year zero.

Prefer supported observation or formation dates, then dated research manuscripts or preprints, then the earliest verifiable public record. If dating remains uncertain, use a named editorial interval. Recommended `basis` values are `observation / achieved / documented-manuscript / first-public-record / editorial-interval`, with separate `timelineDates`. A journal receipt date proves only that the result existed **no later than** that date. When its manuscript year is used as an anchor, set `documented-manuscript` and `dateConfidence: "documented-upper-bound"`, preserve `received / published`, and explain this limit; do not claim the exact discovery or completion of thought is known. Other common `dateConfidence` values are `documented / approximate-source / estimated / undated`; they do not determine importance.

### 4.1 A single-year event: `point`

```json
{"kind":"point","basis":"first-public-record","start":1964,"end":1964}
```

The whole budget is assigned to that year. An established publication, report or discovery year cannot move to a person's navigation date and is not spread into neighboring years merely because it is ancient. If the source only provides an approximate year, retain `precision: "approximate"`; `start === end` alone must not turn an approximate date into an exact one.

### 4.2 Uncertain dating: `uncertain-range`

```json
{"kind":"uncertain-range","basis":"historical-interval","start":-310,"end":-290}
```

Split one total budget equally across the valid historical years in the interval. This represents uncertainty about the result's date, not an independent achievement completed in every year. The interval needs biographical, textual, historical or editorial support, explained in `dateNote`. Do not dilute a known single-year event with an arbitrary broad window.

### 4.3 Sustained work: `sustained`

```json
{
  "kind":"sustained","basis":"documented-work-period","start":1576,"end":1601,
  "allocations":[
    {"start":1576,"end":1585,"fraction":0.25},
    {"start":1592,"end":1601,"fraction":0.75}
  ]
}
```

This example illustrates the format, not a historical scoring conclusion about Tycho's observations. Phases receive `fraction` shares of **one** achievement budget, then divide their shares equally across their years. Fractions must sum to one. Phases must not overlap, exceed the overall interval or use year zero as an endpoint. Genuine unallocated gaps may remain. Without reliable phase evidence, omit `allocations` and divide one budget equally across the sustained interval. A phase never receives the entire budget again.

### 4.4 Raw annual formula

For achievement score `S_e` and annual share `p_e(y)`:

```text
I(y) = Σ_e S_e × p_e(y)
Σ_y p_e(y) = 1
Σ_y I(y) = Σ_e S_e
```

Sum only eligible, dated achievements. Historical records marked `indexEligible: false` remain in the catalog without adding points. A record replaced through `supersedes` also leaves the scored ledger. An undated record does not acquire an invented year; add a supported date model or a named editorial estimate event.

In v3, output `raw` equals `value`. There is no era-dependent smoothing kernel or automatic recent-year decline caused by spreading points into the unknown future. Adding a positive achievement or raising a grade cannot reduce the raw index in other years.

## 5. Distinct results, shared results and editorial estimates

An achievement with multiple contributors or jointly confirming papers retains one budget. Contemporaneous papers establishing the same core mechanism can jointly support one record. A theoretical proposal and its later experimental discovery can be separate results, each assigned to its actual year. Another instrument, repeat measurement or follow-up paper becomes a new event only if it contributes clearly identifiable new physics.

`eventFamilyId` groups related contributions to the same problem. Family membership does not automatically make records mutually exclusive; editors must still check whether each supplies distinct content. Use stable IDs and `supersedes` when merging, replacing or redefining records, retaining the old record and replacement relationship.

When a contribution is identifiable but not directly quantifiable from the existing catalog, create a named achievement event and use:

```json
{
  "assessment":{
    "basis":"editorial-estimate","route":"historical",
    "rationale":{"zh":"具体评估依据","en":"Specific assessment rationale"},
    "confidence":"medium","version":"3.0"
  },
  "sourceEstimate":true
}
```

Ordinary literature-backed records use `basis: "editorial-review"`. All grades are editorial assessments; the two bases distinguish whether the contribution record depends on additional editorial reconstruction. An editorial estimate must not be presented as a statement taken directly from a paper. Cite the actual material used and never invent a paper, DOI or precise date.

Retired v2 person residual scores must not be added alongside named events. `navigationEstimates` can retain activity periods and navigation dates but contributes no index points. Better evidence should update or replace an existing event, rather than count the same contribution again.

Outputs separately retain `rawObserved / observed` and `rawEstimated / estimated`. The first pair represents `editorial-review` events; the second represents `editorial-estimate` events. Here “observed” does not mean “experimental results only.” `uncertain` summarizes editorial estimates and uncertain dating components; it is not a statistical error band.

## 6. Person directory and density color

Each person appears once in the directory. Navigation prefers a more precisely dated result, then a higher score, then an earlier year. Interval anchors use the midpoint in continuous historical-year numbering. People sharing a year retain archive order. `sourceEstimate: true`, editorial estimates and approximate dates retain the corresponding estimate markers. Navigation never moves other results into the representative year.

Contributor density is independent of achievement importance and uses an 11-year window:

1. Calculate the annual share of an event covered by the window. For sustained work, sum `phase fraction × overlapping years / phase years`.
2. For one person's multiple events, take the maximum supported share so one person does not become several people.
3. Navigation estimate intervals enter the same deduplication with uniform shares, but never enter achievement scores.
4. Sum person shares into `people`; `density = people / 11`.

This describes the chronology of contributors supported by the archive, not the annual workforce of physics. Normalize histogram color by the maximum corpus density and interpolate RGB linearly through the supplied ROOT stops:

| Normalized density | RGB |
| ---: | --- |
| 0 | (0.9, 0.9, 0.9) |
| 0.25 | (0.15, 0.15, 0.15) |
| 1 | (1, 0, 0) |

There is no square-root or gamma transform. Bins touch and have no outlines. Histogram fill and achievement-title importance colors encode separate variables. The rectangular colorbar has a thin frame and 4px outward ticks below its lower edge. Suitable integer labels such as 0, 2, 4, 6 and 8 are positioned by their actual value divided by the maximum density, rather than by rounding fractional labels at unchanged positions.

## 7. Plot scale and achievement text

The database stores linear annual values. To show sparse ancient achievements alongside higher modern peaks, the horizontal plot uses an explicitly identified asinh display transform:

```text
width(I) = W × asinh(I / k) / asinh(M / k)
k = 1
```

`M` is the horizontal plotting limit and `W` the available width. Tick labels remain in original index values. The transform preserves zero, order and monotonicity. It changes no scores and does not independently normalize each era's peak to the same height.

A vertical screen pixel may cover several years. It displays their **annual mean weighted by overlap with the year intervals**, rather than the sum of a compressed period's points. An annual value occupies a unit-width cell centered on its year. BCE/CE conversion introduces no zero-year cell, and adjacent pixels do not each count a whole year at their shared boundary. The vertical timeline is piecewise linear, with marked segment breaks and linear year mapping within each segment.

Final display samples use separate pixel-space Gaussian smoothing with fixed `PLOT_SMOOTHING_SIGMA=1`, configured only in `website/src/app.js`. Smoothing does not cross timeline segment breaks and changes neither the annual ledger nor the right-hand yearly milestones. The webpage has no smoothing control.

The right side of the main page directly presents achievement titles and necessary dates, without scores, weights or “points per year.” Annual cards sort by total grade, preferring single-year results at equal grades. Expanded person rows select their most significant result independently of the directory anchor. Title color depends on the achievement's **total grade**, not its allocated value in a particular year, author count, contributor density or current filter:

| Total score | Text color |
| ---: | --- |
| 1 | `#414146` |
| 2 | `#704047` |
| 4 | `#a63843` |
| 8 | `#c72b3b` |
| 16 | `#df2434` |

## 8. Data files and build order

Source files are in `data/breakthrough/`:

- `events-*.json`: named achievements and original references, including editorial estimate events.
- `existing-source-patches.json`: source additions for existing achievements.
- `event-assessments.json`: v3 grades, evaluation routes, rationales and date-model patches.
- `editorial-event-patches.json`: named editorial additions and corrections.
- `index-config.json`: assessment version, review date and display settings.
- `journal-sources.json`: journal selection collections actually used.

The current frontend has one source directory, `website/src/`; default browsing and the root entry use `website/dist/`. The full builder generates bilingual person data, reads achievements, applies source, assessment and editorial patches, processes replacements, validates records, generates navigation and calculates the annual ledger. It atomically replaces `dist/` only after the complete package succeeds. The navigation helper is `scripts/lib/navigation-estimates.cjs`. `score / weight` remain mirrored. Person records come from `website/dist/data/archive.js`, and event `people` must reference existing person IDs.

`data/breakthrough/` contains source records, assessments, configuration and scientific audits only. All computed outputs go to `website/dist/data/`: `breakthrough-data.js`, `events.json`, `yearly-index.json`, `navigation-estimates.json`, `coverage.json`, `sensitivity.json`, `build-summary.json`, and both method-document copies. The retired `contribution-estimates.json` is no longer generated. Do not edit generated files directly.

## 9. Adding or revising a result

1. Search existing events and families. Decide whether the change is a new result, a source addition or a replacement, and exclude duplicate scoring first.
2. Check the facts, participants and actual achievement date. Supply Chinese and English titles, contribution descriptions, dating notes and real references.
3. Select the evaluation route, assign a five-grade total score, and record the rationale and confidence. Record uncertain dating evidence separately.
4. Set `eventFamilyId`, `assessment.version` and the date model. Check phase budgets for sustained work; provide `supersedes` where needed.
5. For a new person, update both biography editions and rebuild person data first. Use stable IDs for existing participants.
6. Run from the repository root:

```bash
python3 scripts/build_website.py
node --test website/tests/*.test.cjs
python3 website/serve.py
```

One full build generates the bilingual person archive, achievements and website resources, and publishes the output only after package validation. When only achievements change, use `node scripts/build_breakthrough.cjs` instead of the full build. The root `preview.command` opens the current website by default; opening the root `index.html` enters the same generated site.

Check that the annual sum equals the sum of all eligible event budgets, that separated cases such as 1964/2012 retain their dates, and that unknown dates, year zero, future years and duplicated phase budgets are handled correctly. Check full navigation coverage and agreement between Chinese and English titles, dates and method documents. In the browser, verify achievement colors and timeline/list synchronization. Sensitivity output compares the main scale `1/2/4/8/16` with `1/2/4/6/8`, keeping dates and event definitions fixed.

## 10. Migration from v2 and future versions

v3 retires person-generated residual scores and era-dependent triangular smoothing. Named contributions become event budgets through `event-assessments.json` or new event records, retaining original dates and references. Estimated person dates move to navigation only. The annual ledger uniformly outputs `raw === value`; asinh is applied only at display time.

When a score, date or event boundary changes, update its rationale, version or revision record and regenerate outputs. Changes to shared rules require matching updates to both method documents and tests. Preserve stable event IDs, old references and replacement relations, and make a reviewable Git change. Method version and review cutoff are separate: a preview or rebuild alone does not turn an old historical result into a “new achievement.”
