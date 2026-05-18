#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { parse as parseYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const WORKFLOWS_DIR = path.join(REPO_ROOT, "kit", "workflows");
const SCHEMA_PATH = path.join(REPO_ROOT, "kit", "schema", "workflow.schema.json");

async function main() {
  const schemaRaw = await fs.readFile(SCHEMA_PATH, "utf8");
  const schema = JSON.parse(schemaRaw);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  const files = (await fs.readdir(WORKFLOWS_DIR)).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  if (files.length === 0) {
    throw new Error(`No workflow YAML files found in ${WORKFLOWS_DIR}`);
  }

  let failed = false;
  for (const f of files) {
    const full = path.join(WORKFLOWS_DIR, f);
    const doc = parseYaml(await fs.readFile(full, "utf8"));
    const ok = validate(doc);
    if (!ok) {
      failed = true;
      console.error(`Invalid workflow: ${path.relative(REPO_ROOT, full)}`);
      console.error(validate.errors);
    } else {
      console.log(`OK: ${path.relative(REPO_ROOT, full)}`);
    }
  }

  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
