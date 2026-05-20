---
name: id2s-doc-product-intent
description: Producir o actualizar `product-intent.md` (intención de producto) siguiendo el workflow ID2S activo.
---

# Skill: Documento — Intención de producto (`id2s-doc-product-intent`)

## Objetivo

Completar `product-intent.md` de forma **minimalista pero completa**, fusionando brief y visión/alcance en un solo artefacto con **Handoff pack** accionable para `business-requirements.md`.

## Rutas (configurable)

- Leé `id2s-kit.config.yaml`: `artifactsDir` (default `docs/id2s/`), `agentReadyDir` (default `agent-ready-docs/id2s/`).
- **Escritura humana**: `{artifactsDir}/product-intent.md`
- **Lectura**: `{agentReadyDir}/product-intent.agent.yaml`, `_INDEX.yaml`
- **Plantilla**: `kit/templates/id2s/product-intent.md.template`

## Fuentes de verdad (orden)

1. `agent-ready-docs/id2s/_INDEX.yaml` y `product-intent.agent.yaml`
2. `docs/id2s/_INDEX.md` para workflow/paso activo
3. Entrevista al usuario; marcá **TBD** con pregunta explícita si falta dato

## Versionado y sync

- Al modificar sustancialmente, incrementá `current_version` y añadí entrada en `versions`.
- Ejecutá `npm run sync-agent-ready -- docs/id2s/product-intent.md`

## Gate de precondiciones

- No requiere artefactos previos.
- Si piden requisitos sin product-intent: advertí y ofrecé completar Handoff mínimo.

## Procedimiento

1. Confirmá rutas y abrí/creá el destino desde plantilla.
2. **Resumen + problema**: problema, usuario, trigger, as-is breve (sin solución técnica).
3. **Visión + objetivos**: una frase de visión; tabla top 3 objetivos con métrica.
4. **No-objetivos + stakeholders + restricciones + riesgos + supuestos**.
5. **Handoff pack**: bullets concretos para el paso `business-requirements`.
6. Chequeo: oraciones **observables** o **accionables** por negocio.
7. Preguntas abiertas (máx. 7); bump versión + sync agent-ready.

## Criterios de completitud

Tomá el step `product-intent` del workflow activo (`kit/steps/product-intent.step.yaml` o `_INDEX`) como checklist final.
