---
name: ask-doc-vision-scope
description: Produce or update `02-vision-and-scope.md` anchored to the project brief.
---

# Skill: Document — Vision and scope (`ask-doc-vision-scope`)

## Goal

Define **vision**, **measurable objectives**, **non-goals**, and **assumptions** aligned to the brief, with Handoff for capability discovery.

## Paths

- Write: `{artifactsDir}/02-vision-and-scope.md` (see `ask-kit.config.yaml`)
- Read: `{agentReadyDir}/02-vision-and-scope.agent.yaml`, `_INDEX.yaml`
- Template: `kit/templates/ask/02-vision-and-scope.md.template`

## Preconditions

- `{artifactsDir}/01-project-brief.md` must exist.
- If the brief is incomplete, complete `ask-doc-project-brief` first.

## Sources of truth (order)

1. Agent-ready for brief and vision if present.
2. `{artifactsDir}/01-project-brief.md`
3. `_INDEX.yaml` / `_INDEX.md` — runtime state
4. Workflow step `vision-scope` in `kit/workflows/` (completion criteria)

## Versioning and sync

- Increment `current_version` + `versions` on substantial changes.
- `npm run sync-agent-ready -- docs/ask/02-vision-and-scope.md`

## Procedure

1. Copy or update from template using `documentationLanguage`.
2. **One-sentence vision**: outcome for user and business.
3. **Top 3 objectives** with suggested metric and threshold.
4. **Non-goals**: at least 3 bullets.
5. **Personas/JTBD**: at least one P0 persona.
6. **Product assumptions and risks** with validation method.
7. **Handoff pack** toward capabilities.
8. Bump version + sync agent-ready.

## Completion criteria

Active workflow step `vision-scope` (see `workflow.ref` and `workflow_state` in `_INDEX.yaml`).
