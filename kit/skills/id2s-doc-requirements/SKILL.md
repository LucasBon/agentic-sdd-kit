---
name: id2s-doc-requirements
description: Producir o actualizar `05-requirements.md` (FR/NFR/reglas) trazables a capacidades y al glosario.
---

# Skill: Documento — Requisitos (`id2s-doc-requirements`)

## Objetivo

Requisitos **priorizados**, **testeables** y **trazables** a capacidades y glosario.

## Rutas

- Escritura: `{artifactsDir}/05-requirements.md`
- Lectura: `{agentReadyDir}/05-requirements.agent.yaml`
- Plantilla: `kit/templates/id2s/05-requirements.md.template`

## Gate de precondiciones

- Debe existir `{artifactsDir}/04-domain-model.md`.

## Fuentes de verdad (orden)

1. Agent-ready de dominio, capabilities, visión.
2. Humanos `04`–`02`.
3. Índices ID2S.

## Versionado y sync

- Bump versión + `npm run sync-agent-ready -- docs/id2s/05-requirements.md`

## Procedimiento

1. Alcance del documento.
2. **FR-xxx** con criterio de aceptación testeable.
3. **BR-xxx** con términos del glosario.
4. **NFR-xxx** con umbral o método de verificación.
5. **Trazabilidad** mínima.
6. **Handoff pack** hacia arquitectura.
7. Sync agent-ready.

## Criterios de completitud

Step `requirements` del workflow activo.
