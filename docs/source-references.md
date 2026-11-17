# Source references for every limit (evidence register input)

Deep research, 2026-11-17 (Claude research task `wf-c952fd3d`), requested by Suddha: one fixed, official link per limit so a reviewer can validate each verdict in one click. Feeds the planned evidence register in the app (see the end of this file).

Confidence: **A** official vendor doc or public vendor KBA · **B** vendor engineering blog or benchmark · **C** community or secondary · **E** no source found.
"Opened" = page fetched in full. "Snippet" = verified from the search extract of that exact URL (help.sap.com blocks automated fetching): a reviewer should click once to confirm. "—" = no page verified; no URL given from memory.

## Summary

- **Confirmed at A level:** Solace service-class table (docs.solace.com, updated 16 Nov 2026), Service Bus quotas, Logic Apps limits, APIM gateway runtime limits, Event Grid quotas, ADF pipeline limits, SAP JMS resource table, SAP APIM 10 MB non-streamed limit, 250 KB metering slice. The 40 MB / 100 MB sender guard is in SAP KBAs 3074668 / 3745186.
- **Corrections:** see the Corrections list below (11 items).
- **No official source (keep as E, measure instead):** CI concurrent HTTP threads per worker; AEM msg/s per class; AEM sender Parallel Consumers default/max; Service Bus msg/s per MU (blog figures in charts only); Logic Apps ~90 actions/s per WS3 (derived, not published); recommended CI message size (10 MB is a design choice).

## 1. SAP BTP Integration Suite (Cloud Foundry)

| Key | Value used | Confirmed value | Conf. | Official URL | Section / table | Snippet | Notes |
|---|---|---|---|---|---|---|---|
| sapApimMB | 10 MB non-streamed; streaming off by default | Confirmed: 10 MB non-streamed, 500 MB streamed; streaming off by default | A (snippet) | https://help.sap.com/docs/r/38c3df3f8da44a809f937220b3579607/Cloud/en-US/f096f3fcbaeb4897b14adfa1cf7ec4fc.html | Enable Streaming of Requests and Responses in an API Proxy › Context | "message payload size is restricted to 10 MB for non-streamed HTTP requests" | Secondary: KBA 3462229 https://userapps.support.sap.com/sap/support/knowledge/en/3462229. Error `protocol.http.TooBigBody`. |
| ciSoftMB | 10 MB comfortable | No official recommended size | E | — | — | — | KBA 3262232 referenced by KBA 3745186, not opened. Keep 10 MB as a design choice. |
| ciGuardMB | Body 40 MB, attachments 100 MB, HTTP 413 above | 40 MB / 100 MB confirmed; HTTP 413 not confirmed | A (KBA, snippet) | https://userapps.support.sap.com/sap/support/knowledge/en/3074668 | KBA 3074668 › Symptom (HTTPS, SOAP, AS2) | "Message exceeds configured size limit (body 40.0 MB, attachments 100.0 MB)" | Parameter page: https://help.sap.com/docs/CLOUD_INTEGRATION/368c481cd6954bdfa5d0435479fd4eaf/8319e33855724b7984a0d8a2bbef6b11.html. KBA 3745186: HTTPS/SOAP default max body 40 MB. IDoc default not confirmed. |
| ciProcs (JMS) | Concurrent processes default 1 | Default 1, per worker node; max not confirmed | A (snippet) | https://help.sap.com/docs/r/368c481cd6954bdfa5d0435479fd4eaf/Cloud/en-US/161791b8cb98485ba00d81efa4197a49.html | Configure the JMS Sender Adapter › Processing › Number of Concurrent Processes | "Default number of concurrent processes is 1." | "applied to each worker node"; Non-Exclusive access only. AS2 < 99; AMQP ≤ 99 (https://help.sap.com/docs/integration-suite/sap-integration-suite/configure-amqp-sender-adapter). |
| ciProcs (Kafka) | — | Parallel consumers max 25 per worker node | A (SAP-docs GitHub mirror) | https://github.com/SAP-docs/btp-integration-suite/blob/main/docs/ci/Development/configure-the-kafka-sender-adapter-0d849e5.md | Processing › Parallel Consumers | "max. number of parallel consumer is defined as 25" | Scales with worker nodes. |
| ciProcs (AEM) | Parallel Consumers default/max | Default/max not found; per-worker multiplication confirmed | A (snippet) | https://help.sap.com/docs/integration-suite/sap-integration-suite/configure-advanced-event-mesh-sender-adapter | Parallel Consumers row | "configure this value to 3… with 2 workers… 6 consumers" | Max stays E until read in the tenant UI. |
| ciNodes | Read from runtime nodes view | Method confirmed; no fixed count published | A (KBA snippet) | https://userapps.support.sap.com/sap/support/knowledge/en/3573749 | KBA 3573749 Finding Runtime Nodes on a Tenant | "How to locate the runtime nodes on a tenant." | Consumers = nodes × concurrent processes. |
| ciHttpCap | Threads per worker | Not found | E | — | — | — | Measure. |
| jmsGB / jmsTx | 9 GB→30 GB; 30→100 queues; 150→500 tx | **9.3 GB**→30 GB; 30→100 queues; 150→500 tx; 150→500 consumers | A | https://help.sap.com/docs/cloud-integration/sap-cloud-integration/jms-resource-limits-and-optimizing-their-usage | Default and Maximum JMS Resources | "Number of transactions 150 500" | Per queue 300 MB, 5 transactions; one queue ≤ 95% of capacity. 90-day expiry is on the AS2 sender doc, not here. |
| JMS msg cap | 10 MB (old) | **1,280 MB** (256 × 5 MB chunks); headers + properties ≤ 4 MB | A (GitHub mirror) | https://github.com/SAP-docs/btp-integration-suite/blob/main/docs/ci/Operations/jms-resource-limits-and-optimizing-their-usage-4857054.md | Default and Maximum JMS Resources | "maximum message size … stored in a JMS queue is 1280 MB" | 10 MB is obsolete. |
| slice | 1 billable msg = 250 KB | Confirmed | A (snippet) | https://www.sap.com/products/technology-platform/integration-suite/pricing.html | Pricing footnote | "one additional message for each 250 kilobytes or portion thereof" | Formal definition SAP Note 2942344 (not opened). |
| Tenant resources | Content 500 MB; MPL 35 GB; DB 35 GB; disk 4 GB | Not confirmed; conflicting | B/C | https://learning.sap.com/courses/sap-cloud-platform-integration-service-overview/understanding-system-scope-in-the-cloud-foundry-environment | System Scope Overview | "Integration Content · 500 MB" | GitHub issue cites 10 GB disk; KBA 3505364 mentions 2 GB content. |

## 2. SAP Integration Suite, advanced event mesh (Solace Cloud)

Primary page: https://docs.solace.com/Cloud/service-class-limits.htm (opened; last updated 16 Nov 2026; tables "Service Class Properties", "Service-Level Limits for Each Service Class", "Service-Level Limits for Flows and Transactions").

| Class | Client conns | Spool | Max msg | Queues | Enterprise conns (SMF, AMQP) | IoT conns (MQTT, WebMsg, REST in) | RDPs | REST consumers | REST outgoing conns | Transacted sessions | Transactions |
|---|---|---|---|---|---|---|---|---|---|---|---|
| E100 | 100 | 25 GB | 10 MB | 100 | 100 | 100 | 200 | 600 | 1,000 | 100 | 500 |
| E250 | 250 | 50 GB | 10 MB | 250 | 250 | 250 | 200 | 600 | 1,000 | 500 | 2,500 |
| E1K | 1,000 | 200 GB | 10 MB (≤ 10.25.8.3179-18) / 30 MB (≥ 10.25.8.3179-20) | 1,000 | 1,000 | 1,000 | 200 | 600 | 1,000 | 1,000 | 5,000 |
| E5K | 5,000 | 400 GB | 30 MB | 5,000 | 5,000 | 5,000 | 500 | 1,500 | 7,500 | 5,000 | 25,000 |
| E10K | 10,000 | 600 GB | 30 MB | 10,000 | 10,000 | 10,000 | 500 | 1,500 | 7,500 | 10,000 | 50,000 |
| E50K | 50,000 | 800 GB | 30 MB | 50,000 | 30,000 | 50,000 | 1,500 | 4,500 | 22,500 | 10,000 | 50,000 |
| E100K | 100,000 | 1,000 GB | 30 MB | 100,000 | 30,000 | 100,000 | 1,500 | 4,500 | 22,500 | 10,000 | 50,000 |

| Key | Value used | Confirmed value | Conf. | Official URL | Section | Snippet | Notes |
|---|---|---|---|---|---|---|---|
| aemClass | class table | Confirmed (above) | A | https://docs.solace.com/Cloud/service-class-limits.htm | Service-Level Limits for Each Service Class | "Enterprise Client Connections (SMF, AMQP)" | Internal features use connections/queues. Spool expandable to 6 TB (https://docs.solace.com/Cloud/Configure-Message-Spools.htm). |
| aemE1K30MB | 10 vs 30 MB | 30 MB for new E1K ≥ 10.25.8.3179-20 | A (snippet) | https://help.pubsub.em.services.cloud.sap/Release-Notes/PubSub-Cloud-Release-Notes.htm | 30 MB Guaranteed Message Support for Broker 1K | "adding support for 30 MB Guaranteed messaging to newly created Broker 1K" | Existing services need upgrade + upscale. |
| aemPools | SMF/AMQP enterprise; MQTT/WebMsg/REST-in IoT | Confirmed by column headers | A | https://docs.solace.com/Cloud/service-class-limits.htm | column headers | "IoT Client Connections (MQTT, Web Messaging, REST Incoming)" | "one client = one connection", "translated to SMF", "compression SMF only" not verified (E). |
| aemOversize | discarded | **Rejected at publish: MESSAGE_TOO_LARGE** | A (snippet) | https://docs.solace.com/Messaging/Guaranteed-Msg/Basic-Guaranteed-Messsaging-Operation.htm | Messages Larger Than the Event Broker's Maximum Message Size | "return an error … with the subcode MESSAGE_TOO_LARGE" | |
| aemRDP | throughput vs response time | Outgoing connections per REST consumer 1–50; response wait 1–300 s (default 30); throughput bound by round-trip time | A (snippets) | https://docs.solace.com/API/REST/REST-Consumers.htm | REST Delivery Point / Connection Handling on Errors | "performance of a single HTTP connection is always bound by the round-trip time" | Connections: https://docs.solace.com/Admin/Broker-Manager/Cloud-Connector-Click-to-Connect.htm. Wait: https://docs.solace.com/Services/Managing-RDPs.htm. No published rates. One outstanding request per connection (inferred). |
| aemQueue | max consumers; per-queue size | Not verified | E | — | — | — | Read in Broker Manager queue settings. |
| aemRate | msg/s per class | Not published | E | — | — | — | Benchmark with SDKPerf. |

## 3. Azure

| Key | Value used | Confirmed value | Conf. | Official URL | Section | Snippet | Notes |
|---|---|---|---|---|---|---|---|
| sbMsgSize | 100 MB AMQP; 1 MB HTTP/batch | Confirmed; **default per entity 1 MB** | A | https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-quotas | Basic vs standard vs premium › Message size or batch size | "AMQP protocol: Up to 100 MB for single message." | Messages > 1 MB count 2× (queue) / X+1 (topic) against size. |
| sbSize | 80 GB | Confirmed; namespace 1 TB per MU | A | same | Queue or topic size | "Premium tier supports 80 GB natively." | |
| sbEntities | 1,000 per MU | Confirmed, ≤ 16,000 per namespace | A | same | Number of topics or queues per namespace | "1,000 per messaging unit (MU), up to 16,000 per namespace." | |
| sbConn | 5,000 AMQP | Confirmed | A | same | Common limits for all tiers | "Net Messaging: 1,000. AMQP: 5,000." | |
| sbMU | 1/2/4/8/16 | Confirmed | A (snippet) | https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-premium-messaging | Premium messaging overview | "You can purchase 1, 2, 4, 8 or 16 messaging units" | No fixed ops/s quota on Premium. |
| sbThroughput | 6,800 / 5,000 / 1,600 msg/s per MU | Not confirmed (figures in charts) | B | https://techcommunity.microsoft.com/blog/messagingonazureblog/service-bus-premium-sku-performance-update/4232600 | blog 2024-08-30 | "average increase of ~50%, and even over 150% for some scenarios" | 2016 baseline: 16,728 msg/s in and out with 4 MU (https://techcommunity.microsoft.com/blog/messagingonazureblog/premium-messaging-how-fast-is-it/370722). Measure. |
| apimRps | Basic 1,000 / Std 2,500 / Prem 4,000 | Confirmed as estimated max throughput per unit | A (snippet) | https://azure.microsoft.com/en-us/pricing/details/api-management/ | Classic tiers › Estimated maximum throughput (per unit) | "Standard tier has an estimated maximum throughput of approximately 2,500 requests per second" | Disclaimer footnote not seen verbatim. |
| apimBody | classic 500 MiB; v2 2 MiB | Confirmed; v2 request payload 1 GiB, classic unlimited | A | https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits#api-management-gateway-runtime-limits | API Management gateway runtime limits | "Buffered payload size \| 500 MiB \| 2 MiB \| 2 MiB" | 2 MiB = buffered payload in general. |
| apimConn | 2,048 per unit | Confirmed (classic per unit; v2 not per unit) | A | same | Concurrent back-end connections per HTTP authority | "2,048 per unit" | |
| apimUnits | Premium ≤ 12/region; v2 ≤ 30 | Confirmed | A | https://azure.microsoft.com/en-us/pricing/details/api-management/ | Premium scale | "12 per region (call support to add more)" | |
| laConcurrency | trigger max 100 | Confirmed (irreversible) | A | https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-limits-and-config | Concurrency and debatching › Trigger - concurrent runs | "Concurrency on (irreversible): - Default: 100 - Min: 1 - Max: 100" | |
| laWaiting | 200 | Max 200; default 10 + concurrency | A | same | Maximum waiting runs | "Max: 200 runs" | |
| laMsg | 100 MiB / 1 GB chunked; chunk 52,428,800 B | Confirmed | A | same | Messages | "Content chunk size per action … 52,428,800 bytes (52 MB)" | Not on triggers. |
| laDuration | stateless 5 min; stateful 90 days | Confirmed | A | https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-limits-and-config#change-duration | Run duration and history retention | "Stateless workflow: 5 min" | |
| laHttp | 225 s | Confirmed | A | https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-limits-and-config#http-limits | Timeout duration | "225 sec (3 min and 45 seconds) (Default)" | |
| laForEach | 20 / 50 | Confirmed | A | same page | For each loop | "Default: 20 - Min: 1 - Max: 50" | |
| laApim56 | 56 calls / 5 min | Confirmed | A | https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-limits-and-config#throughput-limits | Throughput limits | "hard throttling limit of 56 calls per 5-minute interval" | Use the callback URL. |
| laStorage | ~100k actions/min/account; 32 accounts | Confirmed | A (snippet) | https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-limits-and-config?tabs=standard#scale-for-high-throughput | Scale for high throughput › Storage | "~100,000 action executions per minute, per storage account" | |
| laWS | WS1 1/3.5, WS2 2/7, WS3 4/14 | WS3 confirmed; WS1/WS2 secondary only | A (snippet) | https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-pricing | Pricing tiers in the Standard model | "WS3 \| 4 \| 14" | |
| laBench | ~90 actions/s per WS3 | Derived, not stated | B | — (Tech Community "Scaling Logic Apps Standard – Sustained Event Processing System", 17 Jul 2023, not opened) | — | "250K actions/min sustained rate" | Up to 32 instances → ≈ 130 actions/s per instance. Companion: 24,000 msgs/min on 20 WS3. Measure. |
| fnSbConc | 16 | 16 per scaled instance, **× cores** | A (snippet) | https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-service-bus | host.json settings | "effectively multiplied by the number of cores" | EP3 → 64. Sessions 8; batch 1,000. |
| fnEP | EP1/2/3 = 1/2/4 cores | Confirmed (3.5 / 7 / 14 GB) | A (snippet) | https://learn.microsoft.com/en-us/azure/azure-functions/functions-premium-plan | SKU table | "EP3 \| 4 \| 14 GB \| 250 GB" | |
| fnLimits | 230 s HTTP; 30 min timeout | Confirmed; instance max not confirmed | A | — (Microsoft Learn "Azure Functions hosting options", not opened) | timeout table | "230 seconds is the maximum amount of time … HTTP triggered function" | |
| adf | 10,000 runs; 100 queued; ForEach 20/50 | Confirmed | A (snippet) | https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits | Azure Data Factory limits | "Concurrent pipeline runs per data factory … 10,000" | ForEach: https://learn.microsoft.com/en-us/azure/data-factory/control-flow-for-each-activity |
| adfOther | DIU 4–256; 896 KB; SHIR 4 | Not verified | E | — | — | — | |
| eventGrid | 5,000 ev/s or 5 MB/s; 1 MB; 64 KB | Confirmed | A (snippet) | https://learn.microsoft.com/en-us/azure/event-grid/quotas-limits | Event Grid throttle limits | "5,000 events or 5 MB per second (whichever comes first)" | |

## 4. Method and statistics

Not verified in this session (E until a canonical link is attached): Little's law (Little 1961, Operations Research 9(3)); Erlang C / Kingman (queueing text; pool-size utilisation targets are rules of thumb, C/E); queue-based load leveling (Azure Architecture Center); retry at one layer (AWS Well-Architected REL05 / Azure retry guidance); ITU-T E.492 (4th busiest day); Cisco traffic analysis (15–20% peak hour); SAP user classes 10/120/360 (SAP sizing guide); base64 4/3 (RFC 4648 §4); MIME 76-char lines (RFC 2045 §6.8); IDoc record lengths 1,000 / 1,063 / 524 (SAP IDoc record types).

## What to measure where no official source exists

- **ciSoftMB:** load test at 5 / 10 / 20 / 40 MB.
- **ciHttpCap:** concurrent HTTPS requests per worker until latency or 503s, × runtime nodes (KBA 3573749).
- **AEM sender Parallel Consumers max; queue max consumers and size:** read from adapter UI and Broker Manager.
- **AEM msg/s per class:** SDKPerf; RDP = connections ÷ consumer response time.
- **Service Bus msg/s per MU:** Microsoft benchmark tool; scale MUs when CPU > 75%.
- **Logic Apps actions/s per instance:** measure against ~100k/min per storage account.
- **Tenant disk / content:** confirm with SAP support.

## Corrections (value in the app → evidence)

1. JMS per-message cap: 10 MB → **1,280 MB**; headers + properties ≤ 4 MB.
2. JMS default storage: 9 GB → **9.3 GB** (max 30 GB).
3. AEM E1K max guaranteed message: 10 MB → **30 MB for broker ≥ 10.25.8.3179-20**.
4. AEM oversize: "discarded" → **rejected at publish (MESSAGE_TOO_LARGE)**.
5. AEM E50K/E100K enterprise connections capped at **30,000**.
6. Service Bus Premium: **default 1 MB per entity**; raise for up to 100 MB. > 1 MB counts 2× / X+1.
7. APIM v2 2 MiB = general buffered payload limit; v2 request payload 1 GiB, classic unlimited.
8. Logic Apps waiting runs: 200 = max; default 10 + concurrency.
9. Functions maxConcurrentCalls 16: per instance, **× cores**.
10. ciGuard HTTP 413 not documented: cite "Message exceeds configured size limit".
11. Tenant disk 4 GB disputed (10 GB seen): flag unconfirmed.

---

## Plan: evidence register in the app (not built; waits for "build")

See the plan in the chat of 2026-11-17 and in CLAUDE.md §6 (P6).
