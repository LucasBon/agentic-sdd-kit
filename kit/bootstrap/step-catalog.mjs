#!/usr/bin/env node
/**
 * Step catalog: project steps override kit steps with the same id.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { pathExists } from "./load-kit-config.mjs";

/**
 * @typedef {object} CatalogContext
 * @property {string} kitRoot
 * @property {string} repoRoot
 * @property {string} [projectStepsDir] - relative to repo root
 */

/**
 * @param {CatalogContext} ctx
 * @param {string} stepId
 */
export async function resolveStepFilePath(ctx, stepId) {
  const fileName = `${stepId}.step.yaml`;
  if (ctx.projectStepsDir) {
    const projectPath = path.join(ctx.repoRoot, ctx.projectStepsDir, fileName);
    if (await pathExists(projectPath)) return { path: projectPath, scope: "project" };
  }
  const kitPath = path.join(ctx.kitRoot, "steps", fileName);
  if (await pathExists(kitPath)) return { path: kitPath, scope: "kit" };
  return null;
}

/**
 * @param {CatalogContext} ctx
 * @param {string} stepId
 */
export async function loadStepFromCatalog(ctx, stepId) {
  const resolved = await resolveStepFilePath(ctx, stepId);
  if (!resolved) {
    throw new Error(
      `Step "${stepId}" not found in project (${ctx.projectStepsDir || "—"}) or kit/steps/`
    );
  }
  const doc = parseYaml(await fs.readFile(resolved.path, "utf8"));
  return { doc, ...resolved };
}

/**
 * @param {string} dir
 */
async function listStepFilesInDir(dir) {
  try {
    const files = await fs.readdir(dir);
    return files.filter((f) => f.endsWith(".step.yaml") || f.endsWith(".step.yml"));
  } catch {
    return [];
  }
}

/**
 * @param {CatalogContext} ctx
 * @returns {Promise<{ id: string, path: string, scope: 'project' | 'kit' }[]>}
 */
export async function listCatalogSteps(ctx) {
  const byId = new Map();

  const kitFiles = await listStepFilesInDir(path.join(ctx.kitRoot, "steps"));
  for (const f of kitFiles) {
    const id = f.replace(/\.step\.ya?ml$/, "");
    byId.set(id, {
      id,
      path: path.join(ctx.kitRoot, "steps", f),
      scope: "kit",
    });
  }

  if (ctx.projectStepsDir) {
    const projectDir = path.join(ctx.repoRoot, ctx.projectStepsDir);
    const projectFiles = await listStepFilesInDir(projectDir);
    for (const f of projectFiles) {
      const id = f.replace(/\.step\.ya?ml$/, "");
      byId.set(id, {
        id,
        path: path.join(projectDir, f),
        scope: "project",
      });
    }
  }

  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * @param {string} dir
 */
async function listWorkflowFilesInDir(dir) {
  try {
    const files = await fs.readdir(dir);
    return files.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  } catch {
    return [];
  }
}

/**
 * @param {string} kitRoot
 * @param {string} repoRoot
 * @param {string} [projectWorkflowsDir]
 */
export async function listCatalogWorkflows(kitRoot, repoRoot, projectWorkflowsDir) {
  const entries = [];

  for (const f of await listWorkflowFilesInDir(path.join(kitRoot, "workflows"))) {
    entries.push({
      file: path.join("kit", "workflows", f),
      abs: path.join(kitRoot, "workflows", f),
      scope: "kit",
    });
  }

  if (projectWorkflowsDir) {
    const projectDir = path.join(repoRoot, projectWorkflowsDir);
    for (const f of await listWorkflowFilesInDir(projectDir)) {
      entries.push({
        file: path.join(projectWorkflowsDir, f),
        abs: path.join(projectDir, f),
        scope: "project",
      });
    }
  }

  return entries.sort((a, b) => a.file.localeCompare(b.file));
}
