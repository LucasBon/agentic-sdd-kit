#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { parse as parseYaml } from "yaml";
import { loadKitConfig, pathExists } from "../bootstrap/load-kit-config.mjs";
import { buildCatalogContext, resolveWorkflow } from "../bootstrap/resolve-workflow-steps.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const KIT_ROOT = path.join(REPO_ROOT, "kit");
const WORKFLOW_SCHEMA_PATH = path.join(KIT_ROOT, "schema", "workflow.schema.json");
const STEP_SCHEMA_PATH = path.join(KIT_ROOT, "schema", "step.schema.json");

async function loadSchema(schemaPath) {
  return JSON.parse(await fs.readFile(schemaPath, "utf8"));
}

async function listStepFiles(dir) {
  try {
    const files = await fs.readdir(dir);
    return files.filter((f) => f.endsWith(".step.yaml") || f.endsWith(".step.yml"));
  } catch {
    return [];
  }
}

async function validateStepsInDir(validate, dir, label) {
  const files = await listStepFiles(dir);
  if (files.length === 0) return true;

  let failed = false;
  for (const f of files) {
    const full = path.join(dir, f);
    const doc = parseYaml(await fs.readFile(full, "utf8"));
    const ok = validate(doc);
    if (!ok) {
      failed = true;
      console.error(`Invalid step (${label}): ${path.relative(REPO_ROOT, full)}`);
      console.error(validate.errors);
    } else {
      console.log(`OK step (${label}): ${path.relative(REPO_ROOT, full)}`);
    }
  }
  return !failed;
}

async function validateWorkflowFiles(ajv, config) {
  const schema = await loadSchema(WORKFLOW_SCHEMA_PATH);
  const validate = ajv.compile(schema);
  const ctx = buildCatalogContext(KIT_ROOT, REPO_ROOT, config);

  const dirs = [
    { dir: path.join(KIT_ROOT, "workflows"), label: "kit" },
    { dir: path.join(REPO_ROOT, config.projectWorkflowsDir), label: "project" },
  ];

  let failed = false;

  for (const { dir, label } of dirs) {
    if (!(await pathExists(dir))) continue;

    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

    for (const f of files) {
      const full = path.join(dir, f);
      const doc = parseYaml(await fs.readFile(full, "utf8"));
      const ok = validate(doc);
      if (!ok) {
        failed = true;
        console.error(`Invalid workflow (${label}): ${path.relative(REPO_ROOT, full)}`);
        console.error(validate.errors);
        continue;
      }

      try {
        const { resolved, format } = await resolveWorkflow(ctx, doc);
        const stepIds = new Set(resolved.map((s) => s.id));
        if (doc.stages) {
          for (const stage of doc.stages) {
            for (const stepId of stage.steps || []) {
              if (!stepIds.has(stepId)) {
                failed = true;
                console.error(`${full}: stage ${stage.id} references unknown step ${stepId}`);
              }
            }
          }
        }
        console.log(
          `OK workflow (${label}): ${path.relative(REPO_ROOT, full)} (${format}, ${resolved.length} steps)`
        );
      } catch (err) {
        failed = true;
        console.error(`Workflow resolve failed (${label}): ${path.relative(REPO_ROOT, full)}`);
        console.error(err.message || err);
      }
    }
  }

  return !failed;
}

async function main() {
  const config = await loadKitConfig(REPO_ROOT);
  const ajv = new Ajv2020({ allErrors: true, strict: false });

  const stepSchema = await loadSchema(STEP_SCHEMA_PATH);
  const validateStep = ajv.compile(stepSchema);

  const kitStepsOk = await validateStepsInDir(validateStep, path.join(KIT_ROOT, "steps"), "kit");
  const projectStepsDir = path.join(REPO_ROOT, config.projectStepsDir);
  const projectStepsOk = (await pathExists(projectStepsDir))
    ? await validateStepsInDir(validateStep, projectStepsDir, "project")
    : true;

  const workflowsOk = await validateWorkflowFiles(ajv, config);

  if (!kitStepsOk || !projectStepsOk || !workflowsOk) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
