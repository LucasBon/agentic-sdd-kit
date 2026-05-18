---
name: sdd-doc-architecture-adrs
description: Producir o actualizar `06-architecture-adrs.md` (C4 + ADRs) alineado a requisitos y riesgos técnicos.
---

# Skill: Documento — Arquitectura y ADRs (`sdd-doc-architecture-adrs`)

## Objetivo

Documentar **contexto/containers**, **integraciones** y **ADRs** con consecuencias explícitas, dejando un handoff ejecutable para implementación y operación.

## Rutas

- `{artifactsDir}/06-architecture-adrs.md`
- Plantilla: `kit/templates/sdd/06-architecture-adrs.md.template`

## Gate de precondiciones

- Debe existir `{artifactsDir}/05-requirements.md`.

## Fuentes de verdad (orden)

1. `{artifactsDir}/05-requirements.md` (FR/NFR)
2. `{artifactsDir}/04-domain-model.md` (límites y lenguaje)
3. `{artifactsDir}/03-capability-discovery.md` (integraciones)
4. `_INDEX.md`

## Procedimiento

1. Escribí un resumen corto con **drivers** (los NFR “tensores” primero).
2. **C4 Contexto**: actores + sistemas externos + trust boundaries.
3. **C4 Contenedores**: tabla con responsabilidades e interfaces; tecnología solo si está decidida.
4. **Integraciones**: dueño técnico + estado + riesgo operativo.
5. **ADRs**: al menos 1 ADR “real” (aunque esté en propuesto) con alternativas y consecuencias.
6. **Riesgos técnicos** + mitigación + owner.
7. **Handoff pack**: orden sugerido de implementación, smoke tests, observabilidad mínima, flags/migraciones.
8. **Chequeo**: cada NFR crítico del paso anterior tiene respuesta en arquitectura o un ADR explícito de incertidumbre.

## Criterios de completitud

Usá el step `architecture-adrs` en `kit/workflows/green-field.v1.yaml`.
