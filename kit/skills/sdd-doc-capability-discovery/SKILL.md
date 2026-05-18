---
name: sdd-doc-capability-discovery
description: Producir o actualizar `03-capability-discovery.md` (capacidades y journeys) conectando visión con modelado.
---

# Skill: Documento — Descubrimiento de capacidades (`sdd-doc-capability-discovery`)

## Objetivo

Priorizar **capacidades** y describir **journeys P0** con suficiente detalle para modelar dominio sin “feature soup”.

## Rutas

- `{artifactsDir}/03-capability-discovery.md`
- Plantilla: `kit/templates/sdd/03-capability-discovery.md.template`

## Gate de precondiciones

- Debe existir `{artifactsDir}/02-vision-and-scope.md`.

## Fuentes de verdad (orden)

1. `{artifactsDir}/02-vision-and-scope.md`
2. `{artifactsDir}/01-project-brief.md` (restricciones/supuestos)
3. `_INDEX.md`

## Procedimiento

1. Listá capacidades con IDs estables (`C1`, `C2`, …) y prioridad P0/P1/P2.
2. Para cada **P0**, escribí un journey: actor, trigger, pasos felices, excepciones relevantes, datos in/out (alto nivel).
3. Integraciones candidatas: aunque sea “probable”, marcá confianza (confirmado vs hipótesis).
4. **Decisiones abiertas**: empujá ambigüedad fuera del texto narrativo hacia esta tabla.
5. **Handoff pack**: términos candidatos al glosario + límites temáticos + eventos/estados críticos (si aplica).
6. **Chequeo**: cada capability P0 tiene journey y valor esperado.

## Criterios de completitud

Usá el step `capability-discovery` en `kit/workflows/green-field.v1.yaml`.
