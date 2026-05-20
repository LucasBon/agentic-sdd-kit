---
id2s_kit_version: "2.0.0"
workflow_id: "green-field"
workflow_version: "1.0.0"
workflow_file: "kit/workflows/green-field.v1.yaml"
locale: "es"
generated_by: bootstrap
---

# Índice ID2S (`_INDEX`)

Este archivo es la **fuente de verdad operativa** para humanos y agentes: resume el workflow activo, rutas de artefactos y criterios de avance.

## Configuración

- **Locale**: es
- **Workflow**: `kit/workflows/green-field.v1.yaml` (Workflow green-field (producto + DDD liviano))
- **Artefactos humanos**: `docs/id2s`
- **Agent-ready**: `agent-ready-docs/id2s`

## Pasos y artefactos

| Orden | Step ID | Título | Artefacto principal | Skill de documento |
|------:|---------|--------|---------------------|--------------------|
| 1 | `project-brief` | Brief del proyecto | `docs/id2s/01-project-brief.md` | `id2s-doc-project-brief` |
| 2 | `vision-scope` | Visión y alcance | `docs/id2s/02-vision-and-scope.md` | `id2s-doc-vision-scope` |
| 3 | `capability-discovery` | Descubrimiento de capacidades | `docs/id2s/03-capability-discovery.md` | `id2s-doc-capability-discovery` |
| 4 | `domain-model` | Modelo de dominio (estrategia liviana) | `docs/id2s/04-domain-model.md` | `id2s-doc-domain-model` |
| 5 | `requirements` | Requisitos ejecutables-lite | `docs/id2s/05-requirements.md` | `id2s-doc-requirements` |
| 6 | `architecture-adrs` | Arquitectura y ADRs | `docs/id2s/06-architecture-adrs.md` | `id2s-doc-architecture-adrs` |

## Criterios de completitud (resumen)

### project-brief

- El problema y el usuario principal están definidos en una o dos frases verificables.
- Hay al menos 3 restricciones o supuestos explícitos (negocio, compliance, tiempo, presupuesto o políticas).
- Stakeholders y sus intereses están listados (aunque sea provisionalmente).
- La sección Handoff pack está completa con entradas concretas para visión y alcance.

### vision-scope

- Objetivos de negocio y métricas de éxito están priorizados (top 3).
- No-objetivos explícitos evitan deriva de alcance.
- Supuestos y riesgos de producto están visibles y son revisables.
- Handoff pack conecta con capacidades priorizadas.

### capability-discovery

- Capacidades priorizadas (P0/P1) con valor esperado cada una.
- Al menos un journey end-to-end por capacidad P0.
- Dependencias externas o integraciones candidatas identificadas.
- Handoff pack lista conceptos candidatos al modelo de dominio.

### domain-model

- Glosario con términos de negocio y definiciones sin ambigüedad crítica.
- Contextos delimitados candidatos con responsabilidad en una frase cada uno.
- Mapa de contexto lite (relaciones principales) o lista de integraciones contexto-a-contexto.
- Decisiones pendientes explícitas para requisitos y arquitectura.

### requirements

- Requisitos funcionales priorizados con identificador estable (FR-xxx).
- NFRs críticos (seguridad, rendimiento, disponibilidad, observabilidad) listados con umbral o método de verificación.
- Reglas de negocio referencian términos del glosario.
- Criterios de aceptación testeables por capability P0.

### architecture-adrs

- Diagrama o descripción C4 nivel sistema y contenedores con responsabilidades.
- Lista de integraciones externas con propósito y dueño técnico/nombre de servicio.
- ADRs propuestos con estado (propuesto/aceptado) y consecuencias resumidas.
- Handoff pack prepara implementación (módulos, riesgos técnicos, pruebas de humo).

## Decisiones globales (rellenar)

- **Stack / runtime**:
- **Entornos** (dev/stage/prod):
- **Compliance / datos personales**:
- **Enlaces** (board, designs, contratos):
