# Agentic SDD Kit

Kit for **Agentic Spec Driven Develop**: workflows, step catalog, templates, agent-ready layer, and Cursor skills.

## Layers

| Layer | Location | Purpose |
|-------|----------|---------|
| **Steps** | `kit/steps/*.step.yaml` | Canonical reusable step (objective, role, inputs, outputs) |
| **Workflows** | `kit/workflows/*.yaml` | Composition: legacy (`steps` inline) or v2 (`stages` + refs) |
| **Artifacts** | `docs/ask/*.md` | Human source of truth |
| **Agent-ready** | `agent-ready-docs/ask/*.agent.yaml` | Structured context for agents |
| **Indices** | `_INDEX.md` / `_INDEX.yaml` | Runtime workflow state (Sebastian); definitions stay in workflow/steps |

## Minimal workflow (v2)

`kit/workflows/green-field-minimal.v2.yaml` — 3 documents:

1. `product-intent.md` (Product Manager)
2. `business-requirements.md` (Business Analyst)
3. `system-design.md` (Architect)

## Commands

```bash
npm run validate-workflows   # steps + workflows
npm run bootstrap            # skills, templates, indices
npm run sync-agent-ready -- docs/ask/<file>.md
```

## Project configuration

At repo root, `ask-kit.config.yaml`:

```yaml
agentConversationLanguage: en
documentationLanguage: en
workflowFile: kit/workflows/green-field-minimal.v2.yaml
artifactsDir: docs/ask
agentReadyDir: agent-ready-docs/ask
```

- **Orchestrator**: `ask-role-project-manager` (Sebastian) — static `SKILL.md`, updates indices.
- **Domain specialists**: `ask-role-*` (coach) and `ask-role-*-delivery` — from `role-agent.SKILL.md.template` and `role-agent-delivery.SKILL.md.template` (same `config.yaml` per role).
- **Engagement profile**: each step sets `engagement_profile: coach | delivery` in `kit/steps/<id>.step.yaml` (default `coach`). Index exposes `assigned_role_skill` for the skill to invoke.

| Script | Purpose |
|--------|---------|
| `npm run list-catalog` | List kit + project workflows and steps |
| `npm run compose-workflow` | Path B — compose `workflows/<id>.yaml` from step ids |
| `npm run scaffold-step` | Path B — new project step + template + doc skill stub |
| `npm run advance-workflow` | Advance `_INDEX` after a step is completed |
| `npm run set-step-profile` | Switch active step to `coach` or `delivery` profile |

Legacy: `kit/workflows/green-field.v1.yaml` (inline steps). Prefer `green-field.v2.yaml`.
