---
name: id2s-doc-system-design
description: Produce or update `system-design.md` (system design and ADRs) following the active ID2S workflow step.
---

# Skill: Document — System design (`id2s-doc-system-design`)

## Goal

Complete `system-design.md` with C4 (context/containers), integrations, indexed ADRs, and **Handoff pack** for implementation.

## Paths (from config)

- **Human write**: `{artifactsDir}/system-design.md`
- **Required read**: `{artifactsDir}/business-requirements.md` and agent-ready
- **Template**: `kit/templates/id2s/system-design.md.template`

## Sources of truth (order)

1. `business-requirements.md` — FR/NFR/BR and business handoff
2. `_INDEX.yaml` — `active_step_bindings` for `system-design`
3. `kit/steps/system-design.step.yaml` — completion criteria
4. Technical decisions: proposed/accepted ADR status; do not assume stack without validation

## Versioning and sync

- Bump `current_version` on substantial changes.
- `npm run sync-agent-ready -- docs/id2s/system-design.md`

## Preconditions

- Requires `business-requirements.md` with usable handoff.
- If critical NFRs are missing, return to the prior step with concrete questions.

## Procedure

1. Architecture summary (6–12 lines) anchored to business drivers.
2. **C4 context** and **containers** with responsibilities.
3. **Integrations** and high-level contracts.
4. **ADRs** with context, decision, consequences.
5. **Technical risks** and initial debt.
6. **Handoff pack** (modules, APIs, data, smoke tests).
7. Bump version + sync.

## Completion criteria

Use `kit/steps/system-design.step.yaml` when that step is active in `workflow_state`.
