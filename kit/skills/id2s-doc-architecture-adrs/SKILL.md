---
name: id2s-doc-architecture-adrs
description: Produce or update `06-architecture-adrs.md` (C4 + ADRs) aligned to requirements and technical risks.
---

# Skill: Document — Architecture and ADRs (`id2s-doc-architecture-adrs`)

## Goal

Document **C4**, **integrations**, and **ADRs** with an executable handoff.

## Paths

- Write: `{artifactsDir}/06-architecture-adrs.md`
- Read: `{agentReadyDir}/06-architecture-adrs.agent.yaml`, `_INDEX.yaml`
- Template: `kit/templates/id2s/06-architecture-adrs.md.template`

## Preconditions

- `{artifactsDir}/05-requirements.md` must exist.

## Sources of truth (order)

1. Agent-ready for requirements, domain, capabilities.
2. Human artifacts `03`–`05` as needed.
3. `_INDEX.yaml` — `active_step_bindings` for `architecture-adrs`
4. Workflow step definition for completion criteria

## Versioning and sync

- Bump version + `npm run sync-agent-ready -- docs/id2s/06-architecture-adrs.md`

## Procedure

1. Summary with NFR **drivers**.
2. **C4 context** and **containers**.
3. **Integrations** with owner and risk.
4. **ADRs** with alternatives.
5. **Technical risks**.
6. **Handoff pack** to implementation.
7. Sync agent-ready.

## Completion criteria

Active workflow step `architecture-adrs` in `workflow_state`.
