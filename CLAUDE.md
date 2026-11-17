# CLAUDE.md — handover for the Volume & Performance Calculator

Owner: **Suddha**, an integration solution architect working on SAP BTP / hybrid iPaaS, with S/4HANA RISE Private Cloud. This repo belongs to the claude.ai Project "Integration Design for Performance and Volume".
Handover written 2026-11-17, updated after v7 was published.

## 1. Working rules (follow strictly)

- **Suddha leads; Claude reflects and assists.** Never take over the thinking or propose the big solution in one go.
- **Short answers by default**, about 100 words in everyday English with bullets. Explain more only when asked.
- **Build only when Suddha says "build".** Until then, collect points and plan.
- **No duplicate questions across cards.** Every question must be distinct and clear, and must visibly show what it feeds into the formula. Info-only fields are shown dimmed.
- **Every calculated value is labelled "Estimated"** and offers ✓ Accept / ✎ Override / ƒ Formula. Every platform result has a "Why" view showing the facts, the formula and the limits, editable for the current run only.
- **Confidence labels on every limit:** A = official doc, B = vendor blog/KBA/benchmark, C = community, E = empirical or assumed.
- **Don't change the original Slides decks** (claude.ai "Designing for Volume — Technical Storyline" and "Why Volume Matters — Business Storyline"). The in-app copy `app/concepts.html` may be updated.
- **Keep the Idea Register updated** (change log entry per milestone): https://claude.ai/artifact/DW9SpGovsccCRrYTBMtonf
- **Framework doc:** https://claude.ai/artifact/UNqoAih77mtANozQDeEzXX. Section 8 holds middleware research round 1.

## 2. Files and build

| Path | What |
|---|---|
| `src/body.part` | **The source to edit.** CSS additions, markup and all script, with the Guide already merged in. |
| `src/style.part` | Base CSS |
| `src/head-template.html` | Head (only the part before `<style>` is used) |
| `src/guide.part` | Standalone copy of the Guide code, for reference only. It is already inside `body.part`. |
| `build.py` | Assembles `app/index.html` = head + style.part + body.part |
| `app/index.html` | The built calculator. Never edit it directly: past hotfixes made here were lost. |
| `app/concepts.html` | 15-slide concepts deck, opened in an iframe overlay from the app |
| `app/evaluator-v0.3/` | Detailed technical evaluator for architects. Keep it as is. |
| `docs/middleware-capacity-ground-rules.md` | Deep-research report: limits, formulas, 19-row change table, items to measure |

**Workflow:**
1. Edit `src/body.part`.
2. Run `python3 build.py`.
3. Test in headless Chromium (Playwright). Use `keyboard.type` for number inputs rather than `fill`.
4. Publish to claude.ai.
5. Commit and push.

**Publish:** claude.ai artifact slug `efc5f6ae-ebb6-4b23-8f72-ef60982cb926` (https://claude.ai/artifact/WcH5iqktGPe5LvMJroy1xq). Use `publish_files` with files `index.html` ← `app/index.html` and `concepts.html` ← `app/concepts.html`, plus `slug` and `base_version`. The latest version is `1794950353-02d4` (v7); call `get_artifact` first to confirm it.

**Code landmarks in body.part:**
- `SET_DEF`: settings groups as `[key, label, unit, default, conf]`
- `P`: a proxy over the saved settings plus this-run overrides (`OV`)
- `RAW` / `CURVE`: daily curves
- `DEF` / `I`: inputs
- `calc()`: returns `{R,msgs,recs,avg,daily,ratio,rpm,typ,big,…,secs,inproc,…}`
- `tagFor()`: scale tags
- `CK` / `NA` / `capCk` / `platforms(c)`: platform checks
- `estBox` / `cardBody` / `openCard`: cards
- `renderResults()`: results
- `BANDS`: workload profile
- `G_CH`: Guide chapters
- `G_REV`: research-vs-settings review table
- `openDeck()`: opens the deck overlay
- `fxRender()` / `whyHTML()` / `restTbl()`: formulas; `{key}` in a formula renders as an inline factor input (this run only). Formula text = calculation `§` boundaries
- `rhoT()`: utilisation target by pool size (Fit rule); `capCk` / `rateCk` / `sizeCk` / `backlogCk`: checks; `rollZ()` / `worstZ()`: verdict roll-up
- `valBox()` / `sizeFormulas()`: card values with the formula directly under them
- Builder: `SOLC` (Solace classes), `MCOMP` (catalogue), `mdRule()` (positional rules), `mdEval()` (steps + hand-offs), `mdSet()` (per-step settings), `renderChain()`; state `I.chain`, `I.mdOpen`

localStorage keys: `vpc7_in` (inputs, from the 2026-11-17 build; `vpc5_in` was the older key), `vpc_set`, `vpc_curves`.

## 3a. v7 (built 2026-11-17)

- **Research corrections applied** (settings, each with its confidence label): iFlow capacity = `ciProcs` (default 1, JMS default) × `ciNodes` (2, E); HTTP sender `ciHttpCap` 50 (E); JMS transaction budget; Service Bus per MU by entity (6,800 / 5,000 / 1,600) and 1 MB relabelled as the HTTP/batch limit; APIM per tier (1,000 / 2,500 / 4,000) and v2 2 MiB buffer; Logic App = trigger concurrency + actions/s per WS3 ÷ actions per run + storage cap; Function = calls × core multiplier × instances; Solace class table (default E250: 10 MB, 50 GB).
- **Fit rule**: utilisation target by pool size (65 / 75 / 80 / 87 %), minus 10 points when peak ÷ average > ×3. `comfort` stays for rate and storage checks.
- **Not suitable** (slate): ADF continuous + tight SLA, stateless Logic App over 5 min, batch SLA in seconds, one-per-call for big sets. Only the decisive row (ADF traffic shape) sets a platform verdict to Not suitable.
- **Sizes** ≥ 1,000 B show as KB. **Formulas** sit under each value with inline factors; boundaries are a separate section (cards: "Boundaries for the tag"; Why: Calculation / Boundaries / Other factors).
- **Middleware design builder** (section after the platform evaluation): "+ Add step", platform then component, blocked choices greyed with the reason. Interpretations made in the build: a Solace topic or an ADF pipeline may start a chain; ADF may end it; queue consumers come from the next step (not asked twice); each processing step says "does the work" or "thin hand-off"; "Retries here" on retry-capable steps. HTTP sender flag: on = the whole message on one worker (memory check on the whole message), off = per record.
- Test with `python3 tests/test_v8.py` (Playwright; answers every input through the UI): click SVG parts with `dispatch_event('click')`. The older test_app/test_designer were removed: they relied on input defaults.

## 3b. Graphical middleware designer (branch `v7-graphical-builder`, 2026-11-17)

- `main` was reset to the v6 handover commit `14a7a8d`; all work from this chat lives on `v7-graphical-builder`. The live artifact shows v6; the branch build is published to a separate preview artifact, slug `9de77e8b-020f-402f-bfef-e0e8803a8469` (https://claude.ai/artifact/LVvbzWXhsHiaA5RsJZhPz8), latest version `1794955551-d5e3`; it declares the `downloads` capability (needed by Print PDF).
- The list builder is gone. Once all six parts are answered, the Middleware node shows **⊕ Design inside**; tapping it keeps the diagram as is and opens a pane beneath the node (dashed connector + zoom shape).
- Step 1: add platforms left to right (repeats allowed, e.g. BTP → Solace → BTP). Step 2: add components inside each platform box, top to bottom; blocked ones are greyed with the reason (same `mdRule`).
- Tiles are coloured by verdict; the slowest step carries a "bottleneck" tag; tapping a tile opens its settings and checks; the chain verdict and hand-off pills sit at the bottom.
- State: `I.mdPlats = [{p, comps:[{c,s}]}]`; `I.chain` is derived (`syncChain()`) and feeds `mdEval`. Code: `renderDesigner()`, `mdReady()`; badge drawn in `draw()`.
- Tiles show capacity and % used, or "rate unknown"; "slowest step" (neutral, 2+ measured steps) vs red "bottleneck" only when Adapt or Beyond (option C, Suddha 2026-11-17).
- Next (with Suddha): the following set of instructions after he reviews the visual effect.

## 3. State in v6 (kept for reference)


**Flow:** Source → Message (shown above the pipe) → Influx → Middleware → Delivery → Target.

**Components** carry scale tags only: **Standard / Needs attention / Critical**. No platform verdict is shown at component level.

**Results:** one card per platform (SAP BTP, Azure Premium, Solace/AEM, ADF, Target). Each card has a Size section ("does the biggest message fit?") and a Volume section ("does the busiest hour fit?").

**Verdicts:** Fit / Adapt / Beyond / Not applicable / Info.
- Fit: in process ≤ comfort% of capacity.
- Adapt: in process ≤ capacity, or average ≤ drain (the queue holds the backlog).
- Beyond: otherwise.
- Clear time = backlog ÷ (drain − avg) × 60.

**Busiest hour:**
- Daily curves (human / app / jobs) are shifted by region offset: Americas −5, EMEA +1, APAC +8.
- Countries are weighted by size group: large ×3, medium ×1, small ×0.3. The weighted curves are summed per UTC hour and the max is taken.
- The tool shows this beside plain multiplication for comparison.

**Header buttons:** 📘 Guide (10 chapters, with search) · 🎞 Concepts · ⚙ Calculation settings.

## 4. v7 BUILD PLAN (done; kept for reference)

### 4a. Apply the research corrections
Apply the "Change" rows in `G_REV` and `docs/…ground-rules.md`. Every value stays editable in settings and keeps its confidence label.
- **Service Bus throughput per MU:** queue ≈ 6,800 msg/s · topic with 1 subscription ≈ 5,000 · topic with 5 subscriptions ≈ 1,600 (B; 1 KB messages, ≤ 4 MU). `sbEntMB` 1 MB is the HTTP/batch limit, not an entity limit.
- **Azure APIM:** per-unit throughput by tier, Basic 1,000 / Standard 2,500 / Premium 4,000 req/s (A*, indicative). v2 buffers only 2 MiB when a policy reads the body.
- **iFlow capacity:** replace the constant 50 with concurrent processes per channel × worker nodes. Nodes are a setting (default 2, E). JMS sender default is 1 process; JMS transaction budget 150/500.
- **Logic App Standard:** replace stateful 300 / stateless 1,000 with trigger concurrency (max 100) + ≈ 90 actions/s per WS3 instance + ≈ 100k actions/min per storage account. Inputs: plan WS1–WS3 and instances. Stateless run 5 min; 100 MiB per message.
- **Function App:** 16 concurrent Service Bus calls per instance (docs may mean × cores) × instances (≤ 100).
- **Solace:** max message size and spool by service class. E100/E250 10 MB; E1K+ 30 MB. Spool 25/50/200/400/600/800/1,000 GB.
- **Fit rule:** utilisation target by pool size: ≤ 4 consumers 60–70%, 5–20 70–80%, > 50 85–90%. Lower it for bursty traffic (Kingman). Discuss the exact UI with Suddha if unclear.
- **Unsourced but kept as E:** country weights, JSON/XML byte rules, IDoc 1,063/524.

### 4b. v5 test observations
1. **"Not suitable"** for a mismatch of size, volume or traffic shape (e.g. continuous traffic on ADF): a neutral slate colour, separate from "Beyond" (capacity exceeded).
2. **Sizes of 1,000 bytes or more** display as KB (e.g. "1 KB", not "1003 B").
3. **Formula directly under each calculated value** (e.g. under Normal and under Biggest message), with the real numbers and the adjustable factors inline. Boundaries and tag thresholds go in a separate section, not in one common formula block. Apply this everywhere.

### 4c. Middleware design builder
**Where:**
- Comes after the inputs and the platform evaluation.
- The user expands the middleware layer and composes a simple chain: platforms in sequence (BTP, Solace, Azure, ADF) and components per stage.
- There are no fixed patterns up front.
- Everything is provisioned (no consumption plans).

**UI:**
- "+ Add step" chain builder, not drag-and-drop.
- Each step = platform, then component.
- Invalid combinations are blocked, with the reason shown.

**Positional rules:**
- Inbound may be: API (APIM) + iFlow · iFlow · API + Logic App · Logic App direct.
- Outbound can't be an API: it must be a Logic App or an iFlow.
- Solace inbound is always a topic; Solace outbound is always a queue.

**Per-component capacity settings** (ask only what decides capacity):

| Component | Settings |
|---|---|
| Solace topic | Protocol (SMF / AMQP / MQTT / REST) and service class |
| Solace queue | Consumer count; max message size per queue |
| BTP AEM / JMS sender | Parallel consumers × worker nodes |
| BTP HTTP inbound | Single worker per message (flag) |
| Logic App Standard | Plan WS1–WS3, instances, trigger concurrency, stateful/stateless |
| Function | maxConcurrentCalls × instances |
| Service Bus | Messaging units, queue or topic, number of subscriptions |
| APIM | Tier and units |

**Protocol facts:**
- SMF and AMQP use Solace's enterprise connection pool; MQTT, web messaging and incoming REST use the IoT pool. One client = one connection.
- All protocols are translated to SMF; size limits are per broker. Compression is SMF only.

**Evaluation:**
- Each step is checked on its own: size and volume.
- Hand-off checks:
  - size caps across hops (the smallest wins)
  - protocol and connection limits
  - the bottleneck step (min capacity)
  - the end-to-end SLA (sum of step times + queue waits)
  - retries at one layer only

**Later (not now):** patterns from Suddha's catalogue (pick one, or let the tool suggest).

### 4d. Still open (ask or measure; don't invent) — still open after v7
- AEM adapter parallel-consumer range and the tenant's worker nodes
- Solace msg/s per class
- REST delivery point throughput (≈ REST outgoing connections ÷ iFlow response time, E)
- Logic App actions/s per WS size
- Functions concurrency (16 vs 16 × cores)

## 5. Backlog (noted, not scheduled)

- The 3-year view: currently a second column when growth > ×1; revisit later.
- The target capacity question ("how many at a time"): revisit who can answer it.
- A volume estimator from business questions using CPG norms.
- The research suggests replacing the country weights with a volume driver per country (users, orders). Not yet discussed with Suddha.

## 6. Collected points D1, P2–P10 — BUILT 2026-11-17 (see 3c)

- **D1** Inline factor boxes look empty (only the confidence letter shows): Chrome number spinners eat the width. Hide spinners, size to the value, letter after the box.
- **P2** Allow Solace queue → Azure APIM (RDP) → Service Bus → Logic App / Function.
- **P3** Logic App → Service Bus → Logic App repeats (already allowed; keep tested).
- **P4** BTP: API → iFlow → API (back-end facade). Open: may a chain end with an API?
- **P5** Solace queue delivery mode: RDP (push over REST; assess REST outgoing connections ÷ next step's response time, E, vs class REST/RDP limits) or pull (AEM adapter / consumer: consumers × nodes). Open: may RDP push to an iFlow HTTP sender as well as APIM?
- **P6** Source link on every fact: evidence register (plan below). Research saved in `docs/source-references.md`.

- **P7** Influx bands must follow the scope set on the Source. Today the band edges (e.g. under 5k) are the same whether the number is global or for one typical country. Planned: when the volume is for one typical country, scale the edges by that country's share of the global weight (edge_country = edge_global × size factor ÷ total country weight), so "under 5k" for a small country in a 40-country rollout becomes a much smaller band. Show both: the country band and its ≈ global equivalent. Also (confirmed by Suddha): the day→hour conversion of the edges uses the combined multi-region curve (lower peak share), not one region's curve.

- **P8** No defaults in the inputs. Every chip question starts unselected and every number field starts empty, shown as "not specified" and highlighted until answered. Answers may be a value, a range, "not known" (where offered) or an accepted estimate. (Settings keep their defaults: they are calculation factors, not inputs.)
- **P9** No platform verdicts until every required input is answered. Before that, the evaluation shows what is still missing (per card), not results. The middleware designer gate uses the same "complete" rule, not just "card opened".

- **P10** "Print PDF" button: browser print dialog (save as PDF) with a print layout and a report appendix (summary + evidence register).

### P6 plan: evidence register vs the app's benchmark
- One register entry per settings key (and per class-table value): evidence value, confidence, primary URL + section, short snippet, date checked, status (confirmed · corrected · unverified · design choice).
- The **benchmark** is the value set in the app (saved setting or this-run override). Wherever a limit is used (tile detail, Why, settings, Guide), show: app value · evidence value · match or "differs from evidence" · confidence · "Open source ↗".
- No URL from memory: entries without a verified page show "no official source: measure" and the method.
- Guide "Sources" chapter and the settings modal are generated from the register.
- **Decision (Suddha, 2026-11-17):** keep the current defaults; flag each of the 11 corrections as "differs from evidence". **Review the 11 corrections after this session's build is complete.**

## 3c. Build of 2026-11-17 late evening (branch `v7-graphical-builder`)

Built D1, P2–P10. Readings taken for open questions (confirm with Suddha):
- A chain may end with a BTP API only when it follows an iFlow (back-end facade); nothing may follow that API.
- RDP (queue delivery = RDP) can push to an API (Azure or BTP), an iFlow HTTP sender, a Logic App or a Function. Pull queues are read by an AEM-sender iFlow, a Logic App or a Function.
- "Not known" only where it already made sense (average volume). Settings keep defaults.

What changed:
- **Inputs (P8):** `RAWI` holds the raw answers (all empty at start); `I` is a proxy that returns neutral fallbacks (`FB`) only for drawing. Inputs read raw; unanswered fields are highlighted ("not specified"). Regions is always asked.
- **Gate (P9):** `missing(k)` / `cardDone(k)` / `allDone()`. Card tags, card estimates, platform verdicts, the workload profile, the copy/print summary and "Design inside" appear only when complete; before that a "still to answer" list links to each card.
- **Bands (P7):** `scopeK()` = size factor ÷ total country weight for a typical-country volume; `peakShareScope()` uses the combined region curve for a global volume. The Influx card shows the scale note and global equivalents.
- **Builder (P2–P5):** new `mdRule`; queue `mode` pull/rdp with `rdpConns`; RDP rate = connections ÷ response time (next step's time, else setting `rdpRtt` 0.5 s, E); class REST outgoing connections check; JMS per-message row now cites the 1,280 MB evidence.
- **Evidence (P6):** `EVID` / `EVU` / `EV_REVIEW`; `evState()` compares the app value (benchmark) with the evidence; `↗` link and `≠` mark on inline factors; a "Sources" block in every Why and in card boundaries; evidence column in settings; register + "to review" list in Guide › Sources.
- **Print (P10):** `#printBtn`, `#printApx`, `@media print`.
- **D1:** inline factor boxes without spinners, sized to the value.

**Next:** review the 11 corrections (Guide › Sources › "to review"; `EV_REVIEW`) with Suddha.

## 3d. Fixes of 2026-11-17 night (branch `v7-graphical-builder`)

- **D2 Print PDF:** inside claude.ai `window.print` is ignored, so the button captures the page (html2canvas 1.4.1 + jsPDF 2.5.1 from cdnjs, loaded on first click), cuts it into A4 pages where no row or tile is crossed, adds a footer and offers it through the artifact's `downloads` capability (`buildPdf()`, `downloadsNS()`). Opened as a local file (no `window.claude`), it falls back to the browser print dialog with the print CSS. Any artifact that serves this page must declare `{downloads:true}` first.
- **D3 Solace queue:** may be followed by an AEM or HTTP iFlow, APIM (Azure or BTP), Service Bus, a Logic App or a Function. The delivery mode is set by the next step in `syncChain()` (`QMODE`: APIM, Service Bus, HTTP iFlow → RDP; AEM iFlow → pull; Logic App/Function → pull unless switched to RDP via `lfMode`). The queue tile shows an RDP / PULL badge.
- **Header:** new banner (`.hero`): mark, eyebrow, title, description; Print PDF at the top right; Guide / Concepts / Settings below. Inter font from Google Fonts, cooler page background.
- Test: `tests/test_v8.py` serves html2canvas/jsPDF from `/home/claude/work/npm/node_modules` when present (the workspace can't reach cdnjs) and mocks `window.claude`.
- **Web access:** root `index.html` redirects to `app/`; `.nojekyll` added. GitHub Pages must be switched on by Suddha (Settings → Pages → branch `v7-graphical-builder`, folder `/`), then https://suddhasattaguha.github.io/volume-performance-calculator/ opens the app. Until then: https://raw.githack.com/suddhasattaguha/volume-performance-calculator/v7-graphical-builder/app/index.html. In a normal browser tab Print PDF uses the browser print dialog (Save as PDF).

## 3e. PDF report as a document (2026-11-18, branch `v7-graphical-builder`)

- **D4/P11:** "Print PDF" no longer prints or screenshots the page. `buildPdf()` writes an A4 technical report with jsPDF 2.5.1 + jspdf-autotable 3.8.2 (cdnjs, loaded on first click): cover, 1 Summary (key figures, platform verdicts, chain), 2 Inputs, 3 Estimates with formulas, 4 Scale tags, 5 Workload profile, 6 Platform checks (verdict, result, calculation, limits with confidence and evidence, source links), 7 Middleware steps + step checks + hand-offs, 8 Assumptions (run overrides, settings ≠ defaults, evidence differences), 9 Evidence register; footers with page x of y. If inputs are incomplete the report lists what is missing and gives no verdicts.
- Delivery: in claude.ai via the `downloads` capability; in a normal browser tab via a direct file download (no print dialog). The built-in PDF font is Latin-1, so `san()` writes symbols like ≤ → ≈ as <= -> ~.
- The screenshot route (html2canvas) is gone; `@media print` CSS stays for Ctrl+P.
