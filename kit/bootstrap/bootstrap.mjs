#!/usr/bin/env node
/**
 * ID2S Kit bootstrap: resuelve skills de rol, copia skills de documento,
 * inicializa plantillas en docs/id2s, genera índices y agent-ready stubs.
 *
 * Uso: node kit/bootstrap/bootstrap.mjs [--force] [--dry-run] [--repo-root <path>]
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { resolveRoleSkills, copyDocSkills } from "./resolve-role-skills.mjs";
import { agentReadyPathFromArtifact } from "./agent-ready-path.mjs";
import { CONFIG_DEFAULTS, loadKitConfig, pathExists } from "./load-kit-config.mjs";
import { resolveWorkflow, workflowForBootstrap, buildCatalogContext } from "./resolve-workflow-steps.mjs";
import { listCatalogSteps, listCatalogWorkflows } from "./step-catalog.mjs";
import {
  buildStepSequence,
  buildTransitions,
  initialWorkflowState,
  mergeWorkflowState,
  buildMermaidDiagram,
  activeStepBindings,
  mergeActiveBindings,
  renderHumanIndex,
  renderAgentReadyIndex,
} from "./render-workflow-index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULTS = CONFIG_DEFAULTS;

function parseArgs(argv) {
  const out = { force: false, dryRun: false, repoRoot: process.cwd() };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") out.force = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--repo-root") {
      out.repoRoot = path.resolve(argv[++i] || "");
    }
  }
  return out;
}

async function readYamlFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return parseYaml(raw);
}

function mergeShallow(base, overlay) {
  return { ...base, ...overlay };
}

async function copyFileIfMissingOrForce(from, to, { dryRun, force }) {
  if (!force && (await pathExists(to))) return "skipped";
  if (dryRun) {
    console.log(`[dry-run] copy ${from} -> ${to}`);
    return "copied";
  }
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
  return "copied";
}

async function loadExistingAgentIndex(agentIndexPath) {
  try {
    const raw = await fs.readFile(agentIndexPath, "utf8");
    return parseYaml(raw);
  } catch {
    return null;
  }
}

async function ensureProjectConfig(repoRoot, dryRun) {
  const legacy = path.join(repoRoot, "sdd-kit.config.yaml");
  const target = path.join(repoRoot, "id2s-kit.config.yaml");
  const example = path.join(repoRoot, "kit", "bootstrap", "id2s-kit.config.example.yaml");

  if ((await pathExists(legacy)) && !(await pathExists(target))) {
    if (dryRun) {
      console.log(`[dry-run] would migrate ${legacy} -> ${target}`);
    } else {
      const raw = await fs.readFile(legacy, "utf8");
      const migrated = raw
        .replace(/sdd-kit/g, "id2s-kit")
        .replace(/docs\/sdd/g, "docs/id2s")
        .replace(/agentReadyDir:.*/g, "agentReadyDir: agent-ready-docs/id2s");
      await fs.writeFile(target, migrated.includes("agentReadyDir") ? migrated : `${migrated.trim()}\nagentReadyDir: agent-ready-docs/id2s\n`, "utf8");
      console.log(`Migrated ${path.relative(repoRoot, legacy)} -> id2s-kit.config.yaml`);
    }
  }

  if (await pathExists(target)) return target;
  if (dryRun) {
    console.log(`[dry-run] would create ${target} from example`);
    return target;
  }
  await fs.copyFile(example, target);
  console.log(`Created ${path.relative(repoRoot, target)} from kit/bootstrap example.`);
  return target;
}

async function ensureCursorRule(repoRoot, dryRun) {
  const rulePath = path.join(repoRoot, ".cursor", "rules", "id2s-kit.mdc");
  const body = `---
description: When working with ID2S kit artifacts, respect human docs and sync agent-ready.
globs:
  - docs/id2s/**
  - agent-ready-docs/id2s/**
alwaysApply: false
---

# ID2S Kit (Intive Domain To Spec Driven Develop)

## Human artifacts (\`docs/id2s/\`)

1. Use \`docs/id2s/_INDEX.md\` for workflow **runtime state** (aligned with agent-ready index).
2. Step definitions live in \`kit/workflows/\` and \`kit/steps/\` — not duplicated in the index.
3. On substantial edits, bump \`current_version\` in frontmatter and add a \`versions\` entry.
4. Do not contradict prior documented decisions; update artifacts and handoff when they change.

## Agent-ready (\`agent-ready-docs/id2s/\`)

1. After editing a human artifact, run \`npm run sync-agent-ready -- <path-to-md>\` (or \`--all\`).
2. Agents read **agent-ready** for context; humans edit **docs/id2s** as source of truth.
3. Each \`.agent.yaml\` should reference \`meta.source_version\` aligned to the source \`current_version\`.

## Skills

- Documents: \`id2s-doc-*\` to produce each artifact (domain specialists).
- Orchestrator: \`id2s-role-project-manager\` (Sebastian) — workflow config and index state only.
- Domain specialists: \`id2s-role-*\` (coach) and \`id2s-role-*-delivery\` from \`role-agent.SKILL.md.template\` / \`role-agent-delivery.SKILL.md.template\`.
- Step \`engagement_profile\` in \`kit/steps/*.step.yaml\` (\`coach\` | \`delivery\`); runtime override via \`npm run set-step-profile\`.

## Languages (\`id2s-kit.config.yaml\`)

- \`agentConversationLanguage\` — coaching dialogue.
- \`documentationLanguage\` — human artifact content.
`;
  if (dryRun) {
    console.log(`[dry-run] would write ${rulePath}`);
    return;
  }
  await fs.mkdir(path.dirname(rulePath), { recursive: true });
  await fs.writeFile(rulePath, body, "utf8");
  console.log(`Wrote ${path.relative(repoRoot, rulePath)}`);
}

async function createAgentReadyStub(destPath, sourcePath, meta, { dryRun }) {
  const stub = {
    meta: {
      id: meta.id,
      source_path: sourcePath.replace(/\\/g, "/"),
      source_version: meta.source_version ?? 1,
      locale: meta.locale ?? "en",
      workflow_step: meta.workflow_step ?? meta.id,
      updated_at: new Date().toISOString(),
    },
    content: {},
    handoff: {},
    open_questions: [],
  };
  if (dryRun) {
    console.log(`[dry-run] agent-ready stub ${destPath}`);
    return;
  }
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, stringifyYaml(stub), "utf8");
}

async function main() {
  const { force, dryRun, repoRoot } = parseArgs(process.argv);
  const kitRoot = path.join(repoRoot, "kit");

  if (!(await pathExists(kitRoot))) {
    throw new Error(`kit/ folder not found at ${repoRoot}. Run bootstrap from the repository root.`);
  }

  await ensureProjectConfig(repoRoot, dryRun);
  const config = await loadKitConfig(repoRoot);
  await fs.mkdir(path.join(repoRoot, config.projectWorkflowsDir), { recursive: true }).catch(() => {});
  await fs.mkdir(path.join(repoRoot, config.projectStepsDir), { recursive: true }).catch(() => {});
  await fs.mkdir(path.join(repoRoot, config.projectTemplatesDir), { recursive: true }).catch(() => {});

  let workflow = null;
  let workflowPathRel = null;
  if (config.workflowFile) {
    const workflowPath = path.isAbsolute(config.workflowFile)
      ? config.workflowFile
      : path.join(repoRoot, config.workflowFile);
    if (!(await pathExists(workflowPath))) {
      console.warn(`Configured workflow not found: ${workflowPath} — continuing without workflow.`);
    } else {
      const rawWorkflow = await readYamlFile(workflowPath);
      const ctx = buildCatalogContext(kitRoot, repoRoot, config);
      const { resolved, stages, format } = await resolveWorkflow(ctx, rawWorkflow);
      workflow = workflowForBootstrap(rawWorkflow, resolved, stages);
      workflow.format = format;
      workflowPathRel = path.relative(repoRoot, workflowPath).replace(/\\/g, "/");
      console.log(`Workflow resolved (${format}): ${workflow.steps.length} step(s)`);
    }
  } else {
    console.log("No workflowFile in config — index stub; use id2s-role-project-manager (Sebastian).");
  }

  const skillsSrc = path.join(kitRoot, "skills");
  const skillsDest = path.join(repoRoot, config.skillsTargetDir);
  console.log(`Resolve role skills -> ${path.relative(repoRoot, skillsDest)}`);
  await resolveRoleSkills({ kitRoot, skillsSrc, skillsDest, dryRun, kitConfig: config });
  console.log(`Copy doc skills -> ${path.relative(repoRoot, skillsDest)}`);
  await copyDocSkills({ skillsSrc, skillsDest, dryRun });

  const artifactsDir = path.join(repoRoot, config.artifactsDir);
  const agentReadyDir = path.join(repoRoot, config.agentReadyDir);
  if (!dryRun) {
    await fs.mkdir(artifactsDir, { recursive: true });
    await fs.mkdir(agentReadyDir, { recursive: true });
  }

  if (workflow) {
    for (const step of workflow.steps || []) {
      for (const out of step.outputs || []) {
        if (!out.template) continue;
        const tplPath = path.join(repoRoot, out.template);
        const destPath = path.join(repoRoot, out.path);
        const res = await copyFileIfMissingOrForce(tplPath, destPath, { dryRun, force });
        if (res === "copied") {
          console.log(`Artifact ${path.relative(repoRoot, destPath)} (${step.id})`);
        } else {
          console.log(`Skip existing artifact ${path.relative(repoRoot, destPath)} (use --force)`);
        }

        const agentRel = agentReadyPathFromArtifact(out.path, config.agentReadyDir);
        const agentDest = path.isAbsolute(agentRel)
          ? agentRel
          : path.join(repoRoot, agentRel);
        if (!force && (await pathExists(agentDest))) continue;
        await createAgentReadyStub(
          agentDest,
          out.path,
          {
            id: step.id,
            workflow_step: step.id,
            locale: config.documentationLanguage,
            source_version: 1,
          },
          { dryRun }
        );
      }
    }
  }

  const agentIndexPath = path.join(agentReadyDir, "_INDEX.yaml");
  const existingIndex = await loadExistingAgentIndex(agentIndexPath);
  const stepSequence = workflow ? buildStepSequence(workflow.steps) : [];
  const transitions = workflow ? buildTransitions(workflow.steps, workflow.stages) : [];
  const freshState = workflow
    ? initialWorkflowState(workflow.steps, workflow.stages)
    : initialWorkflowState([], null);
  const workflowState = mergeWorkflowState(
    existingIndex?.workflow_state,
    workflow?.id,
    existingIndex?.workflow?.id,
    freshState
  );
  let activeBindings = workflow
    ? activeStepBindings(workflow.steps, workflowState.active_step_ids, config)
    : [];
  if (workflow && existingIndex?.active_step_bindings?.length) {
    activeBindings = mergeActiveBindings(activeBindings, existingIndex.active_step_bindings);
  }
  const mermaid = workflow ? buildMermaidDiagram(workflow.steps, workflow.stages) : buildMermaidDiagram([], null);

  const catalogCtx = buildCatalogContext(kitRoot, repoRoot, config);
  const catalog = {
    workflows: (await listCatalogWorkflows(kitRoot, repoRoot, config.projectWorkflowsDir)).map(
      (w) => ({ file: w.file, scope: w.scope })
    ),
    steps: (await listCatalogSteps(catalogCtx)).map((s) => ({ id: s.id, scope: s.scope })),
  };

  const indexPath = path.join(artifactsDir, "_INDEX.md");
  const indexMd = renderHumanIndex({
    config,
    workflow,
    workflowFile: workflowPathRel || "(pending)",
    workflowState,
    transitions,
    mermaid,
    stepSequence,
    catalog,
  });
  if (dryRun) {
    console.log(`[dry-run] would write ${path.relative(repoRoot, indexPath)}`);
  } else {
    await fs.writeFile(indexPath, indexMd, "utf8");
    console.log(`Wrote ${path.relative(repoRoot, indexPath)}`);
  }

  const agentIndexDoc = renderAgentReadyIndex({
    config,
    workflow,
    workflowFile: workflowPathRel || "(pending)",
    workflowState,
    transitions,
    stepSequence,
    activeBindings,
    catalog,
  });
  const agentIndexYaml = stringifyYaml(agentIndexDoc);
  if (dryRun) {
    console.log(`[dry-run] would write ${path.relative(repoRoot, agentIndexPath)}`);
  } else {
    await fs.writeFile(agentIndexPath, agentIndexYaml, "utf8");
    console.log(`Wrote ${path.relative(repoRoot, agentIndexPath)}`);
  }

  await ensureCursorRule(repoRoot, dryRun);

  if (workflow && !dryRun) {
    console.log("Tip: run `npm run sync-agent-ready -- --all` after updating human docs.");
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
