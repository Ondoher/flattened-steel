# Optional Accessibility and Localization Considerations

Status: advisory. These considerations are not initialization acceptance
criteria, release gates, or a claim of accessibility conformance.

## Purpose

Keep a small set of low-cost accessibility and localization choices available
while Flat and Flat32 are extracted and reshaped, without importing the
consumer-product expectations of Music Notebook.

This is a curated adaptation of:

- `C:\dev\music-notebook\agents\topics\architecture\localization-accessibility.md`
- `C:\dev\music-notebook\agents\topics\architecture\accessibility.md`

Music Notebook is intended to be consumer-oriented. It therefore treats
accessibility and localization as first-class product concerns, and it combines
a rich text editor, semantic music embeds, dialogs, and third-party renderers.
This repository is not consumer-oriented. Music Notebook's Quill, MUI,
`modmod`, application-specific localization decisions, and consumer-level
coverage expectations are not requirements here.

## Scope

- This repository contains technical, research, and engineering software rather
  than a consumer application. The considerations below are optional engineering
  hygiene that may improve operator ergonomics, maintainability, or later reuse;
  they are not product commitments.
- Algorithm32 is a computation layer. Its results and internal behavior should
  remain locale-independent; these considerations apply only to its human-facing
  wrappers, diagnostics, applications, and documentation.
- Flat is a technical application surface. Selective improvements may make it
  easier for developers and operators to use without turning it into a consumer
  experience.
- Flat32 is an engineering testbed. Low-cost accessible behavior is worthwhile,
  but diagnostic density and stable technical terminology take priority over a
  polished consumer experience.

## Audience Boundary

Unless the repository's role changes, this guidance does not establish:

- a multilingual product requirement
- an accessibility conformance target
- comprehensive assistive-technology testing
- consumer-grade interaction or copy-polish requirements
- a reason to delay extraction, algorithm verification, diagnostics, or
  performance work

## Low-Cost Defaults

Use these when they fit naturally into work already being done:

- Prefer native semantic HTML for controls and document structure.
- Give controls visible labels or accessible names, make ordinary interactions
  keyboard-operable, and preserve a visible focus indicator.
- Make help or actions revealed on hover available from keyboard focus as well.
- Do not use color alone to communicate a meaningful state. A border, marker,
  pattern, label, or value change can provide the second signal.
- Treat WCAG 2.2 contrast guidance as a useful comparison reference when
  contrast matters. Its `4.5:1` normal-text and `3:1` large-text or meaningful
  non-text ratios describe AA thresholds, not repository acceptance criteria.
- Avoid unnecessary motion when the operating system requests reduced motion,
  particularly for atmospheric or decorative effects.
- Keep reusable interface prose separate from computation and shader code
  when doing so is inexpensive.
- Use `Intl` at the presentation boundary when displaying locale-sensitive
  numbers, dates, or units; keep stored values and Algorithm32 inputs/outputs in
  stable, locale-neutral formats.
- Allow reasonable layout expansion around labels instead of assuming all copy
  has its current English length.

References:

- [WCAG 2.2: Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#contrast-minimum)
- [WCAG 2.2: Non-text Contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast)

## Visual and GPU Surfaces

Flat and Flat32 rely on visual output that may be rendered through canvas or
WebGL. Apply the following distinction:

- Decorative atmosphere may be hidden from assistive technology when it adds
  no semantic information.
- A visualization that communicates a result or important state should have a
  concise accessible name or nearby textual summary when practical.
- DOM controls layered over a canvas should remain real, labeled controls rather
  than pointer-only hit regions.
- Important selection, validity, or comparison states should not depend on hue
  alone.

This does not require a complete non-visual reproduction of every atmospheric,
shader-debug, or experimental display. Revisit that scope if the intended
audience or product role changes.

## Localization Seams

Do not build a full localization system unless a technical application or later
reuse creates a concrete need. Avoid choices that would make one unnecessarily
expensive later:

- Keep canonical algorithm names, shader identifiers, compact scientific
  symbols, fixture keys, and diagnostic tokens stable rather than translating
  them as prose.
- When shared UI copy grows, introduce one small localization boundary instead
  of scattering framework-specific translation calls through computation code.
- Prefer full messages with named replacements over assembling sentences from
  translated fragments.
- Use `Intl.PluralRules` if pluralized interface messages become necessary.
- Keep visible labels, accessible names, descriptions, tooltips, and validation
  messages sourced together so translated variants do not drift apart.
- Make missing translation keys conspicuous during development while preserving
  a usable runtime fallback.
- Consider localized Markdown only if substantial help or guidance content is
  added.
- Send or interpret `Accept-Language` only if a server begins serving localized
  content; it is not needed merely to preserve this design seam.

## Proportionate Checks

For a new operator/developer control or meaningful visualization, consider:

1. What supplies its displayed text, and would that text be costly to replace?
2. Does it have a useful accessible name?
3. Can its ordinary action be completed with a keyboard?
4. Is important state communicated by something in addition to color?
5. If it is canvas/WebGL output, is it decorative or does it need a short
   textual summary?
6. Does locale-sensitive formatting remain confined to presentation code?

Automated checks and occasional keyboard or screen-reader spot checks can be
added when a surface becomes stable or broadly reused enough to justify them.
Any deferred issue may be recorded with the owning application or feature; it
does not block the extraction objective by default.
