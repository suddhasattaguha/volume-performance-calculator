# Statistical rules for estimating peak load of business integration traffic (ERP, B2B/EDI, A2A)

Confidence codes: A = standard/academic, B = vendor sizing guide, C = practitioner, E = empirical/derived from published data. "ASSUMPTION" = not sourced, it is the researcher's engineering judgement or arithmetic, and should be labelled as such in the report.

URLs opened (fetched successfully): Cisco Traffic Analysis (TA_ISD), IBM/SAP user-based sizing PDF (erp_sap_user_based.pdf), Wikipedia Diversity factor, SAP Community white paper on user/workload sizing (2023), HCL IDoc structural format, Orderful peak retail blog, Celigo Prime Day 2026 blog, Adobe Cyber Monday 2025 press release, O'Reilly "Sun Performance and Tuning" HTTP rate page.
Opened but no usable content: IBM SAP transaction-based sizing PDF (no machine-readable text), Scribd PI Quick Sizer (paywalled summary only), SAP Community "Workload fluctuations, sizing..." blog (site error). Blocked by allowlist: rfc-editor.org RFC 4648 (both HTML and TXT).

## Q1. Peak-hour share of daily volume (human-driven vs event-driven vs batch); diurnal curves; SAP sizing assumptions; telecom busy hour

### Takeaway
The best-documented anchor is telecom: the busy hour carries about 15-20% of daily traffic, with 17% the usual planning value (A/B). SAP sizing does not give a "peak = X% of daily" figure directly. It sizes for the peak hour inside a fixed working window (08:00-16:00 in the IBM/SAP method, so 8 hours), which implies a flat-window peak share of at least 1/8 = 12.5% before any peak factor.

### Cited Findings
- Telecom rule of thumb: "the busy hour of any given day accounts for approximately 15 to 20 percent of the traffic for that day"; planners "generally use 17 percent of the total daily traffic to represent the peak hour traffic." (B, widely used A-derived practice) — [Cisco, Traffic Analysis for Voice over IP](https://www.cisco.com/c/en/us/td/docs/ios/solutions_docs/voip_solutions/TA_ISD.html)
- Business diurnal shape: "Business traffic usually peaks around 10:00 a.m. to 11:00 a.m. and 2:00 p.m. to 3:00 p.m." (B) — [Cisco TA_ISD](https://www.cisco.com/c/en/us/td/docs/ios/solutions_docs/voip_solutions/TA_ISD.html)
- Busy-hour measurement methods: Daily Peak Period (highest volume measured in a day) and Fixed Daily Measurement Interval (measure only during predetermined peak periods). (B) — [Cisco TA_ISD](https://www.cisco.com/c/en/us/td/docs/ios/solutions_docs/voip_solutions/TA_ISD.html)
- ITU-T E.492 (as cited by Cisco): "the normal load traffic intensity for the month is defined as the fourth highest daily peak traffic." Useful as a design-day rule (design for about the 4th-busiest day, not the absolute maximum). (A, via B) — [Cisco TA_ISD](https://www.cisco.com/c/en/us/td/docs/ios/solutions_docs/voip_solutions/TA_ISD.html)
- SAP/IBM sizing method: sizing targets the peak hour, "the busiest hour of activity from an information-processing standpoint"; "Typically, the peak hour occurs somewhere between 8:00 a.m. and 6:00 p.m., but this can vary." Default working hours for online and batch: 08:00 to 16:00. Some organisations have overnight batch peaks, which need quantity-structure (throughput) sizing instead of user-based sizing. (B) — [IBM, SAP user-based sizing](https://public.dhe.ibm.com/software/mktsupport/techdocs/erp_sap_user_based.pdf)
- The same method assumes that sizing for acceptable response time at peak also covers workload outside the peak. Target CPU utilisation: 33% average for user-based (dialog) sizing and 65% for quantity-structure-based sizing. The roughly 2x gap acts as built-in headroom for intra-hour peaks in interactive load. (B) — [IBM, SAP user-based sizing](https://public.dhe.ibm.com/software/mktsupport/techdocs/erp_sap_user_based.pdf)
- SAP Quick Sizer inputs are concurrent users per module plus object counts and line items per hour. Accuracy is "estimated at 20%". The calculation excludes batch, print and **interfaces**. (C) — [SAP Community white paper, sizing based on users and workloads, part 1](https://blogs.sap.com/2023/05/11/white-paper-sap-sizing-solution-based-on-users-and-workloads-part-1/)
- Web load follows the working hours of the dominant time zone, with other regions raising the curve earlier or later (qualitative; the figure was not readable). (C) — [O'Reilly, Sun Performance and Tuning, Real-World HTTP Rate Changes](https://www.oreilly.com/library/view/sun-performance-and/0130952494/0130952494_ch04lev1sec5.html)

### Inferences
- Human-driven office traffic in one region: a peak-hour share of 15-20% (17% default) is defensible by analogy to the telecom busy hour. The flat-window floor is 12.5% (8-hour day) or 11% (9-hour day). Peak-hour factor relative to the window average is about 17% / 12.5% = 1.36. (ASSUMPTION built on A/B sources)
- Application/event-driven traffic (machine-to-machine, IoT, webshop orders) runs 24 hours. A flat 24-hour curve gives 4.2% per hour. Consumer-facing event traffic still shows a diurnal peak; Adobe's Cyber Monday data implies about 6.7% of daily volume in a peak hour (see Q2). Range to use: 5-10%. (E/ASSUMPTION)
- Scheduled batch: the peak-hour share depends on the job window, not on statistics. If a batch transfers its daily volume in a 1-hour window, the share is 100%. Rule: share = 1 / (window length in hours), applied per interface. (ASSUMPTION, deterministic)
- Integration traffic is a derivative of ERP transactions: an A2A message produced on save inherits the human diurnal curve, while output-determination batch (e.g. RSNAST00 or IDoc collection jobs) moves it into batch windows. (ASSUMPTION)

### Gaps
- No official SAP Quick Sizer value for "peak hour = X% of daily throughput" could be retrieved. Quick Sizer help on throughput sizing (processing period, peak percentage) is behind SAP login. The SAP Community blog on workload fluctuations failed to load.
- No SAP PI/PO or Integration Suite sizing guide text with peak assumptions was retrieved (the Scribd PI Quick Sizer was paywalled).
- No published diurnal curves specific to EDI/B2B VAN traffic were found.

## Q2. Peak-day factors (month-end, quarter-end, seasonal, Black Friday); EDI/B2B peak-to-average; weekday patterns

### Takeaway
Hard published ratios are scarce. Usable empirical anchors: Cyber Monday 2025 was about 3.4x an average holiday-season day of US online spend, and its peak hours ran at about 1.6x that day's average rate. Amazon Prime Day 2026 orders were 1.38x the pre-event baseline per day (up to about 1.6x on day 4). EDI providers publish only qualitative "surge" language.

### Cited Findings
- Cyber Monday 2025 US online spend was $14.25bn. "In the peak hours of 8 pm to 10 pm, consumers spent $16 million every minute." Season (Nov 1-Dec 31) expected at $253.4bn. (E) — [Adobe newsroom, Dec 2025](https://news.adobe.com/news/2025/12/adobe-cyber-monday-hits-record)
- Prime Day 2026 (as observed by an iPaaS vendor): 13.9M orders, "averaging 3.5 million orders per day, a 37.6 percent increase over the pre-event baseline"; daily volumes rose from 2.81M (day 1) to 4.08M (day 4). (C/E) — [Celigo blog](https://www.celigo.com/blog/prime-day-2026-peak-season/)
- EDI provider commentary is qualitative only: during peak seasons "Order volumes surge, fulfillment timelines tighten..." with no multipliers. (C) — [Orderful blog](https://www.orderful.com/blog/why-peak-retail-seasons-expose-legacy-edi-limits)
- ITU-T E.492 design-day concept (4th-highest daily peak in the month). (A via B) — [Cisco TA_ISD](https://www.cisco.com/c/en/us/td/docs/ios/solutions_docs/voip_solutions/TA_ISD.html)

### Inferences (derived arithmetic, label E)
- Cyber Monday vs average season day: 14.25 / (253.4/61 = 4.15) is about **3.4x**. The season itself sits above the annual average, so peak day vs annual average day is likely higher than 3.4x, but this is not quantified.
- Cyber Monday intra-day: day-average rate = 14.25bn/1440 min = $9.9M/min, against a peak of $16M/min. Peak-hour factor is about **1.6x**, so the peak-hour share of the day is about 16 x 60 / 14,250, or **6.7%**. This is a 24-hour consumer curve, not an office curve.
- Prime Day: daily peak factor **1.4-1.6x** baseline for B2C order intake. Downstream B2B/EDI (POs to suppliers, ASNs) is typically lagged and smoothed. (ASSUMPTION)
- Practitioner planning values often used for ERP finance and logistics (month-end close 2-3x, quarter/year-end 3-5x, retail holiday 3-5x, Black Friday/Cyber week 5-10x on B2C order APIs) could **not** be verified in this session and should be presented as ASSUMPTION (C-unverified) if used.

### Gaps
- No EDI VAN/network statistics (e.g. SPS Commerce, OpenText, IBM Sterling) with weekday or month-end ratios were found.
- No published month-end/quarter-end multipliers for SAP document volumes (FI postings, billing) were found.

## Q3. Working days per month; weekly patterns

### Takeaway
SAP/IBM sizing uses a 40-hour week and regional working-days-per-year defaults: Europe 200, Americas 250, Asia/Pacific 300. For monthly-to-daily conversion, 250/12 is about 21 days/month (Americas), 200/12 is about 17 (Europe default, conservative because it concentrates volume), and 300/12 = 25 (APJ).

### Cited Findings
- Working days per year: "Asia/Pacific 300, Americas 250, Europe 200"; working hours 08:00-16:00; activity categories based on "a working week of 40 hours." (B) — [IBM, SAP user-based sizing](https://public.dhe.ibm.com/software/mktsupport/techdocs/erp_sap_user_based.pdf)
- Business traffic has two daily humps (10-11 and 14-15). (B) — [Cisco TA_ISD](https://www.cisco.com/c/en/us/td/docs/ios/solutions_docs/voip_solutions/TA_ISD.html)

### Inferences
- Standard calendar arithmetic: 52 weeks x 5 days = 260, minus about 8-12 public holidays, gives about 248-252, so about **21 working days/month** (ASSUMPTION, consistent with the Americas 250).
- Daily = Monthly / 21 for office-driven flows, Monthly / 30.4 for 24x7 event flows. Using a lower day count (e.g. 17-20) is a conservative way to absorb weekday skew (e.g. Monday order backlogs). (ASSUMPTION)

### Gaps
- No sourced weekday distribution (e.g. Monday share of weekly EDI orders) was found.

## Q4. Global aggregation across time zones (follow-the-sun); coincidence/diversity factor

### Takeaway
Electrical load theory gives the formal tool. Global peak = coincidence factor x sum of regional peaks, where coincidence factor CF = 1/diversity factor (and DF >= 1). Numeric CF values for integration traffic are not published. They must be computed by summing time-shifted regional curves.

### Cited Findings
- Diversity factor = sum of individual non-coincident maximum loads / maximum demand of the whole system. It "recognizes that the whole load does not equal the sum of its parts"; DF > 1; "The coincidence factor is the reciprocal of the diversity factor" (IEC defines coincidence/simultaneity factor this way). Example values: heat networks with more than 40 dwellings about 0.62 (space heating), domestic hot water below 0.1 and falling with more connections. (A, encyclopedic summary of IEC usage) — [Wikipedia, Diversity factor](https://en.wikipedia.org/wiki/Diversity_factor)
- Web traffic: the dominant time zone sets the peak; other regions extend the curve "through the night". (C) — [O'Reilly, Sun Performance and Tuning](https://www.oreilly.com/library/view/sun-performance-and/0130952494/0130952494_ch04lev1sec5.html)

### Inferences (method plus worked illustration, ASSUMPTION)
- Method: model each region r as daily volume V_r x hourly profile p_r(h) (e.g. 17% peak hour, 8-10 h window), shift by UTC offset, sum per UTC hour, and take the max. Global peak-hour share = max_h(sum V_r p_r(h)) / sum V_r. CF = global peak / sum of regional peaks.
- Illustration: three equal regions (EMEA, Americas, APJ) about 8 hours apart, each with an 8-hour flat window (12.5%/h). Windows barely overlap, so global peak-hour share is about 12.5% x 1/3, roughly **4.2-5%** of global daily volume, and CF is about 0.33-0.4. Typical skewed estates (e.g. 60% EMEA, 30% Americas with 2-3 h overlap, 10% APJ) give a global share of roughly **9-12%** and CF of about 0.6-0.8. These are worked numbers, not published values.
- Caveat: centrally scheduled jobs (global close, master-data replication at 00:00 UTC) break diversity and must be added as coincident loads (CF = 1).

### Gaps
- No published coincidence factor values for enterprise/integration message traffic were found.

## Q5. User-to-transaction extrapolation (Quick Sizer user categories, dialog steps, concurrency)

### Takeaway
SAP's user categories are documented (B): Low 10 dialog steps/h (think time 360 s), Medium 120 DS/h (30 s), High 360 DS/h (10 s), on a 40-hour week. Quick Sizer uses concurrent (not named) users. No official named-to-concurrent ratio was found.

### Cited Findings
- Low/occasional user: about 400 dialog steps/week, "ten dialog steps per hour or one every six minutes". Medium (accountant/clerk): 4,800/week, "120 dialog steps per hour or one every 30 seconds". High (data entry/telesales/power): 14,400/week, "360 dialog steps an hour or on every 10 seconds". Think times: power 10 s, standard 30 s, occasional 360 s. (B) — [IBM, SAP user-based sizing (quoting Quick Sizer help)](https://public.dhe.ibm.com/software/mktsupport/techdocs/erp_sap_user_based.pdf)
- Quick Sizer sizes on "the number of concurrent users in each module"; accuracy is about 20%; interfaces are excluded. (C) — [SAP Community white paper 2023](https://blogs.sap.com/2023/05/11/white-paper-sap-sizing-solution-based-on-users-and-workloads-part-1/)

### Inferences (ASSUMPTION)
- Dialog steps are not business documents. A document (e.g. sales order) typically needs about 5-15 dialog steps, so a medium user produces roughly 8-24 documents/h at most. Interface messages per document = fan-out (e.g. order leads to confirmation, delivery, invoice, and EDI ORDRSP/DESADV/INVOIC, about 3-6 messages). Messages/h is about concurrent users x DS/h / DS-per-doc x fan-out. These coefficients are not sourced.
- Extrapolation from a reference country: Global volume is about V_ref x (users_global / users_ref), or the ratio of a revenue/order driver. Accuracy is no better than Quick Sizer's ±20% and likely ±50% for interfaces.

### Gaps
- No sourced named-to-concurrent user ratio. Practitioner values (often 10-30%) were not verified.
- No sourced "transactions per user per day" norms.

## Q6. Burstiness: minute-level peak vs hour average; Poisson vs bursty

### Takeaway
No integration-specific source was found. Poisson arithmetic gives a lower bound on the 1-minute peak factor. Real enterprise traffic is burstier (batch releases, polling, retries), so a design factor of 2-3x on the peak-hour average per minute is an engineering assumption.

### Cited Findings
- SAP/IBM user-based sizing targets about 33% average CPU on dialog, against 65% for throughput sizing. This implicitly reserves about 2-3x headroom for short-term peaks in interactive load. (B) — [IBM, SAP user-based sizing](https://public.dhe.ibm.com/software/mktsupport/techdocs/erp_sap_user_based.pdf)

### Inferences (mathematical, A-grade arithmetic but ASSUMPTION in application)
- For Poisson arrivals with mean λ per minute, the 99.9th-percentile minute is about λ + 3.1√λ. At λ = 100/min (6,000/h), the peak minute is about 131 (1.3x). At λ = 10/min, it is about 21 (2.1x). At λ = 1,000/min, it is about 1,098 (1.1x). So the burst factor shrinks with volume under randomness, while batch-triggered bursts do not shrink.
- Batch release bursts: if a job releases N messages at once, the minute peak equals N regardless of hourly mean. Model batch separately from stochastic traffic.

### Gaps
- No empirical minute-to-hour peak ratios for EDI/A2A middleware were found. Self-similar traffic literature (Leland et al.) was not retrieved in this session.

## Q7. Message size overheads (JSON vs XML vs CSV, IDoc record sizes, base64, envelopes)

### Takeaway
Only partially sourced. The IDoc data segment payload is a maximum of 1000 bytes (B/C). Base64 expands data by 4/3 (RFC 4648 standard; source fetch was blocked, so this needs a citation from the RFC in the final report). Format ratios (XML vs JSON vs CSV) remained unsourced.

### Cited Findings
- "IDoc data segments are a maximum of 1000 bytes in length and generally only contain CHAR fields." The control record contains IDoc ID, sender, receiver, IDoc type and EDI attributes (no lengths given). (C) — [HCL DevOps Test Hub, IDoc structural format](https://help.hcl-software.com/devops/test/hub/10.1/docs/topics/c_pack_sapr3_IDoc_Structural_Format.html)

### Inferences / known-standard values (need citation; ASSUMPTION until verified)
- Base64 (RFC 4648 §4): each 24-bit input group becomes 4 output characters, so size x 4/3 (+33%), plus padding up to 2 characters. MIME (RFC 2045) limits lines to 76 characters plus CRLF, adding about 2.6% more (total about 1.37x). The RFC page was blocked, so cite [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648) and RFC 2045 directly.
- IDoc flat record: the EDI_DD40 data record is commonly cited as 1063 characters (63-character admin section plus 1000 SDATA) and EDI_DC40 as 524 characters. **Not verified in this session.** Check the SAP Help pages for EDI_DD40/EDI_DC40 (search result: [help.sap.com EDI_DD data record](https://help.sap.com/saphelp_470/helpdata/en/b5/9c487ffc6f11d1bf5a0000e8a7386f/content.htm), not opened).
- IDoc-XML inflates the flat size considerably, because every field gets an opening/closing tag. Typical ratios are about 2-5x depending on field-name length and fill rate (unsourced).
- JSON vs XML: JSON omits closing tags, so it is typically about 20-40% smaller than equivalent XML; CSV is smaller again, with field names only in the header (unsourced practitioner ranges, ASSUMPTION).
- Envelopes: SOAP envelope plus WS-Addressing headers, AS2 MIME/S/MIME signatures and SAP XI message headers each add fixed bytes (KB range) per message. No sourced values.

### Gaps
- RFC 4648 and RFC 2045 text could not be fetched (allowlist block). Exact EDI_DC40/EDI_DD40 lengths were not confirmed from SAP documentation. No benchmark study on XML/JSON/CSV size ratios was retrieved.
