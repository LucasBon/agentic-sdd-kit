#!/usr/bin/env node
/**
 * Resuelve workflows ID2S: legacy (steps inline) o compuesto (stages + catálogo kit/steps/).
 */

import fs from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";

/**
 * @typedef {object} ResolvedStep
 * @property {string} id
 * @property {string} title
 * @property {string} objective
 * @property {string} primary_role_skill
 * @property {string} doc_skill
 * @property {object[]} inputs
 * @property {object[]} outputs
 * @property {string[]} suggested_role_skills
 * @property {string[]} completion_criteria
 * @property {object[]} [preconditions] - legacy file_exists from inputs
 * @property {string} [stage_id]
 * @property {boolean} [stage_parallel]
 * @property {number} order
 */

/**
 * @param {string} kitRoot
 * @param {string} stepId
 */
export async function loadStepFromCatalog(kitRoot, stepId) {
  const stepPath = path.join(kitRoot, "steps", `${stepId}.step.yaml`);
  const raw = await fs.readFile(stepPath, "utf8");
  return parseYaml(raw);
}

/**
 * Convierte inputs del catálogo a preconditions legacy (file_exists) para compatibilidad.
 * @param {object[]} inputs
 */
export function inputsToPreconditions(inputs) {
  if (!inputs?.length) return [];
  return inputs
    .filter((i) => i.kind === "artifact" && i.required !== false)
    .map((i) => ({
      type: "file_exists",
      path: i.path,
      description: i.description || `Requiere artefacto: ${i.path}`,
    }));
}

/**
 * @param {object} catalogStep
 * @param {{ stage_id?: string, stage_parallel?: boolean, order: number }} meta
 * @returns {ResolvedStep}
 */
export function normalizeCatalogStep(catalogStep, meta) {
  const outputs = (catalogStep.outputs || []).map((o) => ({
    path: o.path,
    template: o.template,
    agent_ready_path:
      o.agent_ready_path ||
      `agent-ready-docs/id2s/${path.basename(o.path, ".md")}.agent.yaml`,
  }));

  const suggested = [
    ...(catalogStep.suggested_role_skills || []),
  ];
  if (
    catalogStep.primary_role_skill &&
    !suggested.includes(catalogStep.primary_role_skill)
  ) {
    suggested.unshift(catalogStep.primary_role_skill);
  }

  return {
    id: catalogStep.id,
    title: catalogStep.title,
    objective: catalogStep.objective,
    primary_role_skill: catalogStep.primary_role_skill,
    doc_skill: catalogStep.doc_skill,
    inputs: catalogStep.inputs || [],
    outputs,
    suggested_role_skills: [...new Set(suggested)],
    completion_criteria: catalogStep.completion_criteria || [],
    preconditions: inputsToPreconditions(catalogStep.inputs),
    stage_id: meta.stage_id,
    stage_parallel: meta.stage_parallel,
    order: meta.order,
  };
}

/**
 * @param {string} kitRoot
 * @param {object} workflow - parsed workflow yaml
 * @returns {Promise<{ resolved: ResolvedStep[], stages: object[] | null, format: 'legacy' | 'composed' }>}
 */
export async function resolveWorkflow(kitRoot, workflow) {
  if (workflow.stages?.length) {
    const resolved = [];
    const stagesMeta = [];
    let order = 1;

    for (const stage of workflow.stages) {
      const stageEntry = {
        id: stage.id,
        parallel: !!stage.parallel,
        steps: [],
      };

      for (const stepId of stage.steps || []) {
        const catalogStep = await loadStepFromCatalog(kitRoot, stepId);
        if (catalogStep.id !== stepId) {
          console.warn(
            `Step file ${stepId}.step.yaml has id=${catalogStep.id}; using file name id.`
          );
        }
        const step = normalizeCatalogStep(catalogStep, {
          stage_id: stage.id,
          stage_parallel: !!stage.parallel,
          order,
        });
        resolved.push(step);
        stageEntry.steps.push({
          id: step.id,
          order: step.order,
          primary_role_skill: step.primary_role_skill,
          artifact_path: step.outputs?.[0]?.path ?? null,
          agent_ready_path: step.outputs?.[0]?.agent_ready_path ?? null,
          doc_skill: step.doc_skill,
          suggested_role_skills: step.suggested_role_skills,
        });
        order++;
      }
      stagesMeta.push(stageEntry);
    }

    return { resolved, stages: stagesMeta, format: "composed" };
  }

  const resolved = (workflow.steps || []).map((step, i) => ({
    ...step,
    primary_role_skill:
      step.primary_role_skill ||
      (step.suggested_role_skills && step.suggested_role_skills[0]) ||
      null,
    order: i + 1,
    stage_id: null,
    stage_parallel: false,
  }));

  return { resolved, stages: null, format: "legacy" };
}

/**
 * Workflow normalizado para bootstrap (siempre tiene .steps como lista resuelta).
 * @param {object} workflow
 * @param {ResolvedStep[]} resolved
 * @param {object[] | null} stages
 */
export function workflowForBootstrap(workflow, resolved, stages) {
  return {
    id: workflow.id,
    version: workflow.version,
    title: workflow.title,
    description: workflow.description,
    format: stages ? "composed" : "legacy",
    stages: stages || undefined,
    steps: resolved,
  };
}
