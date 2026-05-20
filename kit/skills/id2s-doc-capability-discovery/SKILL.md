---
name: id2s-doc-capability-discovery
description: Producir o actualizar `03-capability-discovery.md` (capacidades y journeys) conectando visión con modelado.
---

# Skill: Documento — Descubrimiento de capacidades (`id2s-doc-capability-discovery`)

## Objetivo

Priorizar **capacidades** y describir **journeys P0** con suficiente detalle para modelar dominio.

## Rutas

- Escritura: `{artifactsDir}/03-capability-discovery.md`
- Lectura: `{agentReadyDir}/03-capability-discovery.agent.yaml`
- Plantilla: `kit/templates/id2s/03-capability-discovery.md.template`

## Gate de precondiciones

- Debe existir `{artifactsDir}/02-vision-and-scope.md`.

## Fuentes de verdad (orden)

1. Agent-ready de visión y brief.
2. Artefactos humanos `02` y `01`.
3. Índices `_INDEX.md` / `_INDEX.yaml`.

## Versionado y sync

- Bump `current_version` + `versions`; luego `npm run sync-agent-ready -- docs/id2s/03-capability-discovery.md`

## Procedimiento

1. Capacidades con IDs (`C1`, …) y prioridad P0/P1/P2.
2. Journey por cada **P0**.
3. Integraciones candidatas con nivel de confianza.
4. **Decisiones abiertas** en tabla.
5. **Handoff pack** hacia dominio.
6. Sync agent-ready.

## Criterios de completitud

Step `capability-discovery` del workflow activo.
