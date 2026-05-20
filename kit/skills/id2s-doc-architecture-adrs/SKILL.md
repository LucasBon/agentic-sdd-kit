---
name: id2s-doc-architecture-adrs
description: Producir o actualizar `06-architecture-adrs.md` (C4 + ADRs) alineado a requisitos y riesgos técnicos.
---

# Skill: Documento — Arquitectura y ADRs (`id2s-doc-architecture-adrs`)

## Objetivo

Documentar **C4**, **integraciones** y **ADRs** con handoff ejecutable.

## Rutas

- Escritura: `{artifactsDir}/06-architecture-adrs.md`
- Lectura: `{agentReadyDir}/06-architecture-adrs.agent.yaml`
- Plantilla: `kit/templates/id2s/06-architecture-adrs.md.template`

## Gate de precondiciones

- Debe existir `{artifactsDir}/05-requirements.md`.

## Fuentes de verdad (orden)

1. Agent-ready de requisitos, dominio, capabilities.
2. Humanos `05`–`03`.
3. Índices ID2S.

## Versionado y sync

- Bump versión + `npm run sync-agent-ready -- docs/id2s/06-architecture-adrs.md`

## Procedimiento

1. Resumen con **drivers** NFR.
2. **C4 Contexto** y **Contenedores**.
3. **Integraciones** con dueño y riesgo.
4. **ADRs** con alternativas.
5. **Riesgos técnicos**.
6. **Handoff pack** a implementación.
7. Sync agent-ready.

## Criterios de completitud

Step `architecture-adrs` del workflow activo.
