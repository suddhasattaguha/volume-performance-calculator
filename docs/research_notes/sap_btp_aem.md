# SAP BTP Integration Suite (Cloud Integration), Advanced Event Mesh (Solace), API Management: capacity ground rules for an async-interface capacity calculator

Research date: 2026-11-17. Confidence codes: A = official doc / SAP KBA / SAP Learning; B = vendor/SAP-employee blog; C = community/aggregator; E = empirical. Some help.sap.com and community.sap.com pages were blocked or failed to load in this session (noted under each section).

URLs opened (fetched): docs.solace.com/Cloud/service-class-limits.htm; learning.sap.com (System Scope CF); community.sap.com member blog on JMS queues (14056867); community.sap.com Mandy Krimmel JMS retry blog (13315669); developers.sap.com AEM-CI tutorial; knowledgelib.io aggregator; SAP KBA 3573749; SAP KBA 3462229; blogs.sap.com "how to guard against huge messages" (2017). Failed: SAP blog "JMS Resource and Size Limits" (13322814, not on allowlist); SAP blog "Cloud Integration content size limits" (13469116, client error).

## 1. Cloud Integration runtime: worker nodes, threads, adapter distribution, message size, timeouts, throughput

### Takeaway
SAP does not publish a numeric worker-node count, thread count, or msg/s throughput benchmark for Cloud Integration (Cloud Foundry) that could be verified here. The one verified size guard is the SOAP/IDoc sender body limit: 40 MB by default, plus 100 MB for attachments. Model worker count as a tenant parameter you confirm per tenant through the "runtime nodes" view (KBA 3573749), not as a published constant.

### Cited Findings
- SOAP (1.x) and IDoc sender adapters: the minimum size limit is 1 MB, the **default body size is 40 MB** and the **default attachments size is 100 MB**. A zero or empty value means no limit. A message over the limit is rejected with HTTP 413 "Request Entity Too Large", and the MPL records it. The article gives no maximum. Author Markus Muenkel (SAP), 2017. Conf B, and old, so it should be re-checked against current adapter docs. — [SAP blog: How to guard against huge messages](https://blogs.sap.com/2017/06/29/how-to-guard-against-huge-messages/)
- An aggregator says the max HTTP request/response payload is "40 MB default, configurable up to 100 MB with memory impact" and cites the SAP Integration Suite Feature Scope Description PDF. Conf C: the aggregator was not checked against the PDF. — [knowledgelib.io](https://knowledgelib.io/business/erp-integration/sap-integration-suite/2026), citing [FSD PDF](https://help.sap.com/doc/e50e61e7b66c4b60ae5e88c00c01486a/CLOUD/en-US/FSD_IntegrationSuite.pdf)
- Cloud Integration tenant (CF) resource limits: integration content 500 MB; MPL persistence 35 GB; runtime database 35 GB; disk space 4 GB. The page gives no worker-node, thread, or message-size numbers. Conf A. — [SAP Learning: Understanding System Scope in the CF Environment](https://learning.sap.com/learning-journeys/developing-with-sap-integration-suite/understanding-system-scope-in-the-cloud-foundry-environment)
- SAP has a KBA titled "Finding Runtime Nodes on a Tenant" (3573749, tagged worker nodes / runtime node). The public preview has no counts. This confirms that node count varies per tenant and has to be observed. Conf A (title only). — [SAP KBA 3573749](https://userapps.support.sap.com/sap/support/knowledge/en/3573749)
- Edge Integration Cell (not the cloud tenant): minimum 3 worker nodes; production sizing is 8 vCPU / 32 GB RAM per node. Conf C. — [knowledgelib.io](https://knowledgelib.io/business/erp-integration/sap-integration-suite/2026), citing [community blog](https://community.sap.com/t5/technology-blog-posts-by-members/integration-suite-in-2025-amp-2026/ba-p/14320912)
- Cloud Connector RFC timeout is 30 s by default. Conf C (aggregator citing the FSD). — [knowledgelib.io](https://knowledgelib.io/business/erp-integration/sap-integration-suite/2026)
- Metering: 1 message = 250 KB slice (a 2 MB payload = 9 messages). Useful for cost, not for capacity. Conf C. — [knowledgelib.io](https://knowledgelib.io/business/erp-integration/sap-integration-suite/2026)
- When several processes consume and/or multiple worker nodes process messages, JMS-sourced messages are processed in parallel. This confirms that effective parallelism = per-channel concurrency x worker nodes. Conf B (SAP PM Mandy Krimmel). — [SAP blog: Asynchronous Messaging with Retry Using JMS](https://community.sap.com/t5/integration-blog-posts/cloud-integration-configure-asynchronous-messaging-with-retry-using-jms/ba-p/13315669)

### Inferences
- Calculator rule: `effective_parallelism(JMS/AEM sender) = concurrent_processes_per_channel x N_worker_nodes`. Treat N as a tenant input. Default it to 2, which is a common observation for a standard tenant (E, unverified), and require a per-tenant confirmation.
- Treat the 40 MB body limit as a design ceiling for HTTP-family senders. Raising it trades off worker heap.
- HTTP/SOAP/OData/IDoc inbound traffic is load-balanced across worker nodes by the platform's router. No source opened here documents the algorithm, so assume roughly round-robin (inference).

### Gaps
- No verified worker nodes per tenant (standard vs premium), auto-scaling behaviour, or customer-request process. SAP does not appear to publish these publicly. Ask SAP via an incident or your account team.
- No verified threads per worker, and no SAP performance guide with msg/s for a simple iFlow. None was found. Empirical benchmarking (E) is needed.
- Sender-side timeouts (HTTP sender, CPI-to-backend default 60 s?) could not be verified; the content-size-limits blog failed to load.
- The HTTP sender max body could not be verified on help.sap.com.

## 2. JMS in Cloud Integration

### Takeaway
The current official baseline per tenant (CF) is **30 queues / 9 GB / 150 transactions by default**, scalable to **100 queues / 30 GB / 500 transactions**, with self-service through Integration Suite "Manage Capabilities". The JMS sender defaults to 1 concurrent process. Messages are retained for 90 days by default, set by the expiration period.

### Cited Findings
- JMS queue storage 9 GB default, up to 30 GB. JMS transactions 150 default, up to 500. JMS queues 30 default, up to 100. Conf A. — [SAP Learning: System Scope CF](https://learning.sap.com/learning-journeys/developing-with-sap-integration-suite/understanding-system-scope-in-the-cloud-foundry-environment)
- Queue count increase: "By default the starting amount of JMS queues is 30". It can be raised "up to 100 in a self service" with the Integration_Provisioner role, under Integration Suite > Home > Capabilities > Manage Capabilities. SAP Note 3318666 is referenced. Conf C. — [Community member blog: Increasing the number of JMS queues](https://community.sap.com/t5/technology-blog-posts-by-members/increasing-the-number-of-jms-queues-in-sap-integration-suite/ba-p/14056867)
- JMS sender "Number of Concurrent Processes is set to 1 per default". The guidance is to keep parallelism low because JMS resources are limited. Retry interval defaults to 1 min, exponential backoff is recommended, and the max retry interval is 60 min. Undelivered messages are deleted after **90 days** by default, configured as the Expiration Period in the JMS receiver. The recommendations predate the **exclusive queues introduced in increment 2501**. Conf B. — [SAP blog (M. Krimmel)](https://community.sap.com/t5/integration-blog-posts/cloud-integration-configure-asynchronous-messaging-with-retry-using-jms/ba-p/13315669)
- **Outdated / conflicting:** an aggregator cites the SAP blog "JMS Resource and Size Limits" for 9 queues default, 4 GB storage, 30-day retention, 10 MB max message size, and 1 consumer per queue. These figures match older Neo / early-CF values and conflict with the SAP Learning figures above. Use them for the per-message size only, flagged. Conf C (original blog not loadable here). — [knowledgelib.io](https://knowledgelib.io/business/erp-integration/sap-integration-suite/2026), citing [SAP blog 13322814](https://community.sap.com/t5/technology-blogs-by-sap/cloud-integration-jms-resource-and-size-limits/ba-p/13322814)

### Inferences
- Transaction budget: each JMS sender concurrent process on each worker holds a consumer/transaction. Budget rule: `sum over JMS sender channels (concurrent_processes x N_workers) + JMS receiver/outbound usage <= 150 (or 500)`. This is consistent with SAP's "keep parallelism low" advice, but the exact counting formula is not verified.
- Storage per queue is shared from the tenant pool (9 to 30 GB). Backlog headroom in the calculator = pool / avg message size.

### Gaps
- Max concurrent processes per JMS sender (commonly cited as 99, unverified) was not confirmed.
- The current per-message size cap for JMS (10 MB? larger?) was not verified from a current official source.
- The exact formula for how transactions are consumed (per consumer per worker, plus producers) was not verified.

## 3. AEM / AMQP / Kafka / Solace sender adapters in Cloud Integration

### Takeaway
No numeric parallel-consumer range or default could be verified for the AEM sender adapter in this session. The adapter uses SMF against a dedicated queue. Parallelism multiplies by worker nodes, in the same way as JMS (inference).

### Cited Findings
- The AEM sender connects over secured SMF (host, Message VPN, user, password via secure alias). It consumes from a queue dedicated to Cloud Integration, and the receiver publishes to a topic. The adapter has Connection / Processing / Message properties tabs, but the tutorial lists no numeric defaults. Conf A. — [SAP Developers tutorial: AEM integrate Cloud Integration iFlow](https://developers.sap.com/tutorials/aem-integrate-cloud-integration-iflow.html)
- Partner adapter for high parallelism on Kafka: KaTe "Confluent Parallel Consumer Adapter" is marketed for high-throughput processing. This suggests the standard Kafka adapter's parallelism is constrained, though no numbers were verified. Conf B. — [SAP Store page](https://www.sap.com/norway/products/technology-platform/partners/kate-gmbh-kate-confluent-parallel-consumer-adapter-for-sap-integration-suite.html)

### Inferences
- `effective consumers on AEM queue = parallel_consumers x N_workers`. On the broker side, an exclusive queue delivers to only one active flow; a non-exclusive queue spreads across flows. Make sure the queue access type matches the parallelism you want.
- The max message size end to end is the lower of the CI worker/adapter limit and the broker limit (10 or 30 MB per class, see §4).

### Gaps
- AEM sender "Parallel Consumers" default and max, acknowledgement mode options (auto/client), AMQP sender consumer count, and Kafka sender "parallel consumers" range were not verified. These are in help.sap.com adapter pages, which were not reached. Verify there.

## 4. AEM / Solace broker service-class limits

### Takeaway
Solace publishes per-class **resource** limits: connections, spool, queues, message size, RDPs, transactions. It does **not** publish msg/s or MB/s per class on the service-class page. Max message size is 10 MB on E100/E250 and 30 MB from E1K (later versions) upward.

### Cited Findings (all Conf A — [Solace: Service Class Options for Event Broker Services](https://docs.solace.com/Cloud/service-class-limits.htm))

| Class (legacy name) | Broker size | Client conns (total / SMF+AMQP / MQTT+WS+REST-in) | Default spool | Max msg size | Queues + TEs | Max queued msgs | RDPs / REST consumers / REST outgoing conns | Transacted sessions / transactions |
|---|---|---|---|---|---|---|---|---|
| E100 Standalone | 1K | 100 / 100 / 100 | 25 GB | 10 MB | 100 | 240 M | 200 / 600 / 1,000 | 100 / 500 |
| E250 (Nano) | 1K | 250 / 250 / 250 | 50 GB | 10 MB | 250 | 240 M | 200 / 600 / 1,000 | 500 / 2,500 |
| E1K (Kilo) | 1K | 1,000 / 1,000 / 1,000 | 200 GB | 10 MB (30 MB later versions) | 1,000 | 240 M | 200 / 600 / 1,000 | 1,000 / 5,000 |
| E5K (Mega) | 10K | 5,000 / 5,000 / 5,000 | 400 GB | 30 MB | 5,000 | 3 B | 500 / 1,500 / 7,500 | 5,000 / 25,000 |
| E10K (Giga) | 10K | 10,000 / 10,000 / 10,000 | 600 GB | 30 MB | 10,000 | 3 B | 500 / 1,500 / 7,500 | 10,000 / 50,000 |
| E50K (Tera 50K) | 100K | 50,000 / 30,000 / 50,000 | 800 GB | 30 MB | 50,000 | 3 B | 1,500 / 4,500 / 22,500 | 10,000 / 50,000 |
| E100K (Tera 100K) | 100K | 100,000 / 30,000 / 100,000 | 1,000 GB | 30 MB | 100,000 | 3 B | 1,500 / 4,500 / 22,500 | 10,000 / 50,000 |

- Other limits from the same page: queue topic subscriptions 10K (E100 to E1K), 50K (E5K/E10K), 500K (E50K/E100K). Max VPN bridges 25 / 500 / 5,000. Partitioned queues 50 / 100 / 500. Kafka bridge profile Small (10 bridges, 300 conns) up to E1K, Medium (50 bridges, 2,000 conns) from E5K. Incoming and outgoing flows equal total client connections (E50K/E100K: 50K/100K).
- Internal features (Config-Sync, DMR/event mesh, DR replication, VPN bridges) consume these limits. Example: 9 connections used on E1K leaves 991. Spool can be increased on existing services. All classes except Standalone are HA.
- Msg/s, Mbps, max consumers per queue, and per-client egress are not on this page. Solace points to the "SolaceEventBroker_<version>_limits_and_alerts" document.

### Inferences
- RDP capacity: per-class REST outgoing connections / RDPs gives the average outbound HTTP connections per RDP (E1K: 1,000/200 = 5; E5K: 15; E50K: 15). Use REST outgoing connections as the hard concurrency ceiling for webhook-style delivery to Cloud Integration HTTP endpoints. RDP throughput is then bounded by `outgoing_connections x 1/latency_of_CI_iFlow`, because RDP waits for the HTTP response per message per connection (inference, standard Solace RDP behaviour, not verified here).
- SMF vs AMQP: the same connection caps apply to both on classes up to E10K. On E50K/E100K, enterprise protocols are capped at 30,000 connections.

### Gaps
- Message rate per class (msg/s, MB/s): not published on the service-class page. Solace's generic [performance page](https://solace.com/performance) covers appliance/software benchmarks, not cloud classes, and was not opened.
- Max consumers (flows) per queue (commonly 1,000 for software brokers, unverified) and direct vs guaranteed message size differences were not verified.
- How SAP's AEM service plans map to Solace classes (SAP sells them as the same E-classes) was not verified in an SAP doc this session.

## 5. BTP API Management

### Takeaway
API Management caps **non-streamed** request/response payloads at **10 MB**. Streaming is off by default and can be enabled to go beyond that. No published per-tenant throughput or rate limit was found.

### Cited Findings
- "message payload size is restricted to 10 MB for non-streamed HTTP requests and responses". Streaming is disabled by default. Over 10 MB produces "Body buffer overflow" (`protocol.http.TooBigBody`). The KBA explains how to increase the size by enabling streaming. Conf A. — [SAP KBA 3462229](https://userapps.support.sap.com/sap/support/knowledge/en/3462229)
- The aggregator found no numeric API Management throughput or rate limits. It only notes that HTTP 429 comes from policy limits. Conf C. — [knowledgelib.io](https://knowledgelib.io/business/erp-integration/sap-integration-suite/2026)

### Inferences
- Rate limits in API Management are customer-defined (Spike Arrest / Quota policies), not platform-published. Model them as a design parameter.
- Streamed proxies cannot apply payload-inspecting policies. If the calculator allows payloads over 10 MB on an APIM path, that should carry a flag (inference from the Apigee heritage).

### Gaps
- Tenant-level TPS/throughput for API Management was not found publicly.
- The max size with streaming enabled was not stated in the KBA preview.
