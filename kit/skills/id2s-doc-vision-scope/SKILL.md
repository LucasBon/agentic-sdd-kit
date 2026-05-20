---
name: id2s-doc-vision-scope
description: Producir o actualizar `02-vision-and-scope.md` (Visión y alcance) anclado al brief del proyecto.
---

# Skill: Documento — Visión y alcance (`id2s-doc-vision-scope`)

## Objetivo

Definir **visión**, **objetivos medibles**, **no-objetivos** y **supuestos** alineados al brief, con Handoff para discovery de capacidades.

## Rutas

- Escritura: `{artifactsDir}/02-vision-and-scope.md` (ver `id2s-kit.config.yaml`)
- Lectura: `{agentReadyDir}/02-vision-and-scope.agent.yaml`
- Plantilla: `kit/templates/id2s/02-vision-and-scope.md.template`

## Gate de precondiciones

- Debe existir `{artifactsDir}/01-project-brief.md`.
- Si el brief está incompleto: pedí completar `id2s-doc-project-brief` primero.

## Fuentes de verdad (orden)

1. Agent-ready del brief y visión si existen.
2. `{artifactsDir}/01-project-brief.md`
3. `docs/id2s/_INDEX.md` y `agent-ready-docs/id2s/_INDEX.yaml`
4. Preguntas al usuario para cerrar métricas y no-objetivos.

## Versionado y sync

- Incrementá `current_version` + `versions` al cambiar sustancialmente.
- `npm run sync-agent-ready -- docs/id2s/02-vision-and-scope.md`

## Procedimiento

1. Copiá/actualizá el archivo desde plantilla si hace falta.
2. **Visión en una frase**: resultado para usuario + negocio.
3. **Objetivos top 3** con métrica sugerida y umbral.
4. **No-objetivos**: mínimo 3 bullets.
5. **Personas/JTBD**: mínimo 1 persona P0.
6. **Supuestos y riesgos de producto** con método de validación.
7. **Handoff pack** hacia capacidades.
8. Bump versión + sync agent-ready.

## Criterios de completitud

Step `vision-scope` del workflow activo en `id2s-kit.config.yaml`.
