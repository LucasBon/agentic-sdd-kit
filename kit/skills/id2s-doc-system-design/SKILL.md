---
name: id2s-doc-system-design
description: Producir o actualizar `system-design.md` (diseño de sistema y ADRs) siguiendo el workflow ID2S activo.
---

# Skill: Documento — Diseño de sistema (`id2s-doc-system-design`)

## Objetivo

Completar `system-design.md` con C4 (contexto/contenedores), integraciones, ADRs indexados y **Handoff pack** para implementación.

## Rutas (configurable)

- **Escritura humana**: `{artifactsDir}/system-design.md`
- **Lectura obligatoria**: `{artifactsDir}/business-requirements.md` y agent-ready
- **Plantilla**: `kit/templates/id2s/system-design.md.template`

## Fuentes de verdad (orden)

1. `business-requirements.md` — FR/NFR/BR y handoff de negocio
2. `_INDEX.yaml` — paso `system-design`
3. Decisiones técnicas: estado propuesto/aceptado en ADRs; no asumir stack sin validar

## Versionado y sync

- Bump `current_version` en cambios sustanciales.
- `npm run sync-agent-ready -- docs/id2s/system-design.md`

## Gate de precondiciones

- Requiere `business-requirements.md` con handoff usable.
- Si faltan NFRs críticos: devolvé al paso anterior con preguntas concretas.

## Procedimiento

1. Resumen arquitectura (6–12 líneas) anclado a drivers de negocio.
2. **C4 contexto** y **contenedores** con responsabilidades.
3. **Integraciones** y contratos alto nivel.
4. **ADRs** con contexto, decisión, consecuencias.
5. **Riesgos técnicos** y deuda inicial.
6. **Handoff pack** (módulos, APIs, datos, smoke tests).
7. Bump versión + sync.

## Criterios de completitud

Step `system-design` en `kit/steps/` o checklist en `_INDEX`.
