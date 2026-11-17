# Volume & Performance Calculator

Interactive single-page tool that places one asynchronous interface on a scale of ranges (size, volume, complexity, SLA, growth) and checks it against platform components: SAP BTP Integration Suite, SAP Advanced Event Mesh (Solace), Azure Premium (APIM, Service Bus, Logic Apps, Functions) and Azure Data Factory.

Part of the *Interface Workload Envelope Framework*.

## Contents

| Path | What |
|---|---|
| `app/index.html` | The calculator (v7): flow inputs, scale tags, platform verdicts, middleware design builder, workload profile, Guide panel |
| `app/concepts.html` | Concepts presentation (15 slides), opened from the app |
| `app/evaluator-v0.3/` | Detailed technical evaluator for architects |
| `src/` | Source parts: `body.part` (markup + script), `style.part`, `guide.part`, `head-template.html` |
| `src/archive/` | Earlier versions (v1–v5) |
| `docs/middleware-capacity-ground-rules.md` | Research report: platform limits, formulas, confidence, items to measure |
| `docs/research_notes/` | Research notes behind the report |

## Build

```
python3 build.py
```

Edit `src/body.part` (not `app/index.html`), then rebuild. Open `app/index.html` in a browser; `concepts.html` must sit next to it.

## Confidence labels

A official vendor doc · B vendor blog / KBA / benchmark · C community · E empirical or assumed, to calibrate on your tenant.
