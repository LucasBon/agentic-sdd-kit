---
name: sdd-doc-domain-model
description: Producir o actualizar `04-domain-model.md` (lenguaje ubicuo y bounded contexts livianos) basado en capacidades y journeys.
---

# Skill: Documento — Modelo de dominio (estrategia liviana) (`sdd-doc-domain-model`)

## Objetivo

Estabilizar **lenguaje ubicuo** y **límites de contexto** (candidatos) con mapa lite, sin caer en diseño táctico exhaustivo.

## Rutas

- `{artifactsDir}/04-domain-model.md`
- Plantilla: `kit/templates/sdd/04-domain-model.md.template`

## Gate de precondiciones

- Debe existir `{artifactsDir}/03-capability-discovery.md`.

## Fuentes de verdad (orden)

1. `{artifactsDir}/03-capability-discovery.md`
2. `{artifactsDir}/02-vision-and-scope.md`
3. `{artifactsDir}/01-project-brief.md`
4. `_INDEX.md`

## Procedimiento

1. Extraé sustantivos de negocio recurrentes de journeys y convertilos en **glosario** (definición + sinónimos prohibidos).
2. Proponé **bounded contexts** candidatos: 3–7 suele ser saludable; si hay más, agrupá y marcá incertidumbre.
3. **Mapa de contexto lite**: tabla de relaciones (upstream/downstream/partnership/ACL si aplica).
4. **Modelo conceptual**: solo conceptos con ciclo de vida/invariantes si hay consenso; si no, **PENDIENTE** con pregunta.
5. **Trazabilidad**: tabla capability → contexto principal.
6. **Decisiones pendientes**: lo que bloquea requisitos o arquitectura.
7. **Handoff pack**: términos top, límites, reglas conocidas, ambigüedades.

## Criterios de completitud

Usá el step `domain-model` en `kit/workflows/green-field.v1.yaml`.
