---
name: id2s-doc-domain-model
description: Producir o actualizar `04-domain-model.md` (lenguaje ubicuo y bounded contexts livianos) basado en capacidades y journeys.
---

# Skill: Documento — Modelo de dominio (`id2s-doc-domain-model`)

## Objetivo

Estabilizar **lenguaje ubicuo** y **bounded contexts** candidatos con mapa lite.

## Rutas

- Escritura: `{artifactsDir}/04-domain-model.md`
- Lectura: `{agentReadyDir}/04-domain-model.agent.yaml`
- Plantilla: `kit/templates/id2s/04-domain-model.md.template`

## Gate de precondiciones

- Debe existir `{artifactsDir}/03-capability-discovery.md`.

## Fuentes de verdad (orden)

1. Agent-ready de capability discovery y artefactos previos.
2. Humanos `03`, `02`, `01`.
3. Índices ID2S.

## Versionado y sync

- Bump versión + `npm run sync-agent-ready -- docs/id2s/04-domain-model.md`

## Procedimiento

1. **Glosario** desde journeys.
2. **Bounded contexts** candidatos (3–7).
3. **Mapa de contexto lite**.
4. **Modelo conceptual** o PENDIENTE.
5. **Trazabilidad** capability → contexto.
6. **Handoff pack** hacia requisitos.
7. Sync agent-ready.

## Criterios de completitud

Step `domain-model` del workflow activo.
