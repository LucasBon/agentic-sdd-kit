---
name: id2s-doc-project-brief
description: Producir o actualizar `01-project-brief.md` (Brief del proyecto) siguiendo el workflow ID2S activo.
---

# Skill: Documento — Brief del proyecto (`id2s-doc-project-brief`)

## Objetivo

Completar `01-project-brief.md` de forma **minimalista pero completa**, dejando un **Handoff pack** accionable para `02-vision-and-scope.md`.

## Rutas (configurable)

- Leé `id2s-kit.config.yaml` en la raíz: `artifactsDir` (default `docs/id2s/`), `agentReadyDir` (default `agent-ready-docs/id2s/`).
- **Escritura humana**: `{artifactsDir}/01-project-brief.md`
- **Lectura para contexto**: `{agentReadyDir}/01-project-brief.agent.yaml`
- **Plantilla fuente**: `kit/templates/id2s/01-project-brief.md.template`

## Fuentes de verdad (orden)

1. `agent-ready-docs/id2s/_INDEX.yaml` y `01-project-brief.agent.yaml` para contexto rápido.
2. `docs/id2s/_INDEX.md` para confirmar workflow/paso.
3. Entrevista mínima al usuario (si falta información).
4. No inventes stakeholders, métricas ni restricciones: marcá **TBD** con pregunta explícita.

## Versionado y sync

- Al modificar sustancialmente el documento, incrementá `current_version` y añadí entrada en `versions` (metadatos solamente).
- Ejecutá `npm run sync-agent-ready -- docs/id2s/01-project-brief.md`.

## Gate de precondiciones

- No requiere artefactos previos.
- Si el usuario pide saltar a visión sin brief: **advertí** y ofrecé completar solo el Handoff mínimo.

## Procedimiento (pasos)

1. **Confirmá rutas** y abrí el archivo destino (crealo desde plantilla si no existe).
2. **Resumen ejecutivo**: 4–8 líneas con problema, usuario, oportunidad y resultado esperado (sin solución técnica).
3. **Problema y contexto**: trigger “por qué ahora” + as-is breve.
4. **Usuarios y segmentos**: completá la tabla con al menos 1 fila P0.
5. **Stakeholders + restricciones + riesgos + supuestos**: sin campos vacíos; si no hay dato, escribí `PENDIENTE: ...` con pregunta.
6. **Handoff pack**: completá bullets concretos (no genéricos).
7. **Chequeo de calidad**: cada oración debe ser **observable** o **accionable** por negocio.
8. **Cierre**: listá preguntas abiertas máximo 7, priorizadas; bump versión + sync agent-ready.

## Criterios de completitud (del workflow)

Tomá el workflow activo en `id2s-kit.config.yaml` → step `project-brief` como checklist final.
