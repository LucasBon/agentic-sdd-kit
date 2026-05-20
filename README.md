# Intive Domain To Spec Driven Develop (ID2S)

Kit para **Domain to Spec Driven Develop** con workflows declarativos, documentos humanos en `docs/id2s/`, capa **agent-ready** en YAML, y **skills** de Cursor (roles configurables + wizards de documentos).

## Requisitos

- Node.js 18+
- Cursor (skills en `.cursor/skills/` tras bootstrap)

## Arranque rápido

1. Cloná el repo (o copiá `kit/` manteniendo la estructura relativa).
2. `npm install`
3. `npm run bootstrap` — crea `id2s-kit.config.yaml` si no existe, resuelve skills y prepara carpetas.

**No hace falta definir el workflow al instalar.** Si omitís `workflowFile` en config, el bootstrap genera un índice stub. Invocá **`id2s-role-project-manager`** (Sebastian) para elegir el workflow del catálogo y activarlo.

4. (Opcional) Con workflow activo:

```bash
npm run validate-workflows
npm run bootstrap
npm run sync-agent-ready -- --all
```

## Configuración (`id2s-kit.config.yaml`)

| Campo | Descripción |
|-------|-------------|
| `locale` | Idioma de trabajo (plantillas v1 en ES). |
| `workflowFile` | **Opcional.** Ruta al YAML del workflow (ej. `kit/workflows/green-field.v1.yaml`). |
| `artifactsDir` | Documentos humanos (default `docs/id2s/`). |
| `agentReadyDir` | Documentos agent-ready (default `agent-ready-docs/id2s/`). |
| `skillsTargetDir` | Destino de skills (default `.cursor/skills/`). |
| `kitVersion` | Versión informativa del kit. |

Migración: si tenés `sdd-kit.config.yaml`, el bootstrap lo migra a `id2s-kit.config.yaml` en el primer run.

## Workflows

- Catálogo: [`kit/workflows/`](kit/workflows/)
- Schema: [`kit/schema/workflow.schema.json`](kit/schema/workflow.schema.json)
- **Green-field v1**: 6 pasos producto + DDD liviano.

Sebastian (`id2s-role-project-manager`) ayuda a elegir workflow, actualizar `workflowFile` y re-ejecutar bootstrap.

## Documentos: humanos vs agent-ready

| Capa | Ubicación | Uso |
|------|-----------|-----|
| Humanos (fuente de verdad) | `docs/id2s/*.md` | Edición completa, versionado en frontmatter (`current_version`, `versions`). |
| Agent-ready | `agent-ready-docs/id2s/*.agent.yaml` | Contexto mínimo para agentes; `meta.source_version` alineado al doc humano. |

Tras editar un `.md`, ejecutá:

```bash
npm run sync-agent-ready -- docs/id2s/01-project-brief.md
# o
npm run sync-agent-ready -- --all
```

## Skills

Origen en [`kit/skills/`](kit/skills/). El bootstrap:

- **Roles** (`id2s-role-*`): plantilla + `config.yaml` → `SKILL.md` en `.cursor/skills/`.
- **Documentos** (`id2s-doc-*`): copia directa de `SKILL.md`.

### Roles (coaching)

| Skill | Persona / rol |
|-------|----------------|
| `id2s-role-project-manager` | **Sebastian** — workflow y navegación |
| `id2s-role-product-manager` | Product Manager |
| `id2s-role-business-analyst` | **Mariana** — Business Analyst |
| `id2s-role-project-leader` | Delivery / coordinación |
| `id2s-role-architect` | Software Architect |
| `id2s-role-technical-leader` | Tech Lead |
| `id2s-role-developer` | Developer |
| `id2s-role-quality-specialist` | QA/QE |
| `id2s-role-devops` | DevOps/SRE |

### Documentos (wizard)

`id2s-doc-project-brief`, `id2s-doc-vision-scope`, `id2s-doc-capability-discovery`, `id2s-doc-domain-model`, `id2s-doc-requirements`, `id2s-doc-architecture-adrs`

Personalizá roles editando `kit/skills/id2s-role-*/config.yaml` y volvé a correr bootstrap.

## Reglas de proyecto

`.cursor/rules/id2s-kit.mdc` — sincronizar agent-ready tras cambios en `docs/id2s/`.

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `npm run validate-workflows` | Valida YAML en `kit/workflows/`. |
| `npm run bootstrap` | Resuelve skills, plantillas, índices humano y agent-ready. |
| `npm run sync-agent-ready` | Sincroniza `.md` → `.agent.yaml`. |

## Referencia externa

[`example/`](example/) ilustra un patrón similar (BMAD) de skill plantilla + configuración; no forma parte del kit ID2S.

## Convenciones

- Prefijos: `id2s-role-*`, `id2s-doc-*`.
- Workflows referencian `doc_skill` con el nombre de carpeta de la skill.
- No versionar secretos en `id2s-kit.config.yaml`.
