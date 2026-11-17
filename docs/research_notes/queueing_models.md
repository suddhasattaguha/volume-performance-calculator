# Queueing Theory and Capacity-Planning Models for Message-Based Middleware (Brokers, iFlows, Logic Apps, Functions)

Confidence tags: **A** = textbook/academic, **B** = vendor guide, **C** = practitioner. Where a formula comes from standard algebra I worked out rather than from a source I opened, it is placed under *Inferences* and marked "derived".

URLs opened (fetched) in this research:
- Little, "Little's Law as Viewed on Its 50th Anniversary" (Operations Research 2011) PDF: https://people.cs.umass.edu/~emery/classes/cmpsci691st/readings/OS/Littles-Law-50-Years-Later.pdf
- Kingman's formula (Wikipedia): https://en.wikipedia.org/wiki/Kingman%27s_formula
- Fabrico, Kingman formula worked example: https://www.fabrico.io/blog/kingman-formula-queue/
- Technion (Mandelbaum) QED lecture, Erlang B/C and square-root staffing: https://serveng.technion.ac.il/files/Lectures/QED_lecture_Erlang_B_C.pdf
- Gunther, "A General Theory of Computational Scalability Based on Rational Functions" (arXiv 0808.1431): https://ar5iv.arxiv.org/html/0808.1431
- Microsoft Azure Architecture Center, Queue-Based Load Leveling: https://learn.microsoft.com/azure/architecture/patterns/queue-based-load-leveling
- AWS EC2 Auto Scaling, scaling policy based on Amazon SQS: https://docs.aws.amazon.com/autoscaling/latest/userguide/as-using-sqs-queue.html
- AWS Well-Architected REL05-BP03 Control and limit retry calls: https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_limit_retries.md
- Confluent docs, Choose and Change the Partition Count: https://docs.confluent.io/kafka/operations-tools/partition-determination.html
- Confluent blog (Jun Rao, 2015), How to Choose the Number of Topics/Partitions: https://www.confluent.io/blog/how-choose-number-topics-partitions-kafka-cluster/

---

## 1. Little's law (L = λW) for concurrency / parallel consumer sizing

### Takeaway
Little's law is distribution-free, discipline-free and holds even non-stationarily over a finite window, so "required in-flight concurrency = arrival rate × time each message is held (processing + any in-consumer waits)" is the most robust sizing formula in the calculator (confidence A). It is a measurement identity on averages, not a forecaster: it gives the *mean* concurrency, so headroom for variability must be added via Erlang C / Kingman (sections 2) .

### Cited Findings
- L (average number in system) = λ (average arrival rate) × W (average time in system); L is dimensionless, W in time units, λ items per unit time. (A) — [Little 2011](https://people.cs.umass.edu/~emery/classes/cmpsci691st/readings/OS/Littles-Law-50-Years-Later.pdf)
- Long-run version holds "subject to the existence and convergence of the three LL parameters"; finite-time version (LL.2) holds on any window 0 < T < ∞; LL.1 (exact) requires the system to be empty at 0 and T. (A) — [Little 2011](https://people.cs.umass.edu/~emery/classes/cmpsci691st/readings/OS/Littles-Law-50-Years-Later.pdf)
- "LL.1 holds under nonstationary conditions" and "independent of queue discipline". (A) — [Little 2011](https://people.cs.umass.edu/~emery/classes/cmpsci691st/readings/OS/Littles-Law-50-Years-Later.pdf)
- LL "applies to individual queues and also networks and subnetworks" and to subclasses of items; boundary is chosen by the analyst (number in queue vs number in system incl. in service). (A) — [Little 2011](https://people.cs.umass.edu/~emery/classes/cmpsci691st/readings/OS/Littles-Law-50-Years-Later.pdf)
- Little frames LL as "the measurement business, not the forecasting business"; end effects (items present at window edges) are why the finite-time form exists; practitioners "should always check model assumptions". (A) — [Little 2011](https://people.cs.umass.edu/~emery/classes/cmpsci691st/readings/OS/Littles-Law-50-Years-Later.pdf)
- AWS applies the same logic for queue-driven scaling: acceptable backlog per instance = acceptable latency / average processing time per message (example: 10 s / 0.1 s = 100 msgs per instance; 1,500 msgs → 15 instances). (B) — [AWS SQS scaling](https://docs.aws.amazon.com/autoscaling/latest/userguide/as-using-sqs-queue.html)
- AWS warns that scaling on queue length alone "does not account for the number of instances available" and "can add more instances than needed while the queue drains". (B) — [AWS SQS scaling](https://docs.aws.amazon.com/autoscaling/latest/userguide/as-using-sqs-queue.html)

### Inferences
- Calculator formula (derived): **N_in-flight = λ × S**, where S = mean service (hold) time per message incl. downstream call latency. Minimum consumers/threads c_min = ⌈λ × S / k⌉ where k = messages concurrently processed per consumer instance (prefetch/concurrency setting). This is the *stability floor* (ρ = 1); real sizing must divide by target utilisation: **c = ⌈λ S / ρ_target⌉**.
- For synchronous iFlows / Functions with outbound HTTP calls, S is dominated by the downstream latency, so concurrency (not CPU) is often the binding limit; use p95 latency for S if the calculator is to be conservative (practitioner choice, not sourced).
- Little's law also gives queue wait from depth: W_q = L_q / λ (time a newly arrived message will wait given a backlog L_q under steady drain).

### Gaps
- No vendor source opened that states Little's law explicitly for SAP Integration Suite, Logic Apps or Functions concurrency settings.

---

## 2. M/M/c, M/D/c (Erlang C), target utilisation, Kingman and burstiness

### Takeaway
Waiting time grows as ρ/(1−ρ), multiplied by variability (c_a² + c_s²)/2 (Kingman). For small consumer pools, 70-80% target utilisation is a sensible default; large pools can safely run higher (square-root staffing / economies of scale). Bursty arrivals (c_a > 1) require proportionally more headroom; deterministic service (M/D/c) roughly halves queueing delay vs exponential (A, via Kingman's variability term).

### Cited Findings
- Erlang C (probability an arrival waits), with R = λ/μ (offered load in Erlangs), ρ = R/n: P{Wq>0} = (Rⁿ/n!)·(1/(1−ρ))·π₀, π₀ = [Σ_{j=0}^{n−1} Rʲ/j! + Rⁿ/(n!(1−ρ))]⁻¹. (A) — [Technion QED lecture](https://serveng.technion.ac.il/files/Lectures/QED_lecture_Erlang_B_C.pdf)
- Square-root staffing: n ≈ R + β√R; β√R is "safety-staffing", analogous to safety stock. (A) — [Technion QED lecture](https://serveng.technion.ac.il/files/Lectures/QED_lecture_Erlang_B_C.pdf)
- Halfin-Whitt: as n → ∞, P(wait) → α(β) = [1 + β/h(−β)]⁻¹ (h = standard-normal hazard rate); utilisation ρ ≈ 1 − β/√n; conditional wait E[Wq | Wq>0] ≈ (1/√n)(1/(μβ)) — with n in the hundreds, about an order of magnitude below mean service time. (A) — [Technion QED lecture](https://serveng.technion.ac.il/files/Lectures/QED_lecture_Erlang_B_C.pdf)
- Economies of scale: idle fraction ~β/√R shrinks as load grows; example R = 225 reaches ~94% occupancy with 240 servers; R = 400, n = 411 gives good service at very high occupancy. (A) — [Technion QED lecture](https://serveng.technion.ac.il/files/Lectures/QED_lecture_Erlang_B_C.pdf)
- Kingman (G/G/1, "VUT equation"): mean queue wait ≈ V × U × T, with V = (c_a² + c_s²)/2 (squared coefficients of variation of inter-arrival and service times), U = ρ/(1−ρ), T = mean service time; published 1961 ("The single server queue in heavy traffic"); "generally very accurate, especially for a system operating close to saturation". (A) — [Wikipedia: Kingman's formula](https://en.wikipedia.org/wiki/Kingman%27s_formula); [Fabrico](https://www.fabrico.io/blog/kingman-formula-queue/)
- Numeric illustration (V = 0.781, T = 10 min): ρ = 80% → U = 4 → ~31 min; 90% → U = 9 → ~70 min; 95% → U = 19 → ~148 min. Going 80→90% more than doubles wait; 90→95% roughly doubles again. (C) — [Fabrico](https://www.fabrico.io/blog/kingman-formula-queue/)

### Inferences
- Mean wait M/M/c (standard textbook result, derived, not verified on an opened page): **W_q = C(c,R) / (cμ − λ)**; stability requires ρ = λ/(cμ) < 1.
- Kingman variability factor V reading for middleware: Poisson arrivals and exponential service → c_a² = c_s² = 1, V = 1 (M/M/1 exact). Fixed-cost transformations (M/D/1) → c_s² = 0, V = 0.5 (wait halved). Bursty batch-scheduled arrivals (e.g. ERP jobs releasing IDocs at once) → c_a² ≫ 1, V can be 2-5+ (illustrative, not sourced).
- Multi-server extension (Allen-Cunneen / Whitt approximation, standard, derived): W_q(G/G/c) ≈ W_q(M/M/c) × (c_a² + c_s²)/2. Practical calculator rule: compute Erlang C wait, multiply by V.
- Headroom rule (derived from U term): to keep the same W_q when V doubles, U = ρ/(1−ρ) must halve; e.g. ρ 0.80 (U=4) → ρ ≈ 0.667 (U=2). General: ρ_new = U_new/(1+U_new).
- Recommended target utilisation (synthesis, C-level confidence): small pools (c ≤ 4): 60-70%; medium (5-20): 70-80%; large (>50) with square-root staffing: 85-90%+ acceptable. The "70-80%" figure is widely used practice but I found no single authoritative source opened that prescribes it.

### Gaps
- Harchol-Balter textbook and Kleinrock were not opened; M/D/c exact results (no closed form; Crommelin) not verified.
- No vendor (Microsoft/AWS/Solace) source opened that states an explicit target utilisation percentage for consumers.

---

## 3. Backlog / queue drain and peak absorption (fluid model)

### Takeaway
Queues let you size for average rather than peak (Microsoft, B), but only if mean arrival < service capacity; otherwise the queue grows without bound. Drain time and spool size come from a simple deterministic fluid model (derived, standard).

### Cited Findings
- The queue buffers between task and service so requests "generated at highly variable rates" reach the service at the rate it can handle; capacity can be sized "for average load rather than peak load". (B) — [Azure Queue-Based Load Leveling](https://learn.microsoft.com/azure/architecture/patterns/queue-based-load-leveling)
- "If the average producer rate exceeds the consumer rate, the queue grows and latency increases"; monitor depth and scale consumers within safe limits, or shed load at the producer. (B) — [Azure Queue-Based Load Leveling](https://learn.microsoft.com/azure/architecture/patterns/queue-based-load-leveling)
- Autoscaling consumers without bounding aggregate downstream rate "only moves the overload to shared dependencies". Understand broker size quotas and retention limits. (B) — [Azure Queue-Based Load Leveling](https://learn.microsoft.com/azure/architecture/patterns/queue-based-load-leveling)
- Not suited when the caller needs a low-latency synchronous response. (B) — [Azure Queue-Based Load Leveling](https://learn.microsoft.com/azure/architecture/patterns/queue-based-load-leveling)
- Configure a maximum number of retries or elapsed time "to avoid creating backlogs that produce metastable failures". (B) — [AWS REL05-BP03](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_limit_retries.md)

### Inferences (derived fluid-model formulas)
- **Drain time**: T_drain = B / (μ_total − λ), valid only if μ_total > λ (μ_total = c × per-consumer rate). If μ_total ≤ λ the backlog never clears.
- **Backlog built by a peak**: peak of rate λ_p for duration T_p with capacity μ_total: B_peak = max(0, (λ_p − μ_total) × T_p).
- **Required queue/spool size** (messages): Q_req = B_peak × SF; in bytes: Q_req × avg message size × (1 + overhead). Suggested SF 1.5-2 for unknown burst variance (practitioner choice, not sourced).
- **Total recovery time** after peak start: T_p + B_peak / (μ_total − λ_base).
- **Max age of oldest message** ≈ B_peak / μ_total (FIFO); compare to message TTL / retention (e.g. iFlow JMS retention, Service Bus TTL) to ensure no expiry.
- **Required capacity to drain within a window D**: μ_total ≥ λ_base + B / D.
- Fluid model ignores stochastic variance; it underestimates waits near ρ → 1, so combine with section 2.

### Gaps
- Solace capacity planning docs (spool sizing) were not opened.

---

## 4. Pipeline / chain throughput, end-to-end latency, retries

### Takeaway
Chain throughput = min stage capacity (bottleneck); end-to-end latency = Σ(service + queue wait) per stage, where each queue wait is driven by that stage's ρ and variability. Retries add load multiplicatively, especially when stacked across layers — retry at one layer only (AWS, B).

### Cited Findings
- Little's law applies to networks and subnetworks, so it can be applied per stage and end-to-end. (A) — [Little 2011](https://people.cs.umass.edu/~emery/classes/cmpsci691st/readings/OS/Littles-Law-50-Years-Later.pdf)
- Anti-pattern: "Retrying at multiple layers of your application stack in a manner which compounds retry attempts... in a retry storm"; "implement retries at only one level". (B) — [AWS REL05-BP03](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_limit_retries.md)
- "When failures are caused by resource overload, retries can make things worse"; use exponential backoff, jitter and max retries; verify idempotency. (B) — [AWS REL05-BP03](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_limit_retries.md)
- Most queues give at-least-once delivery, so consumers must be idempotent; route poison messages to a DLQ. (B) — [Azure Queue-Based Load Leveling](https://learn.microsoft.com/azure/architecture/patterns/queue-based-load-leveling)

### Inferences (derived)
- **Throughput**: X_chain = min_i(μ_i × c_i) (for fan-out stage i with multiplier f_i: min_i(μ_i c_i / f_i)).
- **Latency**: W_e2e = Σ_i (S_i + W_q,i) + Σ network/broker hops; each W_q,i from Erlang C × V (section 2). Utilisation should be checked per stage, not just at the bottleneck — the stage with highest ρ·V dominates latency.
- **Retry load factor**: with per-attempt failure probability p and max r retries, expected attempts = (1 − p^(r+1)) / (1 − p); effective arrival rate λ_eff = λ × that factor. Across L layers each retrying r times on a hard failure, worst case attempts = (r+1)^L (e.g. 3 layers × 3 retries = 64×). The often-quoted "5 layers × 3 retries = 243×" example is from the Amazon Builders' Library article, which I could not open (redirected/blocked) — treat as unverified.
- Include retry delay in latency: W_retry ≈ Σ backoff intervals for messages that hit failures; affects SLA percentile, not mean much if p small.

### Gaps
- Amazon Builders' Library "Timeouts, retries, and backoff with jitter" could not be fetched (redirect to non-allowlisted domain).

---

## 5. Batch processing, chunking, Amdahl / Universal Scalability Law

### Takeaway
Adding parallel consumers gives diminishing and eventually negative returns. USL C(N) = N / (1 + σ(N−1) + κN(N−1)); Amdahl is κ = 0 (saturates at 1/σ); peak at N* = √((1−σ)/κ) (A). Fit σ, κ from 4-6 load-test points, then cap consumer count below N*.

### Cited Findings
- USL: C_p = p / (1 + σ(p−1) + κp(p−1)); σ = "contention-limited scalability due to serialization or queueing"; κ = "coherency-limited scalability due to inconsistent copies of data". (A) — [Gunther, arXiv 0808.1431](https://ar5iv.arxiv.org/html/0808.1431)
- κ = 0 reduces to Amdahl's law C_p = p/(1+σ(p−1)), which approaches asymptote 1/σ and is never retrograde. (A) — [Gunther](https://ar5iv.arxiv.org/html/0808.1431)
- Maximum at p* = √((1−σ)/κ); beyond p*, throughput is retrograde. (A) — [Gunther](https://ar5iv.arxiv.org/html/0808.1431)
- Primary application is "nonlinear statistical regression of performance data". (A) — [Gunther](https://ar5iv.arxiv.org/html/0808.1431)

### Inferences (derived)
- **Batch throughput**: records/s = (messages/s) × (records per message); per-message service time S(b) ≈ S_fixed + b × S_record, so per-record cost = S_fixed/b + S_record → larger chunks amortise fixed overhead (connection, mapping init, commit), bounded by max message size, memory, timeout and transaction size limits.
- Optimal chunk b: largest b such that S(b) < timeout × safety (e.g. 0.5) and payload < platform max message size.
- Consumer scaling: X(N) = X(1) × C(N); in calculator use effective capacity c_eff = C(c) not c. Contention sources in middleware: single DB/target system connection pool, ordered sessions/partition keys, shared locks, target API rate limits.
- Cap parallelism at min(N*, downstream rate limit / per-consumer rate, partitions/sessions available).

### Gaps
- No published σ/κ values found for SAP Integration Suite, Logic Apps or Azure Functions; must be measured.

---

## 6. Vendor rules (Azure, AWS, Confluent/Kafka, Solace)

### Takeaway
Vendor guidance converges on: measure single-unit throughput, divide target by it, over-provision for 1-2 years growth, and scale on backlog-per-worker relative to latency target.

### Cited Findings
- Kafka minimum partitions = max(t/p, t/c), t = target throughput, p = measured single-partition produce throughput, c = per-partition consume throughput. (B) — [Confluent docs](https://docs.confluent.io/kafka/operations-tools/partition-determination.html); [Confluent blog](https://www.confluent.io/blog/how-choose-number-topics-partitions-kafka-cluster/)
- Producer per-partition throughput depends on batching, compression, acks, replication factor; consumer throughput depends on application logic — measure. "One can produce at 10s of MB/sec on just a single partition". (B) — [Confluent blog](https://www.confluent.io/blog/how-choose-number-topics-partitions-kafka-cluster/)
- Over-partition: size for throughput expected "one or two years" out; adding partitions later breaks key-to-partition mapping (ordering). (B) — [Confluent blog](https://www.confluent.io/blog/how-choose-number-topics-partitions-kafka-cluster/); [Confluent docs](https://docs.confluent.io/kafka/operations-tools/partition-determination.html)
- Limits (2015, ZooKeeper-era): ~2-4k partitions per broker, low tens of thousands per cluster; replicating 1,000 partitions can add ~20 ms latency; rule of thumb partitions per broker ≤ 100 × b × r. Page notes these may not reflect current (KRaft) Kafka. (B, dated) — [Confluent blog](https://www.confluent.io/blog/how-choose-number-topics-partitions-kafka-cluster/)
- AWS: backlog per instance = ApproximateNumberOfMessages / InService instances; target = acceptable latency / avg processing time. (B) — [AWS SQS scaling](https://docs.aws.amazon.com/autoscaling/latest/userguide/as-using-sqs-queue.html)
- Azure: rate-limit consumers to protect targets; test under load; adjust number of queues and service instances. (B) — [Azure Queue-Based Load Leveling](https://learn.microsoft.com/azure/architecture/patterns/queue-based-load-leveling)

### Inferences
- Generalise Kafka rule to any competing-consumer system: **consumers = ⌈ target_rate × growth_factor / (per-consumer_rate × ρ_target) ⌉**, bounded by USL N* and ordering units (partitions / sessions).
- Consumer parallelism in Kafka cannot exceed partition count in a consumer group — partitions are a hard ceiling (common knowledge, not verified on an opened page in this session).

### Gaps
- Solace capacity planning / spool sizing docs not opened. Azure Service Bus / Event Hubs throughput-unit figures not gathered (other researchers may cover).

---

## 7. Growth projection

### Takeaway
Use compound growth: V_n = V_0 × (1+g)^n; design capacity = peak today × (1+g)^H × burst factor / ρ_target, with H = headroom horizon (Confluent suggests 1-2 years for partitioning, B).

### Cited Findings
- Confluent: plan partitions for expected throughput 1-2 years out. (B) — [Confluent blog](https://www.confluent.io/blog/how-choose-number-topics-partitions-kafka-cluster/)

### Inferences (derived)
- **Capacity_design = λ_peak,0 × (1+g)^H / ρ_target** (msgs/s), then apply section 2 variability adjustment.
- **Years of headroom left**: H = ln(Capacity_installed × ρ_target / λ_peak,0) / ln(1+g).
- Example: g = 20%/yr, H = 2 → ×1.44; at ρ_target 0.75 → required capacity ≈ 1.92 × today's peak.
- Combined safety-margin stack for a calculator (suggested, C): growth (1+g)^H × peak-to-average ratio (measured) × 1/ρ_target × V-adjustment; avoid double-counting burstiness in both peak ratio and V.

### Gaps
- No authoritative source opened prescribing a standard growth horizon for integration platforms beyond Confluent's 1-2 years.
