#!/usr/bin/env node
/**
 * Compose a project workflow from catalog step IDs (Path B).
 *
 * Usage:
 *   npm run compose-workflow -- --id my-flow --title "My flow" --steps a,b,c
 *   npm run compose-workflow -- --id my-flow --title "My flow" --steps a,b --parallel-stage review
 *   npm run compose-workflow -- --set-config   # also set workflowFile in id2s-kit.config.yaml
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stringify as stringifyYaml, parse as parseYaml } from "yaml";
import { loadKitConfig, pathExists } from "../bootstrap/load-kit-config.mjs";
import { buildCatalogContext, resolveWorkflow } from "../bootstrap/resolve-workflow-steps.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const KIT_ROOT = path.join(REPO_ROOT, "kit");

function parseArgs(argv) {
  const out = { setConfig: false, parallelStage: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--set-config") out.setConfig = true;
    else if (a === "--id") out.id = argv[++i];
    else if (a === "--title") out.title = argv[++i];
    else if (a === "--description") out.description = argv[++i];
    else if (a === "--steps") out.steps = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--parallel-stage") out.parallelStage = argv[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.id || !args.title || !args.steps?.length) {
    console.error(
      "Usage: compose-workflow --id <id> --title <title> [--description <text>] --steps id1,id2,... [--parallel-stage <stageId>] [--set-config]"
    );
    process.exit(1);
  }

  const config = await loadKitConfig(REPO_ROOT);
  const workflowsDir = path.join(REPO_ROOT, config.projectWorkflowsDir);
  await fs.mkdir(workflowsDir, { recursive: true });

  const ctx = buildCatalogContext(KIT_ROOT, REPO_ROOT, config);
  for (const stepId of args.steps) {
    const { resolveStepFilePath } = await import("../bootstrap/step-catalog.mjs");
    const found = await resolveStepFilePath(ctx, stepId);
    if (!found) {
      console.error(`Unknown step: ${stepId}. Run npm run list-catalog`);
      process.exit(1);
    }
  }

  let stages;
  if (args.parallelStage) {
    stages = [{ id: args.parallelStage, parallel: true, steps: args.steps }];
  } else {
    stages = args.steps.map((stepId, i) => ({
      id: `stage-${i + 1}`,
      parallel: false,
      steps: [stepId],
    }));
  }

  const workflow = {
    id: args.id,
    version: "1.0.0",
    title: args.title,
    description: args.description || `Composed workflow (${args.steps.join(" → ")})`,
    stages,
  };

  await resolveWorkflow(ctx, workflow);

  const outFile = path.join(workflowsDir, `${args.id}.yaml`);
  await fs.writeFile(outFile, stringifyYaml(workflow), "utf8");
  const rel = path.relative(REPO_ROOT, outFile).replace(/\\/g, "/");
  console.log(`Wrote workflow: ${rel}`);

  if (args.setConfig) {
    const configPath = path.join(REPO_ROOT, "id2s-kit.config.yaml");
    const cfg = parseYaml(await fs.readFile(configPath, "utf8"));
    cfg.workflowFile = rel;
    await fs.writeFile(configPath, stringifyYaml(cfg), "utf8");
    console.log(`Updated id2s-kit.config.yaml workflowFile: ${rel}`);
    console.log("Run: npm run validate-workflows && npm run bootstrap");
  } else {
    console.log(`Add to id2s-kit.config.yaml: workflowFile: ${rel}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
