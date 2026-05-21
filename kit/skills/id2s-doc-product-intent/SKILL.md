---
name: id2s-doc-product-intent
description: Produce or update `product-intent.md` following the active ID2S workflow step.
---

# Skill: Document — Product intent (`id2s-doc-product-intent`)

## Goal

Complete `product-intent.md` in a **minimal but complete** way, with an actionable **Handoff pack** for `business-requirements.md`.

## Paths (from config)

- Read `id2s-kit.config.yaml`: `artifactsDir`, `agentReadyDir`, `documentationLanguage`.
- **Human write**: `{artifactsDir}/product-intent.md`
- **Read**: `{agentReadyDir}/product-intent.agent.yaml`, `_INDEX.yaml` (`active_step_bindings`, `workflow_state`)
- **Template**: `kit/templates/id2s/product-intent.md.template`

## Sources of truth (order)

1. `agent-ready-docs/id2s/_INDEX.yaml` and `product-intent.agent.yaml`
2. `docs/id2s/_INDEX.md` — aligned runtime state
3. `kit/steps/product-intent.step.yaml` — completion criteria (not duplicated in the index)
4. User interview; mark **TBD** with an explicit question when data is missing

## Versioning and sync

- On substantial edits, increment `current_version` and add a `versions` entry.
- Run `npm run sync-agent-ready -- docs/id2s/product-intent.md`

## Preconditions

- No prior artifacts required.
- If asked for requirements without product-intent, warn and offer a minimal Handoff first.

## Procedure

1. Confirm paths; open or create the destination from the template (use `documentationLanguage`).
2. **Summary + problem**: problem, user, trigger, brief as-is (no technical solution).
3. **Vision + objectives**: one vision sentence; top 3 objectives with metrics.
4. **Non-goals + stakeholders + constraints + risks + assumptions**.
5. **Handoff pack**: concrete bullets for step `business-requirements`.
6. Check: sentences are **observable** or **actionable** for the business.
7. Open questions (max 7); bump version + sync agent-ready.

## Completion criteria

Use `kit/steps/product-intent.step.yaml` for the final checklist when that step is active in `workflow_state`.
