#!/usr/bin/env node
/**
 * Resolves Agentic SDD Kit workflows: composed (stages + step catalog) or legacy (inline steps).
 * Step catalog: project steps override kit steps.
 */

import { loadStepFromCatalog } from "./step-catalog.mjs";
import { engagementProfileFromStep } from "./role-skill-ids.mjs";

/**
 * @typedef {object} ResolvedStep
 * @property {string} id
 * @property {string} title
 * @property {string} objective
 * @property {string} primary_role_skill
 * @property {"coach" | "delivery"} engagement_profile
 * @property {string} doc_skill
 * @property {object[]} inputs
 * @property {object[]} outputs
 * @property {string[]} completion_criteria
 * @property {object[]} [preconditions]
 * @property {string} [stage_id]
 * @property {boolean} [stage_parallel]
 * @property {number} order
 * @property {string} [step_source] - 'kit' | 'project'
 */

/**
 * @typedef {import('./step-catalog.mjs').CatalogContext} CatalogContext
 */

/**
 * @param {object[]} inputs
 */
export function inputsToPreconditions(inputs) {
  if (!inputs?.length) return [];
  return inputs
    .filter((i) => i.kind === "artifact" && i.required !== false)
    .map((i) => ({
      type: "file_exists",
      path: i.path,
      description: i.description || `Requires artifact: ${i.path}`,
    }));
}

/**
 * @param {object} catalogStep
 * @param {{ stage_id?: string, stage_parallel?: boolean, order: number, step_source?: string }} meta
 * @returns {ResolvedStep}
 */
export function normalizeCatalogStep(catalogStep, meta) {
  const outputs = (catalogStep.outputs || []).map((o) => ({
    path: o.path,
    template: o.template,
  }));

  return {
    id: catalogStep.id,
    title: catalogStep.title,
    objective: catalogStep.objective,
    primary_role_skill: catalogStep.primary_role_skill,
    engagement_profile: engagementProfileFromStep(catalogStep),
    doc_skill: catalogStep.doc_skill,
    inputs: catalogStep.inputs || [],
    outputs,
    completion_criteria: catalogStep.completion_criteria || [],
    preconditions: inputsToPreconditions(catalogStep.inputs),
    stage_id: meta.stage_id,
    stage_parallel: meta.stage_parallel,
    order: meta.order,
    step_source: meta.step_source,
  };
}

/**
 * @param {CatalogContext} ctx
 * @param {object} workflow
 */
export async function resolveWorkflow(ctx, workflow) {
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
        const { doc: catalogStep, scope } = await loadStepFromCatalog(ctx, stepId);
        if (catalogStep.id !== stepId) {
          console.warn(`Step file ${stepId}.step.yaml has id=${catalogStep.id}; using file name id.`);
        }
        const step = normalizeCatalogStep(catalogStep, {
          stage_id: stage.id,
          stage_parallel: !!stage.parallel,
          order,
          step_source: scope,
        });
        resolved.push(step);
        stageEntry.steps.push({
          id: step.id,
          order: step.order,
          primary_role_skill: step.primary_role_skill,
          engagement_profile: step.engagement_profile,
          artifact_path: step.outputs?.[0]?.path ?? null,
          doc_skill: step.doc_skill,
        });
        order++;
      }
      stagesMeta.push(stageEntry);
    }

    return { resolved, stages: stagesMeta, format: "composed" };
  }

  const resolved = (workflow.steps || []).map((step, i) => {
    const { suggested_role_skills: _legacySuggested, ...rest } = step;
    return {
      ...rest,
      primary_role_skill: step.primary_role_skill || null,
      engagement_profile: engagementProfileFromStep(step),
      order: i + 1,
      stage_id: null,
      stage_parallel: false,
      step_source: "inline",
    };
  });

  return { resolved, stages: null, format: "legacy" };
}

/**
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

/**
 * Build catalog context for bootstrap / validate.
 * @param {string} kitRoot
 * @param {string} repoRoot
 * @param {object} config
 */
export function buildCatalogContext(kitRoot, repoRoot, config) {
  return {
    kitRoot,
    repoRoot,
    projectStepsDir: config.projectStepsDir,
  };
}
