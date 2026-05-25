---
name: ask-doc-business-requirements
description: Produce or update `business-requirements.md` following the active Agentic SDD Kit workflow step.
---

# Skill: Document — Business requirements (`ask-doc-business-requirements`)

## Goal

Complete `business-requirements.md` with BR-xxx, testable FR-xxx, minimal glossary, P0/P1 capabilities, and **Handoff pack** for `system-design.md`.

## Paths (from config)

- **Human write**: `{artifactsDir}/business-requirements.md`
- **Required read**: `{artifactsDir}/product-intent.md` and its `.agent.yaml`
- **Template**: `kit/templates/ask/business-requirements.md.template`

## Sources of truth (order)

1. `product-intent.md` / agent-ready (no contradictions)
2. `_INDEX.yaml` — `active_step_bindings` for `business-requirements`
3. `kit/steps/business-requirements.step.yaml` — completion criteria
4. User interview; do not invent rules — record ambiguities explicitly

## Versioning and sync

- Bump `current_version` on substantial changes.
- `npm run sync-agent-ready -- docs/ask/business-requirements.md`

## Preconditions

- Requires existing, coherent `product-intent.md`.
- If missing, warn and complete minimal product-intent inputs first.

## Procedure

1. Read product-intent; validate problem/scope alignment.
2. **Validated assumptions** and **capabilities** P0/P1.
3. **Glossary** — critical terms without ambiguous synonyms.
4. **FR-xxx** with testable acceptance criteria per P0 capability.
5. **BR-xxx** referencing glossary; separate rule from implementation.
6. **Business NFRs** with threshold or verification method.
7. **Edge cases** and **open ambiguities** (do not resolve silently).
8. **Handoff pack** for architecture.
9. Bump version + sync.

## Completion criteria

Use `kit/steps/business-requirements.step.yaml` when that step is active in `workflow_state`.
