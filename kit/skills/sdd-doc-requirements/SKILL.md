---
name: sdd-doc-requirements
description: Producir o actualizar `05-requirements.md` (FR/NFR/reglas) trazables a capacidades y al glosario.
---

# Skill: Documento — Requisitos ejecutables-lite (`sdd-doc-requirements`)

## Objetivo

Dejar requisitos **priorizados**, **testeables** y **trazables** a capacidades, usando el glosario como autoridad léxica.

## Rutas

- `{artifactsDir}/05-requirements.md`
- Plantilla: `kit/templates/sdd/05-requirements.md.template`

## Gate de precondiciones

- Debe existir `{artifactsDir}/04-domain-model.md`.

## Fuentes de verdad (orden)

1. `{artifactsDir}/04-domain-model.md` (glosario + límites)
2. `{artifactsDir}/03-capability-discovery.md` (capabilities + journeys)
3. `{artifactsDir}/02-vision-and-scope.md` (métricas y supuestos)
4. `_INDEX.md`

## Procedimiento

1. Definí el alcance del documento (qué capabilities cubre en esta iteración).
2. **FR-xxx**: cada requisito con capability, prioridad y criterio de aceptación testeable.
3. **BR-xxx**: reglas con referencia explícita a términos del glosario.
4. **NFR-xxx**: categoría + umbral o método de verificación (no “rápido” sin definición).
5. **Matriz de trazabilidad mínima**: FR/BR ↔ journey/paso ↔ caso sugerido.
6. **Supuestos técnicos**: solo los necesarios para desbloquear arquitectura.
7. **Handoff pack**: NFR tensores, integraciones, datos sensibles, picos/volumen si se conocen.
8. **Chequeo**: ningún FR sin criterio; ningún término nuevo fuera de glosario sin definición.

## Criterios de completitud

Usá el step `requirements` en `kit/workflows/green-field.v1.yaml`.
