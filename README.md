# Agentic SDD Kit

Kit para **Agentic Spec Driven Develop** con workflows declarativos, documentos humanos en `docs/ask/`, capa **agent-ready** en YAML, y **skills** de Cursor (roles configurables + wizards de documentos).

## Requisitos

- Node.js 18+
- Cursor (skills en `.cursor/skills/` tras bootstrap)

## Arranque rápido

1. Cloná el repo (o copiá `kit/` manteniendo la estructura relativa).
2. `npm install`
3. `npm run bootstrap` — crea `ask-kit.config.yaml` si no existe, resuelve skills y prepara carpetas.

**No hace falta definir el workflow al instalar.** Si omitís `workflowFile` en config, el bootstrap genera un índice stub. Invocá **`ask-role-project-manager`** (Sebastian) para elegir el workflow del catálogo y activarlo.

4. (Opcional) Con workflow activo:

```bash
npm run validate-workflows
npm run bootstrap
npm run sync-agent-ready -- --all
```

**Path B** (compose a custom workflow): `npm run list-catalog` → `npm run compose-workflow` → `npm run scaffold-step` (optional) → validate + bootstrap. Advance steps: `npm run advance-workflow -- --complete <step-id>`.

## Configuración (`ask-kit.config.yaml`)

| Campo | Descripción |
|-------|-------------|
| `agentConversationLanguage` | ISO 639-1 language for specialist coaching dialogue (e.g. `en`). |
| `documentationLanguage` | ISO 639-1 language for human artifacts under `artifactsDir`. |
| `workflowFile` | **Opcional.** Ruta al YAML del workflow (ej. `kit/workflows/green-field.v1.yaml`). |
| `artifactsDir` | Documentos humanos (default `docs/ask/`). |
| `agentReadyDir` | Documentos agent-ready (default `agent-ready-docs/ask/`). |
| `skillsTargetDir` | Destino de skills (default `.cursor/skills/`). |
| `kitVersion` | Versión informativa del kit. |

Migración: si tenés `id2s-kit.config.yaml` o `sdd-kit.config.yaml`, el bootstrap lo migra a `ask-kit.config.yaml` en el primer run.

## Workflows

- Catálogo: [`kit/workflows/`](kit/workflows/)
- Schema: [`kit/schema/workflow.schema.json`](kit/schema/workflow.schema.json)
- **Green-field v1**: 6 pasos producto + DDD liviano.

Sebastian (`ask-role-project-manager`) ayuda a elegir workflow, actualizar `workflowFile` y re-ejecutar bootstrap.

## Documentos: humanos vs agent-ready

| Capa | Ubicación | Uso |
|------|-----------|-----|
| Humanos (fuente de verdad) | `docs/ask/*.md` | Edición completa, versionado en frontmatter (`current_version`, `versions`). |
| Agent-ready | `agent-ready-docs/ask/*.agent.yaml` | Contexto mínimo para agentes; `meta.source_version` alineado al doc humano. |

Tras editar un `.md`, ejecutá:

```bash
npm run sync-agent-ready -- docs/ask/01-project-brief.md
# o
npm run sync-agent-ready -- --all
```

## Skills

Origen en [`kit/skills/`](kit/skills/). El bootstrap:

- **Roles** (`ask-role-*`): plantilla + `config.yaml` → `SKILL.md` en `.cursor/skills/`.
- **Documentos** (`ask-doc-*`): copia directa de `SKILL.md`.

### Roles (coaching)

| Skill | Persona / rol |
|-------|----------------|
| `ask-role-project-manager` | **Sebastian** — workflow y navegación |
| `ask-role-product-manager` | Product Manager |
| `ask-role-business-analyst` | **Mariana** — Business Analyst |
| `ask-role-project-leader` | Delivery / coordinación |
| `ask-role-architect` | Software Architect |
| `ask-role-technical-leader` | Tech Lead |
| `ask-role-developer` | Developer |
| `ask-role-quality-specialist` | QA/QE |
| `ask-role-devops` | DevOps/SRE |

### Documentos (wizard)

`ask-doc-project-brief`, `ask-doc-vision-scope`, `ask-doc-capability-discovery`, `ask-doc-domain-model`, `ask-doc-requirements`, `ask-doc-architecture-adrs`

Personalizá roles editando `kit/skills/ask-role-*/config.yaml` y volvé a correr bootstrap.

## Reglas de proyecto

`.cursor/rules/ask-kit.mdc` — sincronizar agent-ready tras cambios en `docs/ask/`.

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `npm run validate-workflows` | Valida YAML en `kit/workflows/`. |
| `npm run bootstrap` | Resuelve skills, plantillas, índices humano y agent-ready. |
| `npm run sync-agent-ready` | Sincroniza `.md` → `.agent.yaml`. |

## Referencia externa

[`example/`](example/) ilustra un patrón similar (BMAD) de skill plantilla + configuración; no forma parte del Agentic SDD Kit.

## Convenciones

- Prefijos: `ask-role-*`, `ask-doc-*`.
- Workflows referencian `doc_skill` con el nombre de carpeta de la skill.
- No versionar secretos en `ask-kit.config.yaml`.
