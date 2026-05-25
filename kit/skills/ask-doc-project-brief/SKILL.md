---
name: ask-doc-project-brief
description: Produce or update `01-project-brief.md` following the active Agentic SDD Kit workflow step.
---

# Skill: Document — Project brief (`ask-doc-project-brief`)

## Goal

Complete `01-project-brief.md` in a **minimal but complete** way, with an actionable **Handoff pack** for `02-vision-and-scope.md`.

## Paths (from config)

- Read `ask-kit.config.yaml`: `artifactsDir`, `agentReadyDir`, `documentationLanguage`.
- **Human write**: `{artifactsDir}/01-project-brief.md`
- **Read**: `{agentReadyDir}/01-project-brief.agent.yaml`, `_INDEX.yaml`
- **Template**: `kit/templates/ask/01-project-brief.md.template`

## Sources of truth (order)

1. `agent-ready-docs/ask/_INDEX.yaml` and `01-project-brief.agent.yaml`
2. `docs/ask/_INDEX.md` — runtime state aligned with agent-ready
3. `kit/workflows/` + step definition for `project-brief` — completion criteria
4. User interview; mark **TBD** with explicit questions — do not invent stakeholders or metrics

## Versioning and sync

- On substantial edits, increment `current_version` and add a `versions` entry.
- Run `npm run sync-agent-ready -- docs/ask/01-project-brief.md`

## Preconditions

- No prior artifacts required.
- If the user wants to skip to vision without a brief, warn and offer a minimal Handoff only.

## Procedure

1. Confirm paths; open or create from template (use `documentationLanguage`).
2. **Executive summary**: 4–8 lines — problem, user, opportunity, expected outcome (no technical solution).
3. **Problem and context**: trigger “why now” + brief as-is.
4. **Users and segments**: table with at least one P0 row.
5. **Stakeholders, constraints, risks, assumptions**: no empty fields — use `PENDING: ...` with a question.
6. **Handoff pack**: concrete bullets (not generic).
7. **Quality check**: each sentence observable or actionable for the business.
8. Open questions (max 7); bump version + sync agent-ready.

## Completion criteria

Use the active workflow step `project-brief` from `kit/workflows/` (see `workflow.ref` in `_INDEX.yaml`).
