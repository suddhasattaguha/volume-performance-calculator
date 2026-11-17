# CLAUDE.md — handover for the Volume & Performance Calculator

Owner: **Suddha**, an integration solution architect working on SAP BTP / hybrid iPaaS, with S/4HANA RISE Private Cloud. This repo belongs to the claude.ai Project "Integration Design for Performance and Volume".
Handover written 2026-11-17, after v6 was published.

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

**Publish:** claude.ai artifact slug `efc5f6ae-ebb6-4b23-8f72-ef60982cb926` (https://claude.ai/artifact/WcH5iqktGPe5LvMJroy1xq). Use `publish_files` with files `index.html` ← `app/index.html` and `concepts.html` ← `app/concepts.html`, plus `slug` and `base_version`. The latest version is `1794947862-03b5`; call `get_artifact` first to confirm it.

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

localStorage keys: `vpc5_in`, `vpc_set`, `vpc_curves`.

## 3. Current state (v6)

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

## 4. NEXT BUILD (approved plan; start when Suddha says "build")

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

### 4d. Still open (ask or measure; don't invent)
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
