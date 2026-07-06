# Reconciliation — NOT LAZY Brutalist-mono import

**Source:** `imports/notlazy-design-guide.tsx`, `imports/notlazy-tokens.css`, `imports/notlazy-mono-layer.css`, `imports/notlazy-helpers.tsx` (from `lazy-team/lazy-blog-front`, `src/app/brand/` and `src/shared/ui/theme/`).

## Carried into DESIGN.md / EXPERIENCE.md as-is

All ten color tokens (light + dark), the two-family type ramp (Space Grotesk / JetBrains Mono) and its full size scale, the 4px spacing grid and named layout constants, square-corner/2px-border geometry, and every inherited component listed in `DESIGN.md.Components` (Button, Field, Textarea, Select, Switch, Checkbox, RadioGroup, Label, FieldError, Avatar, Metric, Dot, Category, StatusBadge, Modal/ConfirmModal, Menu, Console, Loading/Spinner, InfoBox, ErrorMessage, Stat, Sparkline, UnderlineTabs, TabNav, Toaster).

## Deliberately NOT carried over

These exist in the source system but serve the *blog* product specifically and have no role in Gallery/Landing — dropping them is a scope decision, not an oversight:

- **DraftOverlay / unpublished-post cover** — blog-authoring concept (draft vs published posts). No equivalent in this suite.
- **Crepe (Milkdown) editor / Prose layer** — the blog's article-authoring surface. Neither Gallery nor Landing authors long-form prose.
- **Stepper (composer progress)** — tied to the blog's multi-step post composer. Not part of Ingest (Ingest has one step: pick photos → parse).
- **MatrixText effect** — used on the blog's error page and marketing flourishes. Not adopted here; ErrorMessage/Console are still inherited for a generic error state, but without the matrix decoration, to keep this suite's surface area smaller (ties to PRD's SM-C1 counter-metric).
- **GlitchText — reversed 2026-07-06.** Originally dropped for the same reason as MatrixText above. Reinstated after user feedback asked for the Landing to feel "more presentable, with animation" — now used once, on the Landing hero headline, in a one-shot (not looping) form. See `DESIGN.md.Components` and `EXPERIENCE.md` Component Patterns → Hero.
- **Comment threads, karma/rating Metric kind, byline patterns** — social/blog-specific; no user accounts or social features in this suite.

## Qualitative ideas noted but not (yet) actioned

- The source guide's own structure — a live, code-driving `/brand` storybook page — is a strong pattern for keeping this suite's design system honest as it evolves. Not actioned here (this is a UX spine, not an implementation), but worth flagging to `bmad-architecture` / the eventual `packages/ui` build: consider a similar living storybook rather than a static doc that drifts from the code.
