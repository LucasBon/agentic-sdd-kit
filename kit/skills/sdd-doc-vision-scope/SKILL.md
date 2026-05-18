---
name: sdd-doc-vision-scope
description: Producir o actualizar `02-vision-and-scope.md` (Visión y alcance) anclado al brief del proyecto.
---

# Skill: Documento — Visión y alcance (`sdd-doc-vision-scope`)

## Objetivo

Definir **visión**, **objetivos medibles**, **no-objetivos** y **supuestos** alineados al brief, con Handoff para discovery de capacidades.

## Rutas

- `{artifactsDir}/02-vision-and-scope.md`
- Plantilla: `kit/templates/sdd/02-vision-and-scope.md.template`

## Gate de precondiciones

- Debe existir `{artifactsDir}/01-project-brief.md`.
- Si el brief está claramente incompleto (secciones vacías críticas): **pará** y pedí completar `sdd-doc-project-brief` primero (podés solo completar Handoff mínimo si acordamos ese atajo).

## Fuentes de verdad (orden)

1. `{artifactsDir}/01-project-brief.md`
2. `_INDEX.md`
3. Preguntas al usuario para cerrar métricas y no-objetivos

## Procedimiento

1. Copiá/actualizá el archivo desde plantilla si hace falta.
2. **Visión en una frase**: resultado para usuario + negocio.
3. **Objetivos top 3** con métrica sugerida y umbral (aunque sea hipótesis inicial).
4. **No-objetivos**: mínimo 3 bullets contundentes.
5. **Personas/JTBD**: mínimo 1 persona P0 con job principal.
6. **Supuestos y riesgos de producto**: cada supuesto con método de validación y dueño.
7. **Dependencias externas** visión: aunque sea “desconocido”, registrá el gap.
8. **Handoff pack**: conectá explícitamente con IDs/capacidades esperadas (aunque sean candidatas).
9. **Chequeo**: ningún objetivo sin indicio de medición; ningún riesgo sin mitigación tentativa.

## Criterios de completitud

Usá el step `vision-scope` en `kit/workflows/green-field.v1.yaml`.
