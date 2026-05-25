---
name: ask-doc-domain-model
description: Produce or update `04-domain-model.md` (ubiquitous language and lightweight bounded contexts).
---

# Skill: Document — Domain model (`ask-doc-domain-model`)

## Goal

Stabilize **ubiquitous language** and candidate **bounded contexts** with a lite context map.

## Paths

- Write: `{artifactsDir}/04-domain-model.md`
- Read: `{agentReadyDir}/04-domain-model.agent.yaml`, `_INDEX.yaml`
- Template: `kit/templates/ask/04-domain-model.md.template`

## Preconditions

- `{artifactsDir}/03-capability-discovery.md` must exist.

## Sources of truth (order)

1. Agent-ready for capability discovery and prior artifacts.
2. Human artifacts `01`–`03`.
3. `_INDEX.yaml` / `_INDEX.md`
4. Workflow step `domain-model` for completion criteria

## Versioning and sync

- Bump version + `npm run sync-agent-ready -- docs/ask/04-domain-model.md`

## Procedure

1. **Glossary** from journeys.
2. Candidate **bounded contexts** (3–7).
3. **Lite context map**.
4. **Conceptual model** or PENDING.
5. **Traceability** capability → context.
6. **Handoff pack** toward requirements.
7. Sync agent-ready.

## Completion criteria

Active workflow step `domain-model` in `workflow_state`.
