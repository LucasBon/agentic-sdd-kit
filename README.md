# intive-agent-driven-sdd

Kit para **Spec-Driven Development** con workflows declarativos, plantillas **agent-ready** y **skills** de Cursor (roles + creación de documentos), orientado a un flujo **producto + DDD liviano** en escenarios **green-field**.

## Requisitos

- Node.js 18+ (para bootstrap y validación de workflows)
- Cursor (para usar skills en `.cursor/skills/`)

## Arranque rápido

1. Cloná el repo (o copiá la carpeta `kit/` a tu monorepo consumidor manteniendo la misma estructura relativa).
2. En la raíz del repo consumidor, ajustá `sdd-kit.config.yaml` (si no existe, el bootstrap lo crea desde el ejemplo en `kit/bootstrap/sdd-kit.config.example.yaml`).
3. Instalá dependencias del validador:

```bash
npm install
```

4. Validá workflows contra el schema:

```bash
npm run validate-workflows
```

5. Sincronizá skills y generá artefactos iniciales + índice:

```bash
npm run bootstrap
```

Opciones útiles:

```bash
node kit/bootstrap/bootstrap.mjs --force
node kit/bootstrap/bootstrap.mjs --dry-run
node kit/bootstrap/bootstrap.mjs --repo-root /ruta/al/repo
```

## Configuración (`sdd-kit.config.yaml`)

| Campo | Descripción |
|-------|-------------|
| `locale` | Idioma de trabajo (plantillas v1 en ES). |
| `workflowFile` | Ruta al YAML del workflow (ej. `kit/workflows/green-field.v1.yaml`). |
| `artifactsDir` | Carpeta donde viven los documentos SDD (default `docs/sdd/`). |
| `skillsTargetDir` | Destino de skills (default `.cursor/skills/`). |
| `kitVersion` | Versión informativa del kit (se refleja en `_INDEX.md`). |

## Workflows

- Definiciones: [`kit/workflows/`](kit/workflows/)
- Schema JSON: [`kit/schema/workflow.schema.json`](kit/schema/workflow.schema.json)
- **Green-field v1**: [`kit/workflows/green-field.v1.yaml`](kit/workflows/green-field.v1.yaml) — 6 pasos con precondiciones, outputs y skills asociadas.

Para cambiar de workflow, apuntá `workflowFile` a otro YAML que cumpla el schema y volvé a correr `npm run bootstrap`.

## Artefactos y handoff

Tras el bootstrap tendrás (según config):

- `docs/sdd/_INDEX.md`: mapa del workflow, rutas y criterios de completitud.
- `docs/sdd/01-...` a `06-...`: plantillas listas para completar con skills `sdd-doc-*`.

Cada plantilla incluye una sección **Handoff pack** para que el siguiente paso no dependa del chat.

## Skills

Origen versionado en [`kit/skills/`](kit/skills/) (el bootstrap las copia a `.cursor/skills/`).

En este repositorio, `.cursor/skills/` está listada en `.gitignore` para no duplicar el árbol versionado bajo `kit/skills/`. Tras clonar, corré `npm run bootstrap` para materializar las skills en tu working copy local.

- **Roles (coaching)**: `sdd-role-business-analyst`, `sdd-role-product-manager`, `sdd-role-architect`, `sdd-role-technical-leader`, `sdd-role-project-leader`, `sdd-role-developer`, `sdd-role-quality-specialist`, `sdd-role-devops`
- **Documentos (wizard)**: `sdd-doc-project-brief`, `sdd-doc-vision-scope`, `sdd-doc-capability-discovery`, `sdd-doc-domain-model`, `sdd-doc-requirements`, `sdd-doc-architecture-adrs`

En Cursor, invocá la skill correspondiente al artefacto o rol que necesites; seguí el procedimiento del `SKILL.md`.

## Reglas de proyecto

El bootstrap crea (si no existe) una regla opcional en `.cursor/rules/sdd-kit.mdc` para recordar leer `docs/sdd/_INDEX.md` antes de editar artefactos.

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `npm run validate-workflows` | Valida todos los YAML en `kit/workflows/` contra el JSON Schema. |
| `npm run bootstrap` | Copia skills, inicializa plantillas en `artifactsDir` y regenera `_INDEX.md`. |

## Convenciones

- Prefijos estables: `sdd-role-*` y `sdd-doc-*`.
- Los workflows referencian `doc_skill` con el **nombre de carpeta** de la skill.
- No versionar secretos en `sdd-kit.config.yaml` (solo paths y toggles).
