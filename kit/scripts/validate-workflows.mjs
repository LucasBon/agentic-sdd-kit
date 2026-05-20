#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { parse as parseYaml } from "yaml";
import { resolveWorkflow } from "../bootstrap/resolve-workflow-steps.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const KIT_ROOT = path.join(REPO_ROOT, "kit");
const WORKFLOWS_DIR = path.join(KIT_ROOT, "workflows");
const STEPS_DIR = path.join(KIT_ROOT, "steps");
const WORKFLOW_SCHEMA_PATH = path.join(KIT_ROOT, "schema", "workflow.schema.json");
const STEP_SCHEMA_PATH = path.join(KIT_ROOT, "schema", "step.schema.json");

async function loadSchema(schemaPath) {
  return JSON.parse(await fs.readFile(schemaPath, "utf8"));
}

async function validateSteps(ajv) {
  const schema = await loadSchema(STEP_SCHEMA_PATH);
  const validate = ajv.compile(schema);
  const files = (await fs.readdir(STEPS_DIR)).filter(
    (f) => f.endsWith(".step.yaml") || f.endsWith(".step.yml")
  );
  if (files.length === 0) {
    console.warn(`No step files in ${STEPS_DIR}`);
    return true;
  }

  let failed = false;
  for (const f of files) {
    const full = path.join(STEPS_DIR, f);
    const doc = parseYaml(await fs.readFile(full, "utf8"));
    const ok = validate(doc);
    if (!ok) {
      failed = true;
      console.error(`Invalid step: ${path.relative(REPO_ROOT, full)}`);
      console.error(validate.errors);
    } else {
      console.log(`OK step: ${path.relative(REPO_ROOT, full)}`);
    }
  }
  return !failed;
}

async function validateWorkflowFiles(ajv) {
  const schema = await loadSchema(WORKFLOW_SCHEMA_PATH);
  const validate = ajv.compile(schema);
  const files = (await fs.readdir(WORKFLOWS_DIR)).filter(
    (f) => f.endsWith(".yaml") || f.endsWith(".yml")
  );

  let failed = false;
  for (const f of files) {
    const full = path.join(WORKFLOWS_DIR, f);
    const doc = parseYaml(await fs.readFile(full, "utf8"));
    const ok = validate(doc);
    if (!ok) {
      failed = true;
      console.error(`Invalid workflow: ${path.relative(REPO_ROOT, full)}`);
      console.error(validate.errors);
      continue;
    }

    try {
      const { resolved, format } = await resolveWorkflow(KIT_ROOT, doc);
      const stepIds = new Set(resolved.map((s) => s.id));
      if (doc.stages) {
        for (const stage of doc.stages) {
          for (const stepId of stage.steps || []) {
            if (!stepIds.has(stepId)) {
              failed = true;
              console.error(
                `${full}: stage ${stage.id} references unknown step ${stepId}`
              );
            }
          }
        }
      }
      console.log(
        `OK workflow: ${path.relative(REPO_ROOT, full)} (${format}, ${resolved.length} steps)`
      );
    } catch (err) {
      failed = true;
      console.error(`Workflow resolve failed: ${path.relative(REPO_ROOT, full)}`);
      console.error(err.message || err);
    }
  }
  return !failed;
}

async function main() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const stepsOk = await validateSteps(ajv);
  const workflowsOk = await validateWorkflowFiles(ajv);

  if (!stepsOk || !workflowsOk) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
