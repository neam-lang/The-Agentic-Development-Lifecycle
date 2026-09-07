# The Agentic Development Lifecycle

**Read it: https://neam-lang.github.io/The-Agentic-Development-Lifecycle/**

A book proposing ADLC as the successor discipline to SDLC.

> SDLC assumed the bottleneck was producing code.
> ADLC assumes the bottleneck is verifying and directing it.

28 chapters across five parts, five appendices, and 117 diagrams.

## What is here

This repository holds the **published site only** — rendered HTML, one
stylesheet, and the diagrams. There is no build step and no dependency:
every page is static, every asset is local, and nothing is fetched at
runtime.

```
index.html      the landing page — the argument in six figures
chapters/       28 chapters
appendices/     A–E: patterns, templates, instrumentation, bibliography
assets/
  style.css     the design system
  diagrams/     the six hand-authored figures + editable draw.io sources
```

## How to read it

| If you are | Start at |
|---|---|
| An engineering leader deciding what to change | Chapter 26 — the 90-day plan |
| A practitioner | Part II — the four pillars |
| A researcher | Chapter 3 — the evidence, then Chapter 27 — open problems |

## On the evidence

Every empirical claim carries a grade — **[A]** peer-reviewed or RCT,
**[B]** preprint, **[C]** analyst research, **[D]** vendor or practitioner
claim — and resolves to a citation ledger. Where verification against a
primary source contradicted its secondary coverage, the correction is
recorded rather than quietly absorbed.

Claims about tool capabilities are point-in-time and dated in the text. The
field moves faster than print.

## Diagrams

Figures are rendered SVG, not images: they inherit the page's CSS custom
properties and re-colour with the light/dark toggle.
`assets/diagrams/adlc-diagrams.drawio` carries 111 editable pages for anyone
who wants to adapt them.
