# Replace guessed throughput with sourced ground rules

Most of the calculator's size limits hold up. Most of its throughput and concurrency constants do not. The verified anchors are: SAP JMS at **9 GB / 30 queues / 150 transactions by default, scalable to 30 GB / 100 / 500**; the SOAP/IDoc sender guard at **40 MB**; BTP API Management at **10 MB non-streamed**; Logic Apps Standard at **100 MiB (104,857,600 B) without chunking** with stateless runs capped at **5 min**; Service Bus Premium at **100 MB over AMQP, 1 MB over HTTP and per batch**; and Solace at a **10 MB / 30 MB message cap by class**. Three throughput constants are badly off. Service Bus does roughly **6,800 msg/s per MU** in Microsoft's 1 KB queue benchmark, against the calculator's 1,000. Azure APIM's published estimate is tier-dependent: **Premium about 4,000 req/s per unit**, and nothing is published for v2. Functions parallelism is a derived product, **16 concurrent SB calls per instance × instances (max 100)**, not a flat 1,000. The "iFlow 50 parallel", "Logic App stateful 300 / stateless 1,000" and all format-overhead coefficients have no published source. They should stay labelled E and be replaced by tenant measurements. On the statistics side, Little's law, Erlang C/Kingman, fluid drain, USL and compound growth are textbook-solid (A). The traffic-shape inputs are the weakest layer: peak-hour share, peak-day factors, country weights and user-to-message coefficients. The best available anchors are telecom's **17% busy hour**, SAP's **10/120/360 dialog steps per hour** user classes, and ITU's **"4th-busiest day"** design-day rule. The calculator's biggest structural gap is that it applies a single "Fit ≤ comfort%" rule. It should instead size against a utilisation target that varies with pool size and burstiness (Kingman).

## Ten of nineteen current values need correction or re-labelling

| # | Calculator item | Current value | Recommended value | Conf. | Source |
|---|---|---|---|---|---|
| 1 | iFlow comfort size | 10 MB | Keep 10 MB, but label as design choice; tie to APIM/Solace 10 MB caps on those paths | E | No SAP figure; consistent with [KBA 3462229](https://userapps.support.sap.com/sap/support/knowledge/en/3462229) and [Solace classes](https://docs.solace.com/Cloud/service-class-limits.htm) |
| 2 | Sender guard | 40 MB | Confirmed: SOAP/IDoc sender default body 40 MB, attachments 100 MB, over-limit returns HTTP 413. HTTP "configurable to 100 MB" is C only | B (2017, re-check) | [SAP blog](https://blogs.sap.com/2017/06/29/how-to-guard-against-huge-messages/); [knowledgelib (C)](https://knowledgelib.io/business/erp-integration/sap-integration-suite/2026) |
| 3 | iFlow capacity | 50 parallel | Replace constant with **concurrent processes per channel × N worker nodes** (default N = 2, E). JMS sender default = 1 process. Cap total JMS consumers by the transaction budget (150/500) | B (formula) / E (N) | [Krimmel JMS blog](https://community.sap.com/t5/integration-blog-posts/cloud-integration-configure-asynchronous-messaging-with-retry-using-jms/ba-p/13315669) |
| 4 | JMS storage | 9 GB | Confirmed 9 GB; **add** 30 GB max, 30→100 queues, 150→500 transactions, 90-day default expiry | A (B for expiry) | [SAP Learning, CF scope](https://learning.sap.com/learning-journeys/developing-with-sap-integration-suite/understanding-system-scope-in-the-cloud-foundry-environment) |
| 5 | Service Bus throughput | 1,000 msg/s per MU | **Queue 6,800 / topic (1 sub) 5,000 / topic (5 subs) 1,600 ingress per MU**, 1 KB messages; roughly linear to 4 MU (25,000 queue); >4 MU and >1 KB unpublished, so derate | B | [MS SB Premium perf update 2024](https://techcommunity.microsoft.com/blog/messagingonazureblog/service-bus-premium-sku-performance-update/4232600) |
| 6 | Service Bus "entity 1 MB" | 1 MB | Re-label: 1 MB = **HTTP message and batch limit**; AMQP single message 100 MB; queue/topic size 80 GB; 1 TB per MU | A | [SB quotas](https://learn.microsoft.com/azure/service-bus-messaging/service-bus-quotas) |
| 7 | Service Bus max | 100 MB | Confirmed (AMQP only); flag throughput loss for >1 MB | A | [SB Premium](https://learn.microsoft.com/azure/service-bus-messaging/service-bus-premium-messaging) |
| 8 | Azure APIM | 1,000 req/s per unit | Tier lookup: Basic 1,000 / Standard 2,500 / **Premium 4,000** (Microsoft disclaims as "for information only"); v2 = no figure. Plan at 50% for policy-heavy proxies (E) | A (disclaimed) | [APIM pricing](https://azure.microsoft.com/en-us/pricing/details/api-management/) |
| 9 | Logic App comfort | 50 MB | Keep; it coincides with the 52,428,800 B chunk size | A (chunk) / E | [LA host settings](https://learn.microsoft.com/azure/logic-apps/edit-app-settings-host-settings) |
| 10 | Logic App max | 105 MB | Correct units: **100 MiB = 104,857,600 B** without chunking; 1 GB with chunking (not all connectors) | A | [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config) |
| 11 | LA stateful parallel runs | 300 | **Unsourced.** Use trigger concurrency (max 100 when on, unlimited when off, 200 waiting runs) plus throughput model of **~90 actions/s per WS3 instance** and **~100K actions/min per storage account** | A (limits) / B (actions) | [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config); [sustained benchmark](https://techcommunity.microsoft.com/blog/integrationsonazureblog/scaling-logic-apps-standard-%E2%80%93-sustained-event-processing-system/3876663) |
| 12 | LA stateless parallel | 1,000 | **Unsourced.** Same model as #11; note stateless For-each items 100, Until 100 | A / E | [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config) |
| 13 | LA stateless max run | 300 s | Confirmed (5 min) | A | [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config) |
| 14 | Function App parallel | 1,000 | **16 × cores (doc wording) × instances**, instances ≤ 100 Windows / 20–100 Linux by region; validate core multiplier | A (E for multiplier) | [Functions SB bindings](https://learn.microsoft.com/azure/azure-functions/functions-bindings-service-bus); [Premium plan](https://learn.microsoft.com/azure/azure-functions/functions-premium-plan) |
| 15 | Solace comfort / cap | 10 MB / 30 MB | Make class-dependent: **10 MB on E100/E250 (and older E1K), 30 MB on E1K (later versions) and above** | A | [Solace service classes](https://docs.solace.com/Cloud/service-class-limits.htm) |
| 16 | Solace spool | 50 GB | 50 GB is the **E250** default only; use class table (25 / 50 / 200 / 400 / 600 / 800 / 1,000 GB), increasable | A | [Solace service classes](https://docs.solace.com/Cloud/service-class-limits.htm) |
| 17 | Country weights | ×3 / ×1 / ×0.3 | Keep as fallback only (E); prefer a volume driver (users, orders, revenue) per country | E | No source found |
| 18 | Fit rule | ≤ comfort % of capacity | Replace with ρ_target by pool size (60–70% for c ≤ 4; 70–80% for 5–20; 85–90% for >50), lowered for bursty arrivals via Kingman | A (theory) / C (bands) | [Technion QED](https://serveng.technion.ac.il/files/Lectures/QED_lecture_Erlang_B_C.pdf); [Kingman](https://en.wikipedia.org/wiki/Kingman%27s_formula) |
| 19 | Format overhead (JSON 30 B/field, XML 2×name+value+5, IDoc 1,063 + 524, base64 ×1.37) | as listed | base64 ×1.37 confirmed by arithmetic (4/3 × 78/76 = 1.368, MIME lines); IDoc segment payload ≤ 1,000 B is C; 1,063/524 widely cited but unverified; JSON/XML coefficients unsourced | A (b64) / C / E | [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648); [HCL IDoc format](https://help.hcl-software.com/devops/test/hub/10.1/docs/topics/c_pack_sapr3_IDoc_Structural_Format.html) |

Little's law (in-process = λ × S), the time-zone offsets and the drain formula are confirmed. They are covered in the formula section below.

## SAP BTP publishes limits, not throughput

SAP publishes **no worker-node count, thread count or msg/s benchmark** for Cloud Integration on Cloud Foundry. Node count varies by tenant and must be read from the runtime-nodes view ([KBA 3573749](https://userapps.support.sap.com/sap/support/knowledge/en/3573749)). That makes every "iFlow parallel" constant a tenant parameter. Parallelism for JMS/AEM senders multiplies across worker nodes ([Krimmel](https://community.sap.com/t5/integration-blog-posts/cloud-integration-configure-asynchronous-messaging-with-retry-using-jms/ba-p/13315669)).

| Component | Ground rule | Conf. | Source |
|---|---|---|---|
| CI tenant resources | Content 500 MB; MPL 35 GB; runtime DB 35 GB; disk 4 GB | A | [SAP Learning](https://learning.sap.com/learning-journeys/developing-with-sap-integration-suite/understanding-system-scope-in-the-cloud-foundry-environment) |
| CI sender size | SOAP/IDoc: body 40 MB, attachments 100 MB, 0 = unlimited, over-limit returns 413 | B | [SAP blog](https://blogs.sap.com/2017/06/29/how-to-guard-against-huge-messages/) |
| CI parallelism | effective = concurrent processes × N workers; JMS sender default 1; retry 1 min to 60 min max, exponential | B | [Krimmel](https://community.sap.com/t5/integration-blog-posts/cloud-integration-configure-asynchronous-messaging-with-retry-using-jms/ba-p/13315669) |
| JMS | 30/100 queues, 9/30 GB, 150/500 transactions; budget Σ(processes × N) + producers ≤ 150 (counting rule is an inference) | A / E | [SAP Learning](https://learning.sap.com/learning-journeys/developing-with-sap-integration-suite/understanding-system-scope-in-the-cloud-foundry-environment) |
| JMS message size | Old "10 MB, 4 GB, 9 queues" figures are Neo/early CF and **outdated**; current per-message cap unverified | C | [knowledgelib](https://knowledgelib.io/business/erp-integration/sap-integration-suite/2026) |
| AEM sender | SMF consumer on a dedicated queue; consumers = parallel consumers × N; exclusive queue means one active flow | A (adapter) / E | [SAP tutorial](https://developers.sap.com/tutorials/aem-integrate-cloud-integration-iflow.html) |
| Cloud Connector | RFC timeout 30 s default | C | [knowledgelib](https://knowledgelib.io/business/erp-integration/sap-integration-suite/2026) |
| Metering (cost only) | 1 billable message = 250 KB slice | C | [knowledgelib](https://knowledgelib.io/business/erp-integration/sap-integration-suite/2026) |
| BTP APIM | 10 MB non-streamed (`TooBigBody`); streaming off by default; rate limits are customer policies (Spike Arrest/Quota) | A | [KBA 3462229](https://userapps.support.sap.com/sap/support/knowledge/en/3462229) |

**Solace / AEM service classes** have no msg/s figures on the class page, so throughput must be measured. Internal features (DMR, DR, bridges) consume connections ([Solace](https://docs.solace.com/Cloud/service-class-limits.htm)):

| Class | Conns | Spool | Max msg | Queues | Transacted sessions / txns | REST out / RDPs |
|---|---|---|---|---|---|---|
| E100 | 100 | 25 GB | 10 MB | 100 | 100 / 500 | 1,000 / 200 |
| E250 | 250 | 50 GB | 10 MB | 250 | 500 / 2,500 | 1,000 / 200 |
| E1K | 1,000 | 200 GB | 10 MB (30 MB later) | 1,000 | 1,000 / 5,000 | 1,000 / 200 |
| E5K | 5,000 | 400 GB | 30 MB | 5,000 | 5,000 / 25,000 | 7,500 / 500 |
| E10K | 10,000 | 600 GB | 30 MB | 10,000 | 10,000 / 50,000 | 7,500 / 500 |
| E50K | 50,000 (30K SMF/AMQP) | 800 GB | 30 MB | 50,000 | 10,000 / 50,000 | 22,500 / 1,500 |
| E100K | 100,000 (30K SMF/AMQP) | 1,000 GB | 30 MB | 100,000 | 10,000 / 50,000 | 22,500 / 1,500 |

For RDP webhook delivery into CI, the ceiling is **REST outgoing connections ÷ iFlow latency**, because RDP waits for each HTTP response per connection (E, standard Solace behaviour, not verified). The end-to-end max message size = min(CI adapter limit, broker class limit).

## Azure exposes scale ceilings and blog benchmarks

| Component | Ground rule | Conf. | Source |
|---|---|---|---|
| **LA Standard compute** | WS1 1 vCPU/3.5 GB, WS2 2/7, WS3 4/14; MS recommends ≥ WS2 | A / B | [LA pricing](https://learn.microsoft.com/azure/logic-apps/logic-apps-pricing); [perf tips](https://techcommunity.microsoft.com/blog/integrationsonazureblog/logic-apps-standard-hosting--performance-tips/3956971) |
| LA scale | 20–100 instances by region; decision every 15–30 s; 1→100 ramp **25–50 min**, so use prewarmed instances for bursts; ASE v3 has no dynamic scaling | A | [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config) |
| LA throughput | Storage: 20K req/s per account, **~100K actions/min per account**, ≤ 32 accounts (set before creation). Benchmark: 250K actions/min on ~45 WS3, so **~90 actions/s per WS3**; burst 1M messages in 102 min | A / B | [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config); [benchmark](https://techcommunity.microsoft.com/t5/azure-integration-services-blog/logic-apps-standard-target-based-scaling-performance-benchmark/ba-p/3998807) |
| LA concurrency | Trigger concurrency on: max 100 (irreversible); waiting runs 200; SplitOn only 100 items when concurrency on; For-each 20 default / 50 max; 192 dispatcher workers per core | A | [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config); [host settings](https://learn.microsoft.com/azure/logic-apps/edit-app-settings-host-settings) |
| LA timeouts | HTTP 225 s; stateless run 5 min; stateful 90 days | A | [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config) |
| LA via APIM | Hard throttle **56 calls / 5 min** when invoking a Request trigger through the APIM REST API; use the callback URL | A | [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config) |
| **Functions Premium** | EP1/2/3 = 1/2/4 cores; SB maxConcurrentCalls 16, sessions 8, batch 1,000, prefetch 0; timeout 30 min default / unbounded; **HTTP 230 s** | A | [SB bindings](https://learn.microsoft.com/azure/azure-functions/functions-bindings-service-bus); [scale](https://learn.microsoft.com/azure/azure-functions/functions-scale) |
| **Service Bus Premium** | MU 1/2/4/8/16; scale up at CPU > 75%; 5,000 AMQP connections; 1,000 entities per MU; 100 messages per transaction; no fixed ops/s | A | [SB quotas](https://learn.microsoft.com/azure/service-bus-messaging/service-bus-quotas) |
| **APIM** | Buffered payload **500 MiB classic / 2 MiB v2**; request payload unlimited / 1 GiB; 2,048 backend connections per unit; Premium ≤ 12 units/region, Premium v2 ≤ 30 | A | [APIM limits](https://learn.microsoft.com/azure/azure-resource-manager/management/azure-subscription-service-limits#api-management-limits); [v2 tiers](https://learn.microsoft.com/azure/api-management/v2-service-tiers-overview) |
| **ADF** | 10,000 concurrent runs per factory; 100 queued per pipeline; ForEach 20/50; DIU 4–256; activity payload 896 KB; SHIR ≤ 4 nodes; batch only | A | [ADF limits](https://learn.microsoft.com/azure/azure-resource-manager/management/azure-subscription-service-limits#data-factory-limits) |
| **Event Grid** | Basic topics 5,000 events/s or 5 MB/s, 1 MB events, 64 KB metering chunks; Namespaces 1,000 ev/s or 1 MB/s per TU, ≤ 40 TU | A | [Event Grid limits](https://learn.microsoft.com/azure/event-grid/quotas-limits) |

Design flags for the builder: APIM v2 with body-reading policies effectively caps payloads at 2 MiB, which pushes them to claim-check. Event Grid should carry signals, not payloads. ADF should never sit on a per-message path.

## Formulas: queueing math is solid, traffic shape is not

### Load conversion (B)

| Step | Formula / value | Conf. | Source |
|---|---|---|---|
| Monthly to daily | ÷ 21 working days (office) or ÷ 30.4 (24×7); SAP regional defaults 200 (EU) / 250 (Americas) / 300 (APJ) days per year | B / E | [IBM-SAP sizing](https://public.dhe.ibm.com/software/mktsupport/techdocs/erp_sap_user_based.pdf) |
| Design day | Use the **4th-busiest day** of the month (ITU-T E.492), not the absolute maximum | A via B | [Cisco TA](https://www.cisco.com/c/en/us/td/docs/ios/solutions_docs/voip_solutions/TA_ISD.html) |
| Peak-day factor | Empirical: Cyber Monday ≈ **3.4×** average season day; Prime Day **1.4–1.6×** baseline. Month-end 2–3× and similar values are unverified practice | E | [Adobe](https://news.adobe.com/news/2025/12/adobe-cyber-monday-hits-record); [Celigo](https://www.celigo.com/blog/prime-day-2026-peak-season/) |
| Peak-hour share | Office/human-driven **17%** (15–20%), floor 1/8 = 12.5%; 24 h consumer events ≈ 5–10% (Cyber Monday 6.7%); batch = 1 / window hours | B / E | [Cisco TA](https://www.cisco.com/c/en/us/td/docs/ios/solutions_docs/voip_solutions/TA_ISD.html); [Adobe](https://news.adobe.com/news/2025/12/adobe-cyber-monday-hits-record) |
| Diurnal shape | Two business humps, 10–11 and 14–15 local; SAP peak window 08–18 | B | [Cisco TA](https://www.cisco.com/c/en/us/td/docs/ios/solutions_docs/voip_solutions/TA_ISD.html); [IBM-SAP](https://public.dhe.ibm.com/software/mktsupport/techdocs/erp_sap_user_based.pdf) |

### Global aggregation (A method, E values)

Shift each region's hourly profile by its UTC offset, sum per UTC hour, and take the max. The **coincidence factor CF = global peak ÷ Σ regional peaks = 1/diversity factor** ([Diversity factor](https://en.wikipedia.org/wiki/Diversity_factor)). The calculator's shifted-curve method (−5 / +1 / +8) is correct. Its outputs are worked values, not published ones. Three equal regions give a global peak of about 4–5% of daily volume (CF ≈ 0.33–0.4). A skewed estate (60/30/10) gives about 9–12% (CF ≈ 0.6–0.8). **Centrally scheduled jobs must be added with CF = 1**, because they break diversity.

### User-to-volume (B inputs, E coefficients)

SAP user classes are **Low 10, Medium 120, High 360 dialog steps/h** on a 40-hour week, and sizing is by concurrent users ([IBM-SAP](https://public.dhe.ibm.com/software/mktsupport/techdocs/erp_sap_user_based.pdf)). Quick Sizer is ±20% and **excludes interfaces** ([SAP white paper](https://blogs.sap.com/2023/05/11/white-paper-sap-sizing-solution-based-on-users-and-workloads-part-1/)). The working formula is msgs/h ≈ concurrent users × DS/h ÷ DS per document (5–15, E) × fan-out (3–6, E). Expect ±50% accuracy.

### Queueing, burstiness, chains, growth

| Model | Formula | Conf. | Source |
|---|---|---|---|
| Little's law | L = λW. In-process = λ × S; **consumers c = ⌈λS / (k·ρ_target)⌉** (k = messages per consumer). Use p95 S for a conservative sizing | A | [Little 2011](https://people.cs.umass.edu/~emery/classes/cmpsci691st/readings/OS/Littles-Law-50-Years-Later.pdf) |
| Erlang C | P(wait) = (Rⁿ/n!)(1/(1−ρ))π₀, R = λ/μ; W_q = C/(cμ − λ); square-root staffing n ≈ R + β√R | A | [Technion QED](https://serveng.technion.ac.il/files/Lectures/QED_lecture_Erlang_B_C.pdf) |
| Kingman / G/G/c | W_q ≈ ((c_a²+c_s²)/2) × ρ/(1−ρ) × S; G/G/c ≈ Erlang-C wait × V. Poisson V = 1; fixed service V = 0.5; batch releases V ≫ 1. ρ 80→90% more than doubles wait | A | [Kingman](https://en.wikipedia.org/wiki/Kingman%27s_formula); [Fabrico](https://www.fabrico.io/blog/kingman-formula-queue/) |
| Burst (minute) | Poisson p99.9 minute ≈ λ + 3.1√λ (1.1× at 1,000/min, 2.1× at 10/min); model batch releases as a deterministic N | A math / E use | derived |
| Backlog / drain | B_peak = max(0, (λ_p − μ)·T_p); **T_drain = B/(μ − λ)**, only if μ > λ; oldest-message age ≈ B/μ (check against TTL/expiry); μ needed ≥ λ + B/D; spool = B × size × 1.5–2 | B (pattern) / derived | [Azure load leveling](https://learn.microsoft.com/azure/architecture/patterns/queue-based-load-leveling) |
| Chains | X = min_i(μ_i·c_i / f_i); W_e2e = Σ(S_i + W_q,i); retry factor (1 − p^(r+1))/(1 − p); stacked layers up to (r+1)^L, so retry at one layer only | A / B | [Little 2011](https://people.cs.umass.edu/~emery/classes/cmpsci691st/readings/OS/Littles-Law-50-Years-Later.pdf); [AWS REL05](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_limit_retries.md) |
| USL | C(N) = N/(1 + σ(N−1) + κN(N−1)); peak N* = √((1−σ)/κ); fit σ, κ from 4–6 load points; cap consumers at min(N*, downstream limit, partitions/sessions) | A | [Gunther](https://ar5iv.arxiv.org/html/0808.1431) |
| Growth | Capacity = λ_peak × (1+g)^H / ρ_target; headroom years H = ln(Cap·ρ/λ)/ln(1+g); horizon 1–2 years | A / B | [Confluent](https://www.confluent.io/blog/how-choose-number-topics-partitions-kafka-cluster/) |

One guard against double counting: if the peak-hour share is already measured from minute data, do not also inflate V for the same burstiness (derived; no source opened states this).

## Values to measure on the tenant

| Measure | Why |
|---|---|
| CI worker-node count (KBA 3573749) and threads per worker | Multiplier for all CI parallelism; not published |
| CI msg/s and S (p50/p95) for reference iFlows (pass-through, mapping, IDoc) | No SAP benchmark exists |
| JMS current per-message size cap and transaction consumption per consumer per node | Old 10 MB value is unverified; budget formula is inferred |
| AEM sender parallel-consumer default/max; Kafka/AMQP sender consumer ranges | Not reached on help.sap.com |
| Solace msg/s and MB/s per class; max consumers per queue | Not on class page |
| BTP APIM TPS and max streamed size | Not published |
| HTTP sender max body and CPI→backend timeout | Unverified |
| Service Bus throughput at > 1 KB, > 4 MU, and for topics with real filters | Benchmark covers 1 KB, ≤ 4 MU only |
| Azure APIM v2 req/s per unit; Premium under your policy set | v2 unpublished; Premium figure disclaimed |
| LA actions/s per WS1/WS2/WS3 for your workflow mix; SB trigger concurrency | Only blog-derived ~90 actions/s per WS3 |
| Functions effective SB concurrency per EP size (16 vs 16 × cores) | Docs contradict each other |
| USL σ, κ per platform; peak-hour share and V from real minute-level logs | Drive ρ_target and consumer caps |
| IDoc flat/XML size per message type; JSON/XML bytes per field | Overhead coefficients unsourced |

## Conclusion

The calculator's skeleton is right: shifted diurnal curves, Little's law, drain time and fit-to-capacity are all defensible. Its weak points sit in two specific places. The first is vendor throughput constants that were guessed low by 4–7× (Service Bus, Azure APIM Premium). The second is concurrency constants that have no published source at all (iFlow 50, Logic App 300/1,000, Function 1,000). The design builder should treat SAP components as **limit-bounded and tenant-measured**, because SAP publishes ceilings but no rates. It should treat Azure components as **formula-derived**: parallelism = per-instance setting × instance cap, throughput = MU or unit × benchmark, both derated.

The highest-leverage change is replacing the single "Fit ≤ comfort%" rule with ρ_target bands and a Kingman variability multiplier. That one change makes batch-released IDoc floods and small consumer pools visibly riskier than smooth, high-volume event streams, which matches how these platforms actually fail.
