# Azure Integration Services: capacity ground rules (provisioned/premium tiers) for an async interface capacity calculator

Research date: 2026-11-17. Confidence codes: **A** = official Microsoft Learn doc / pricing page, **B** = Microsoft Tech Community blog (Microsoft authors), **C** = community, **E** = empirical. Most official values come from the MicrosoftDocs/azure-docs GitHub sources (the same text as learn.microsoft.com), read on the research date. Learn URLs are given for citation.

Primary sources opened:
- Logic Apps limits: https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config (ms.date 10/30/2026)
- Logic Apps host settings: https://learn.microsoft.com/azure/logic-apps/edit-app-settings-host-settings
- Logic Apps pricing/plans: https://learn.microsoft.com/azure/logic-apps/logic-apps-pricing
- Functions SB bindings: https://learn.microsoft.com/azure/azure-functions/functions-bindings-service-bus
- Functions Premium plan: https://learn.microsoft.com/azure/azure-functions/functions-premium-plan
- Functions scale/hosting: https://learn.microsoft.com/azure/azure-functions/functions-scale
- Functions concurrency: https://learn.microsoft.com/azure/azure-functions/functions-concurrency
- Functions target-based scaling: https://learn.microsoft.com/azure/azure-functions/functions-target-based-scaling
- Service Bus quotas: https://learn.microsoft.com/azure/service-bus-messaging/service-bus-quotas
- Service Bus Premium: https://learn.microsoft.com/azure/service-bus-messaging/service-bus-premium-messaging
- APIM limits: https://learn.microsoft.com/azure/azure-resource-manager/management/azure-subscription-service-limits#api-management-limits (includes gateway runtime limits)
- APIM capacity: https://learn.microsoft.com/azure/api-management/api-management-capacity
- APIM v2 tiers: https://learn.microsoft.com/azure/api-management/v2-service-tiers-overview
- APIM pricing: https://azure.microsoft.com/en-us/pricing/details/api-management/
- ADF limits: https://learn.microsoft.com/azure/azure-resource-manager/management/azure-subscription-service-limits#data-factory-limits
- ADF copy performance: https://learn.microsoft.com/azure/data-factory/copy-activity-performance-features
- ADF SHIR: https://learn.microsoft.com/azure/data-factory/create-self-hosted-integration-runtime
- Event Grid limits: https://learn.microsoft.com/azure/event-grid/quotas-limits
- Blogs (B): SB Premium perf update (2024), Logic Apps Standard burst benchmark (2022), sustained event processing (2023), target-based scaling benchmark (2024), hosting and performance tips (2023, updated 2025), SB concurrency with LA Standard (2023). URLs are inline below.

---

## Logic Apps Standard (WS1/WS2/WS3, ASE v3)

### Takeaway
Microsoft publishes compute sizes, a scale-out ceiling (20 to 100 instances depending on region), and many per-run limits. It publishes **no per-WS-size throughput figure**. The only quantitative throughput anchors are B-grade Microsoft blog benchmarks: about 250K actions/min sustained on WS3 with about 45 instances, and about 350K actions/min peak in a 1M-message burst. Storage is the explicit throughput governor: plan for about 100K action executions per minute per storage account, with up to 32 storage accounts.

### Cited Findings
**Compute and scale (A)**
- WS1 = 1 vCPU / 3.5 GB, WS2 = 2 vCPU / 7 GB, WS3 = 4 vCPU / 14 GB. Example list rates are $175.16, $350.33 and $700.65 per month — [Logic Apps pricing](https://learn.microsoft.com/azure/logic-apps/logic-apps-pricing)
- The scaler uses trigger signals (for example, Service Bus queue length growth, or rising Request trigger latency) and workflow job execution delay. It makes decisions every about 15–30 s. "Scaling from 1 to 100 worker instances, the ramp-up alone might take 25–50 minutes." Recommended mitigations: split the workload across multiple logic apps (each scales independently) and use prewarmed instances — [LA limits, Compute](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config)
- ASE v3: "dynamic scaling isn't available". You set App Service Plan autoscale rules. A common rule keeps vCPU at 50–70% — [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config)
- WS max scale-out is "20 instances in some regions, and up to 100 in others". Isolated v2 (ASE v3) allows 100 instances per plan and 200 overall, and up to 64 cores / 256 GB per instance. Microsoft recommends WS2 (or I1v2) as the minimum ("start with at least 2 cores") — [B: Logic Apps Standard Hosting & Performance Tips (Oct 2023, updated Apr 2025)](https://techcommunity.microsoft.com/blog/integrationsonazureblog/logic-apps-standard-hosting--performance-tips/3956971)
- Logic Apps Standard scaling "shares the same Azure Functions scaling infrastructure" — [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config). Functions Premium regional max is Windows 100 in most regions and Linux 20–100 (for example, West Europe 100/100, Germany West Central 100/20) — [Functions Premium plan](https://learn.microsoft.com/azure/azure-functions/functions-premium-plan)

**Storage-bound throughput (A)**
- A single storage account handles up to 2,000 requests/s per partition and 20,000 requests/s per account. Beyond that, throttling applies. "Up to 32 storage accounts". "Aim for ~100,000 action executions per minute, per storage account" (lower for compute-heavy actions). This must be configured **before** you create the app, or you risk data loss — [LA limits, Storage](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config)
- Single-tenant has **no** action-execution or content-throughput limit per 5 min ("None"). In multitenant (Consumption) the limits are 100K executions per 5 min (300K in high-throughput mode) and 6 GB per 5 min (12 GB) — [LA limits, Throughput](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config)
- Concurrency dispatch: `Jobs.BackgroundJobs.NumWorkersPerProcessorCount` = 192 dispatcher workers per core (stateful). `StatelessNumWorkersPerProcessorCount` = 192. Dispatchers poll every 1 s when the queue is empty — [LA host settings](https://learn.microsoft.com/azure/logic-apps/edit-app-settings-host-settings)

**Stateful vs stateless (A)**
| Limit | Stateful | Stateless |
|---|---|---|
| Run duration | 90 days (default; tied to retention setting) | 5 min |
| Run history retention | 90 days default | n/a (in-memory) |
| For each array items | 100,000 | 100 |
| For each concurrency | default 20, max 50 | default 20, max 50 |
| Until iterations / timeout | max 5,000 / PT1H | max 100 / PT5M |
| Variable max size | 104,857,600 chars | 1,024 chars |
| Execution mode | sync/async | synchronous only |
— [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config)

**Message size, timeouts, triggers (A)**
- Message size without chunking: 100 MB. With chunking: 1 GB per action. Content chunk size: 52,428,800 bytes (52 MB). `Runtime.ContentLink.MaximumContentSizeInBytes` = 104,857,600. Some connectors do not support chunking. AS2 v2 is 100 MB (v1 25 MB) — [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config); [host settings](https://learn.microsoft.com/azure/logic-apps/edit-app-settings-host-settings)
- Outbound/inbound HTTP request timeout (single-tenant): 225 s (multitenant 120 s). A synchronous Response action must finish within this limit — [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config)
- Trigger concurrency: off = unlimited. On (irreversible) = default 100, min 1, max 100 (Standard). Consumption default is 25. Waiting runs: max 200 (Standard, `Runtime.Trigger.MaximumWaitingRuns` = 200) versus 100 (Consumption) — [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config)
- SplitOn/debatch: 100,000 items with concurrency off. Only **100 items** with trigger concurrency on — [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config)
- Runtime endpoint: about 1,000 concurrent inbound calls and about 2,500 concurrent outbound calls (the table lists these under multitenant; single-tenant is "None") — [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config)
- Hard throttle of **56 calls per 5 min** when you call a Standard Request trigger through the API Management REST API (use the callback URL instead) — [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config)
- Managed connector throttling: "varies based on connector" (see each connector reference). Custom connectors: 500 requests/min per connection (multitenant) — [LA limits](https://learn.microsoft.com/azure/logic-apps/logic-apps-limits-and-config)

**Built-in Service Bus (A/B)**
- Host settings: `ServiceProviders.ServiceBus.MessageSenderOperationTimeout` = 1 min and `MessageSenderPoolSizePerProcessorCount` = 64 senders per core. Microsoft warns that SB trigger batching "might hold onto messages beyond the lock duration" — [LA host settings](https://learn.microsoft.com/azure/logic-apps/edit-app-settings-host-settings)
- Batch tuning uses `extensions.serviceBus.maxMessageBatchSize` / `minMessageBatchSize` in host.json (example 10/5). Stateless SB flows without sessions were processed by one worker. With sessions, they run in parallel across sessions — [B: Optimizing SB message processing concurrency using LA Standard (Dec 2023)](https://techcommunity.microsoft.com/t5/azure-integration-services-blog/optimizing-service-bus-message-processing-concurrency-using/ba-p/4003303)
- "The concurrency setting for the Service Bus trigger is not fully supported" (at time of writing). Prefetch: start equal to batch size — [B: Hosting & Performance Tips](https://techcommunity.microsoft.com/blog/integrationsonazureblog/logic-apps-standard-hosting--performance-tips/3956971)

**Benchmarks (B)**
- Sustained run on WS3: 20 prewarmed instances, scaled to about 45 average (peak 52), 4 storage accounts, Event Hubs trigger (batch 100), 23 actions/run. Results: **10K events/min for 8 h (about 167/s), 250K actions/min sustained (about 4.2K/s)**, about 400K jobs/min, p95 execution delay under 170 ms. Throttled variant (1 parent + 10 child workflows): 12–15K runs/min. The article has internal inconsistencies (150K vs 200–250K actions/min; totals do not match) — [B: Scaling Logic Apps Standard – Sustained Event Processing (Jul 2023)](https://techcommunity.microsoft.com/blog/integrationsonazureblog/scaling-logic-apps-standard-%E2%80%93-sustained-event-processing-system/3876663)
- 1M-message burst (HTTP SplitOn dispatcher calling a stateless enricher, max burst 100): reached about 350K actions/min and about 500K executions/min. 1M messages processed in 102 min (target-based scaling) versus 132 min (incremental). Plan not stated — [B: Target-based scaling benchmark (Jan 2024)](https://techcommunity.microsoft.com/t5/azure-integration-services-blog/logic-apps-standard-target-based-scaling-performance-benchmark/ba-p/3998807)
- Burst of 40K/100K messages (2 + 27 actions per message). Instance usage, average/peak: WS1 13.3/20 and 18.6/27, WS2 8.5/10 and 12.4/18, WS3 5/7 and 7.5/13. Throughput scales "proportionally" with plan size. Default scaling targets CPU 60–90% — [B: Burst workloads benchmark (May 2022)](https://techcommunity.microsoft.com/blog/integrationsonazureblog/logic-apps-standard-performance-benchmark---burst-workloads/3317930)

### Inferences
- Calculator rule of thumb (B, derived): about 250K actions/min ÷ about 45 WS3 instances ≈ **5–6K actions/min per WS3 instance (about 90 actions/s per instance, about 22 per vCPU)** for a moderate mixed workflow. The burst benchmark's instance ratio (WS1 ≈ 2.5× WS3 instances) supports roughly linear per-vCPU scaling. Treat as order-of-magnitude only.
- Storage ceiling: about 100K actions/min per storage account is the more binding constraint above about 15–20 WS3 instances unless you shard storage.
- Use stateless + chunking-free paths only for payloads under 100 MB and runs under 5 min. Above that, use stateful + chunking or claim-check.
- Ramp-up of 15–30 s per scaling step argues for prewarmed/minimum instances in the calculator for burst profiles.

### Gaps
- No official runs/min or actions/min per WS1/WS2/WS3 (Microsoft states there is "no one-size-fits-all").
- The official default and maximum for the built-in SB trigger's concurrent calls were not found. The 2023 blog says concurrency was "not fully supported" (may be outdated).
- The exact max burst for the Workflow Standard plan was not confirmed on a Learn page (only via the blog and the Functions Premium regional table).

---

## Azure Functions Premium (EP1/EP2/EP3) and Dedicated

### Takeaway
SB trigger default concurrency is **16 concurrent calls per instance (extension v5 doc says multiplied by cores)**, 8 sessions, batch 1000, prefetch 0. Premium scales to 100 instances (Windows; Linux 20–100 by region). The timeout defaults to 30 min and can be unbounded, but HTTP responses are capped at 230 s.

### Cited Findings
- EP1 1 core / 3.5 GB, EP2 2 cores / 7 GB, EP3 4 cores / 14 GB (250 GB storage) — [A: Premium plan](https://learn.microsoft.com/azure/azure-functions/functions-premium-plan)
- Max instances: Premium Windows 100, Linux 20–100 (region-dependent). Dedicated 10–30, 100 on ASE — [A: Functions scale](https://learn.microsoft.com/azure/azure-functions/functions-scale). Regional table, for example West Europe 100/100, North Europe 100/100, Germany West Central 100/20, East US 2 80/100 — [A: Premium plan](https://learn.microsoft.com/azure/azure-functions/functions-premium-plan)
- Timeout: Premium and Dedicated default 30 min, max unbounded. The grace period is 60 min on scale-in and 10 min on platform updates. Dedicated requires Always On. **HTTP-triggered functions must respond within 230 s** (Azure Load Balancer idle timeout) — [A: Functions scale](https://learn.microsoft.com/azure/azure-functions/functions-scale)
- SB host.json (extension 5.x) defaults: `prefetchCount` 0, `maxConcurrentCalls` 16, `maxConcurrentSessions` 8, `maxMessageBatchSize` 1000, `minMessageBatchSize` 1, `maxAutoLockRenewalDuration` 00:05:00. On `maxConcurrentCalls`: "When your hosting plan has more than one core per instance, the maximum number of calls is effectively multiplied by the number of cores… two cores… 32". Extension 4.x and earlier: maxConcurrentCalls 16, maxConcurrentSessions 2000 — [A: Functions SB bindings](https://learn.microsoft.com/azure/azure-functions/functions-bindings-service-bus)
- Target-based scaling: desired instances = event source length ÷ target executions per instance. SB targets are maxConcurrentCalls (16), maxConcurrentSessions (8), or maxMessageBatchSize (1000). Requires SB extension 5.9.0 or later — [A: Target-based scaling](https://learn.microsoft.com/azure/azure-functions/functions-target-based-scaling)
- Dynamic concurrency (Blob, Queue, Service Bus triggers only) is off by default. Concurrency starts at 1 per function and the host adjusts it. Learned values persist via `snapshotPersistenceEnabled` — [A: Functions concurrency](https://learn.microsoft.com/azure/azure-functions/functions-concurrency)
- HTTP trigger concurrency defaults depend on instance memory size (the table is in the Flex Consumption context). Python defaults to 1 — [A: Functions concurrency](https://learn.microsoft.com/azure/azure-functions/functions-concurrency)
- VNet integration needs a subnet with at least 100 free addresses — [A: Premium plan](https://learn.microsoft.com/azure/azure-functions/functions-premium-plan)

### Inferences
- Calculator default: per-instance SB parallelism = 16 × cores (EP1 16, EP2 32, EP3 64) if you take the doc's core-multiplication statement at face value. Plan max parallelism = that × instance cap (100). Per-message processing time then gives msgs/s = parallelism ÷ latency.
- Note the doc's target-based-scaling table uses 16 per instance without core multiplication. Validate empirically (E).

### Gaps
- Microsoft publishes no per-EP throughput benchmark.
- The core-multiplication wording may be legacy (carried from v4 docs). Empirical confirmation is recommended.

---

## Azure Service Bus Premium

### Takeaway
Capacity is in messaging units (MU: 1, 2, 4, 8, 16). There is no official ops/s limit on Premium. Microsoft's 2024 benchmark (1 KB messages, AMQP batched) gives **about 6.8K msgs/s per MU on a queue (send and receive), scaling to about 25K msgs/s at 4 MU**. Messages can be up to 100 MB over AMQP (1 MB over HTTP and per batch).

### Cited Findings
- MUs: "1, 2, 4, 8 or 16 messaging units" per namespace, dynamically adjustable. Scale up when CPU is above 75% or memory above 60%. Scale down when CPU is below 25%. Billing is hourly at the highest MU count — [A: SB Premium](https://learn.microsoft.com/azure/service-bus-messaging/service-bus-premium-messaging)
- Quotas (A) — [SB quotas](https://learn.microsoft.com/azure/service-bus-messaging/service-bus-quotas):
  - Queue/topic size: 80 GB (Premium). Namespace size: 1 TB per MU
  - Entities: 1,000 per MU, up to 16,000 per namespace
  - Premium namespace partitions: 1, 2 or 4, set at creation. MU count must be a multiple of the partition count
  - Message size: **AMQP up to 100 MB single message. HTTP up to 1 MB. Batch up to 1 MB (all protocols)**. Standard/Basic: 256 KB
  - Concurrent AMQP connections per namespace: 5,000. Concurrent receive requests per entity: 5,000
  - Subscriptions per topic: 2,000. SQL filters per topic: 2,000. Correlation filters: 100,000
  - Messages per transaction: 100. Properties: 32 KB each, 64 KB header total
  - Operations/s: Basic/Standard 1,000. "Premium doesn't have fixed limitations"; throughput depends on MUs and workload
- Large messages "result in decreased throughput and increased latency". Use AMQP for messages over 1 MB. Max message size is set per entity — [A: SB Premium](https://learn.microsoft.com/azure/service-bus-messaging/service-bus-premium-messaging)
- Benchmark, 1 KB, AMQP batched, D48 clients, 2024 (msgs/s), from [B: Service Bus Premium SKU Performance Update (Aug 2024)](https://techcommunity.microsoft.com/blog/messagingonazureblog/service-bus-premium-sku-performance-update/4232600). The tables were read via a mirror, https://thewindowsupdate.com/2024/09/03/service-bus-premium-sku-performance-update/, because the original body did not render.
  | Entity | 1 MU | 2 MU | 4 MU |
  |---|---|---|---|
  | Queue send/receive | 6,790 | 12,770 | 25,000 |
  | Topic, 1 sub send/receive | 5,000 | 10,300 | 13,200 |
  | Topic, 5 subs send | 1,600 | 3,100 | 4,400 |
  | Topic, 5 subs receive (total) | 8,000 | 15,300 | 22,000 |
  2016 values were about 50% lower (for example, queue 4,401 / 9,070 / 16,782) — superseded.

### Inferences
- Calculator: about 6–7K msgs/s per MU for 1 KB queue traffic, roughly linear to 4 MU. That is about 6.8 MB/s per MU at 1 KB; payload MB/s scaling for bigger messages is undocumented. Fan-out topics reduce ingress sharply (about 1.6K msgs/s per MU with 5 subs).
- With 1 MB batch caps, batching only helps small messages.

### Gaps
- No official or B-grade figures for 8/16 MU, MB/s throughput, or large-message (over 1 MB) throughput.
- No per-MU connection quota. The 5,000 AMQP connections figure is in the common-limits table.

---

## Azure API Management (classic Premium, v2 tiers)

### Takeaway
The only throughput figures are pricing-page estimates "for information only": **Premium about 4,000 req/s per unit**, Standard about 2,500, Basic about 1,000, Developer about 500. No figures are published for v2. The key payload difference: classic buffers up to 500 MiB, **v2 only 2 MiB**; request payload limits are unlimited (classic) versus 1 GiB (v2).

### Cited Findings
- Estimated max throughput per unit: Developer 500, Basic 1,000, Standard 2,500, Premium 4,000, Isolated 4,000 req/s. These are "for information only", not for capacity planning; load test instead. Max units: Basic 2, Standard 4, Premium 12 per region (more via support). Included requests: Basic v2 10M/month, Standard v2 50M/month, Premium v2 unlimited. **No throughput per unit listed for v2 tiers** — [A: APIM pricing](https://azure.microsoft.com/en-us/pricing/details/api-management/)
- v2 scaling: Basic v2 and Standard v2 up to 10 units. Premium v2 up to 30 units (Premium v2 is GA) — [A: v2 tiers overview](https://learn.microsoft.com/azure/api-management/v2-service-tiers-overview)
- Gateway runtime limits, Classic / V2 — [A: APIM limits](https://learn.microsoft.com/azure/azure-resource-manager/management/azure-subscription-service-limits#api-management-limits):
  - Request payload size: Unlimited / 1 GiB
  - **Buffered payload size: 500 MiB / 2 MiB**
  - Cached response: 2 MiB. Policy doc: 512 KiB. validate-content body: 100 KiB
  - Concurrent backend connections per HTTP authority: 2,048 per unit (Developer 1,024) / 2,048
  - Request URL: Unlimited / 16,384 bytes. Total request duration: Unlimited (Consumption 30 s)
  - WebSockets: 5,000 per unit (max 60,000 per instance)
- Revised entity limits apply from March 2026. For example, Premium/Premium v2 allow 75,000 API operations and 75,000 subscriptions. Classic services above the new limits keep their existing capacity — [A: APIM limits](https://learn.microsoft.com/azure/azure-resource-manager/management/azure-subscription-service-limits#api-management-limits)
- Capacity metrics are CPU/memory of the gateway, "not direct measures of the number of requests". Capacity consumption is driven by policies, payload size, connection reuse and backend latency — [A: APIM capacity](https://learn.microsoft.com/azure/api-management/api-management-capacity)

### Inferences
- For async interfaces that route payloads through APIM v2, any policy that reads the body (transformation, validate-content, set-body) effectively caps payloads at 2 MiB buffered. That pushes large async payloads to the claim-check pattern or to classic Premium.
- Calculator: plan for about 4K req/s per Premium unit as an upper bound for pass-through with light policies, derated for heavy policies.

### Gaps
- No official req/s per unit for Basic v2, Standard v2 or Premium v2.
- The Premium 4,000 req/s figure is an old-style estimate. It is still on the pricing page but explicitly disclaimed.

---

## Azure Data Factory

### Takeaway
ADF is batch-oriented: 10,000 concurrent pipeline runs per factory, 120 activities per pipeline, ForEach parallelism 20 by default (max 50), and 4–256 DIUs per copy. It is unsuitable for low-latency per-message interfaces. Schedule triggers support minute frequency, and event triggers exist (storage/custom events via Event Grid).

### Cited Findings (A: [ADF limits](https://learn.microsoft.com/azure/azure-resource-manager/management/azure-subscription-service-limits#data-factory-limits))
- Concurrent pipeline runs per factory: 10,000 (default and max). Max queued runs per pipeline: 100
- Concurrent pipeline activity runs (Lookup, GetMetadata, Delete) per subscription per Azure IR region: 1,000. External activities: 3,000. Neither limit applies to SHIR
- Concurrent DIUs per subscription per region: 6,000 (group 1, for example West Europe, North Europe), 3,000 (group 2), 1,500 (group 3). Managed VNet: 2,400
- DIUs per copy activity run: 256. Max activities per pipeline: 120 (including inner). Parameters: 50
- ForEach: 100,000 items, parallelism default 20, max 50
- Activity timeout: 10 min minimum, 7 days maximum. Payload per activity run: 896 KB. Expression: 8,192 chars
- Tumbling window minimum interval: 5 min default, 15 min max-limit column (the table's semantics are as printed)
- Self-hosted IR: up to 4 nodes. Linked IRs: 100. Data flows: 50 concurrent per IR
- ARM limits: write API 1,200/h, read 12,500/h. Monitoring queries: 1,000/min
- DIUs per copy range from 4 to 256. "Auto" lets the service choose (for example, 4 for a single file, 4–32 default between file stores). DIUs apply only to the Azure IR, not SHIR. `parallelCopies` is auto by default and counted across DIUs/SHIR nodes — [A: Copy activity performance features](https://learn.microsoft.com/azure/data-factory/copy-activity-performance-features)
- SHIR scaling: raise concurrent jobs per node when CPU/RAM are underused, or add nodes (max 4) — [A: SHIR](https://learn.microsoft.com/azure/data-factory/create-self-hosted-integration-runtime)

### Inferences
- Use ADF only for scheduled or file-event bulk async interfaces. Per-message throughput is bound by pipeline-run overhead (seconds to minutes) and the 100-queued-runs-per-pipeline limit.

### Gaps
- No official trigger-latency SLA for storage/custom event triggers. Per-node SHIR default concurrent-job value was not captured. Note that new ADF investment is shifting to Fabric Data Factory, which has separate limits ([Fabric limitations](https://learn.microsoft.com/en-us/fabric/data-factory/data-factory-limitations), not reviewed in depth).

---

## Azure Event Grid (short)

### Takeaway
Basic tier custom topics/domains handle **5,000 events/s or 5 MB/s ingress** with 1 MB max events, metered in 64 KB chunks. Namespaces (Standard tier) scale per throughput unit (TU): 1,000 events/s or 1 MB/s ingress per TU, up to 40 TUs.

### Cited Findings (A: [Event Grid quotas and limits](https://learn.microsoft.com/azure/event-grid/quotas-limits); limits are per region)
- Custom/partner topic and domain publish rate: 5,000 events/s or 5 MB/s, whichever comes first. One event counts as one 64 KB chunk. Event size: 1 MB (fixed). Events per batch: 5,000. Retention: 1 day. Subscriptions per topic: 500. Custom topics per subscription: 100. Domains: 100,000 topics
- Namespace: max 40 TUs (more via Microsoft). Ingress 1,000 events/s or 1 MB/s per TU. Egress up to 2,000 events/s or 2 MB/s per TU. Retention: 7 days. Max event: 1 MB. Events per request: 1,000. Topics: 100 per TU
- MQTT: 1,000 msgs/s and 1 MB/s inbound per TU. 10,000 sessions per TU. Max message: 1 MB

### Inferences
- Use Event Grid for notification/claim-check signals, not payload transport above 64 KB, because of chunk metering.

### Gaps
- None material for this scope.
