---
name: sdd-doc-project-brief
description: Producir o actualizar `01-project-brief.md` (Brief del proyecto) siguiendo el workflow green-field del kit SDD/DDD.
---

# Skill: Documento — Brief del proyecto (`sdd-doc-project-brief`)

## Objetivo

Completar `01-project-brief.md` de forma **minimalista pero completa**, dejando un **Handoff pack** accionable para `02-vision-and-scope.md`.

## Rutas (configurable)

- Leé `sdd-kit.config.yaml` en la raíz del repo: campo `artifactsDir` (default `docs/sdd/`).
- **Salida**: `{artifactsDir}/01-project-brief.md`
- **Plantilla fuente**: `kit/templates/sdd/01-project-brief.md.template`

## Fuentes de verdad (orden)

1. `docs/sdd/_INDEX.md` (si existe): confirmá workflow/paso.
2. Entrevista mínima al usuario (si falta información).
3. No inventes stakeholders, métricas ni restricciones: marcá **TBD** con pregunta explícita.

## Gate de precondiciones

- No requiere artefactos previos.
- Si el usuario pide saltar a visión sin brief: **advertí** y ofrecé completar solo el Handoff mínimo.

## Procedimiento (pasos)

1. **Confirmá rutas** (`artifactsDir`) y abrí el archivo destino (crealo desde plantilla si no existe).
2. **Resumen ejecutivo**: 4–8 líneas con problema, usuario, oportunidad y resultado esperado (sin solución técnica).
3. **Problema y contexto**: trigger “por qué ahora” + as-is breve.
4. **Usuarios y segmentos**: completá la tabla con al menos 1 fila P0.
5. **Stakeholders + restricciones + riesgos + supuestos**: sin campos vacíos; si no hay dato, escribí `PENDIENTE: ...` con pregunta.
6. **Handoff pack**: completá bullets concretos (no genéricos).
7. **Chequeo de calidad**: cada oración debe ser **observable** o **accionable** por negocio (evitá jerga técnica).
8. **Cierre**: listá preguntas abiertas máximo 7, priorizadas.

## Criterios de completitud (del workflow)

Tomá `kit/workflows/green-field.v1.yaml` → step `project-brief` como checklist final.
