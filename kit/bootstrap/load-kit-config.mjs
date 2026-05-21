#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";

export const CONFIG_DEFAULTS = {
  agentConversationLanguage: "en",
  documentationLanguage: "en",
  artifactsDir: "docs/id2s",
  agentReadyDir: "agent-ready-docs/id2s",
  skillsTargetDir: ".cursor/skills",
  projectWorkflowsDir: "workflows",
  projectStepsDir: "steps",
  projectTemplatesDir: "templates/id2s",
  kitVersion: "2.0.0",
};

export async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} repoRoot
 */
export async function loadKitConfig(repoRoot) {
  const configPath = path.join(repoRoot, "id2s-kit.config.yaml");
  let userCfg = {};
  if (await pathExists(configPath)) {
    userCfg = parseYaml(await fs.readFile(configPath, "utf8"));
  }
  return { ...CONFIG_DEFAULTS, ...userCfg, _repoRoot: repoRoot };
}

/**
 * @param {ReturnType<typeof loadKitConfig> extends Promise<infer T> ? T : never} config
 */
export function projectPaths(config) {
  const repoRoot = config._repoRoot;
  return {
    workflowsDir: path.join(repoRoot, config.projectWorkflowsDir),
    stepsDir: path.join(repoRoot, config.projectStepsDir),
    templatesDir: path.join(repoRoot, config.projectTemplatesDir),
  };
}
