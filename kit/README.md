# ID2S Kit

Kit para **Intive Domain To Spec Driven Develop**: workflows, catálogo de steps, plantillas, agent-ready y skills para Cursor.

## Capas

| Capa | Ubicación | Uso |
|------|-----------|-----|
| **Steps** | `kit/steps/*.step.yaml` | Definición canónica reutilizable (objetivo, rol, inputs, outputs) |
| **Workflows** | `kit/workflows/*.yaml` | Composición: legacy (`steps` inline) o v2 (`stages` + refs) |
| **Artefactos** | `docs/id2s/*.md` | Fuente de verdad humana |
| **Agent-ready** | `agent-ready-docs/id2s/*.agent.yaml` | Contexto estructurado para agentes |

## Workflow mínimo (v2)

`kit/workflows/green-field-minimal.v2.yaml` — 3 documentos:

1. `product-intent.md` (PM)
2. `business-requirements.md` (BA)
3. `system-design.md` (Architect)

## Comandos

```bash
npm run validate-workflows   # steps + workflows
npm run bootstrap            # skills, plantillas, _INDEX
npm run sync-agent-ready -- docs/id2s/<archivo>.md
```

## Configuración del proyecto

En la raíz del repo, `id2s-kit.config.yaml`:

```yaml
workflowFile: kit/workflows/green-field-minimal.v2.yaml
artifactsDir: docs/id2s
agentReadyDir: agent-ready-docs/id2s
```

Legacy: `kit/workflows/green-field.v1.yaml` (6 artefactos numerados 01–06).
