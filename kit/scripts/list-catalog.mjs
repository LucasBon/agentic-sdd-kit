#!/usr/bin/env node
/**
 * List kit + project workflows and steps (for Sebastian / Path B planning).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import fs from "node:fs/promises";
import { loadKitConfig } from "../bootstrap/load-kit-config.mjs";
import { listCatalogSteps, listCatalogWorkflows } from "../bootstrap/step-catalog.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const KIT_ROOT = path.join(REPO_ROOT, "kit");

async function main() {
  const config = await loadKitConfig(REPO_ROOT);
  const ctx = { kitRoot: KIT_ROOT, repoRoot: REPO_ROOT, projectStepsDir: config.projectStepsDir };

  console.log("## Workflows\n");
  const workflows = await listCatalogWorkflows(KIT_ROOT, REPO_ROOT, config.projectWorkflowsDir);
  for (const w of workflows) {
    const doc = parseYaml(await fs.readFile(w.abs, "utf8"));
    const kind = doc.stages ? `composed (${doc.stages.length} stages)` : `legacy (${doc.steps?.length || 0} inline steps)`;
    console.log(`- [${w.scope}] ${w.file} — ${doc.title} (${kind})`);
  }

  console.log("\n## Steps (project overrides kit)\n");
  const steps = await listCatalogSteps(ctx);
  for (const s of steps) {
    const doc = parseYaml(await fs.readFile(s.path, "utf8"));
    console.log(`- [${s.scope}] ${s.id} — ${doc.title} → ${doc.primary_role_skill}`);
  }

  console.log("\nSet active workflow in id2s-kit.config.yaml:");
  console.log("  workflowFile: <path from list above>");
  console.log("Then: npm run validate-workflows && npm run bootstrap");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
