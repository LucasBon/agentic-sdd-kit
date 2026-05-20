---
name: id2s-doc-business-requirements
description: Producir o actualizar `business-requirements.md` (requisitos de negocio) siguiendo el workflow ID2S activo.
---

# Skill: Documento — Requisitos de negocio (`id2s-doc-business-requirements`)

## Objetivo

Completar `business-requirements.md` con reglas BR-xxx, FR-xxx testeables, glosario mínimo, capacidades P0/P1 y **Handoff pack** para `system-design.md`.

## Rutas (configurable)

- **Escritura humana**: `{artifactsDir}/business-requirements.md`
- **Lectura obligatoria**: `{artifactsDir}/product-intent.md` y su `.agent.yaml`
- **Plantilla**: `kit/templates/id2s/business-requirements.md.template`

## Fuentes de verdad (orden)

1. `product-intent.md` / agent-ready (sin contradecir)
2. `_INDEX.yaml` — paso `business-requirements`
3. Entrevista; no inventes reglas — marcá ambigüedades en tabla dedicada

## Versionado y sync

- Bump `current_version` en cambios sustanciales.
- `npm run sync-agent-ready -- docs/id2s/business-requirements.md`

## Gate de precondiciones

- Requiere `product-intent.md` existente y coherente.
- Si falta: advertí y ofrecé completar insumos mínimos en product-intent primero.

## Procedimiento

1. Leé product-intent y validá alineación de problema/alcance.
2. **Supuestos validados** y **capacidades** P0/P1.
3. **Glosario** — términos críticos sin sinónimos ambiguos.
4. **FR-xxx** con criterio de aceptación testeable por capability P0.
5. **BR-xxx** referenciando glosario; separá regla de implementación.
6. **NFR negocio** con umbral o método de verificación.
7. **Casos límite** y **ambigüedades abiertas** (no resolver en silencio).
8. **Handoff pack** para arquitectura.
9. Bump versión + sync.

## Criterios de completitud

Step `business-requirements` en catálogo `kit/steps/` o checklist en `_INDEX`.
