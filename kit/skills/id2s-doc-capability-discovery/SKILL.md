---
name: id2s-doc-capability-discovery
description: Produce or update `03-capability-discovery.md` connecting vision to modeling.
---

# Skill: Document — Capability discovery (`id2s-doc-capability-discovery`)

## Goal

Prioritize **capabilities** and describe **P0 journeys** with enough detail for domain modeling.

## Paths

- Write: `{artifactsDir}/03-capability-discovery.md`
- Read: `{agentReadyDir}/03-capability-discovery.agent.yaml`, `_INDEX.yaml`
- Template: `kit/templates/id2s/03-capability-discovery.md.template`

## Preconditions

- `{artifactsDir}/02-vision-and-scope.md` must exist.

## Sources of truth (order)

1. Agent-ready for vision and brief.
2. Human artifacts `01`, `02`.
3. `_INDEX.yaml` / `_INDEX.md`
4. Workflow step `capability-discovery` for completion criteria

## Versioning and sync

- Bump `current_version` + `versions`; then `npm run sync-agent-ready -- docs/id2s/03-capability-discovery.md`

## Procedure

1. Capabilities with IDs (`C1`, …) and P0/P1/P2 priority.
2. Journey per **P0** capability.
3. Candidate integrations with confidence level.
4. **Open decisions** table.
5. **Handoff pack** toward domain model.
6. Sync agent-ready.

## Completion criteria

Active workflow step `capability-discovery` in `workflow_state`.
