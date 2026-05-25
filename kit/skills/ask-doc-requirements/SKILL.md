---
name: id2s-doc-requirements
description: Produce or update `05-requirements.md` (FR/NFR/rules) traceable to capabilities and glossary.
---

# Skill: Document — Requirements (`id2s-doc-requirements`)

## Goal

**Prioritized**, **testable**, **traceable** requirements linked to capabilities and glossary.

## Paths

- Write: `{artifactsDir}/05-requirements.md`
- Read: `{agentReadyDir}/05-requirements.agent.yaml`, `_INDEX.yaml`
- Template: `kit/templates/id2s/05-requirements.md.template`

## Preconditions

- `{artifactsDir}/04-domain-model.md` must exist.

## Sources of truth (order)

1. Agent-ready for domain, capabilities, vision.
2. Human artifacts `02`–`04`.
3. `_INDEX.yaml` / `_INDEX.md`
4. Workflow step `requirements` for completion criteria

## Versioning and sync

- Bump version + `npm run sync-agent-ready -- docs/id2s/05-requirements.md`

## Procedure

1. Document scope section.
2. **FR-xxx** with testable acceptance criteria.
3. **BR-xxx** using glossary terms.
4. **NFR-xxx** with threshold or verification method.
5. Minimal **traceability** matrix.
6. **Handoff pack** toward architecture.
7. Sync agent-ready.

## Completion criteria

Active workflow step `requirements` in `workflow_state`.
