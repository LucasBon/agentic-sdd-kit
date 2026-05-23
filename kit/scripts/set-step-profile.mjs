#!/usr/bin/env node
/**
 * Set engagement profile (coach | delivery) for active step(s) in _INDEX files.
 *
 * Usage:
 *   npm run set-step-profile -- --step vision-scope --profile delivery
 *   npm run set-step-profile -- --profile coach   # all active steps
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { loadKitConfig } from "../bootstrap/load-kit-config.mjs";
import {
  enrichRoleAssignment,
  normalizeEngagementProfile,
} from "../bootstrap/role-skill-ids.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--step") out.step = argv[++i];
    else if (argv[i] === "--profile") out.profile = argv[++i];
  }
  return out;
}

async function main() {
  const { step, profile } = parseArgs(process.argv);
  if (!profile) {
    console.error("Usage: set-step-profile --profile coach|delivery [--step <step-id>]");
    process.exit(1);
  }

  const normalized = normalizeEngagementProfile(profile);
  const config = await loadKitConfig(REPO_ROOT);
  const agentIndexPath = path.join(REPO_ROOT, config.agentReadyDir, "_INDEX.yaml");
  const index = parseYaml(await fs.readFile(agentIndexPath, "utf8"));
  const bindings = index.active_step_bindings || [];
  const activeIds = index.workflow_state?.active_step_ids || [];

  if (!bindings.length) {
    console.error("No active_step_bindings in index. Run bootstrap first.");
    process.exit(1);
  }

  const targetIds = step ? [step] : activeIds;
  if (!targetIds.length) {
    console.error("No active steps. Pass --step <id> or activate steps in workflow_state.");
    process.exit(1);
  }

  let updated = 0;
  index.active_step_bindings = bindings.map((b) => {
    if (!targetIds.includes(b.step_id)) return b;
    updated++;
    return enrichRoleAssignment(b, normalized);
  });

  if (!updated) {
    console.error(`No binding updated for step(s): ${targetIds.join(", ")}`);
    process.exit(1);
  }

  await fs.writeFile(agentIndexPath, stringifyYaml(index), "utf8");

  const humanIndexPath = path.join(REPO_ROOT, config.artifactsDir, "_INDEX.md");
  try {
    let raw = await fs.readFile(humanIndexPath, "utf8");
    for (const b of index.active_step_bindings) {
      if (!targetIds.includes(b.step_id)) continue;
      raw = raw.replace(
        new RegExp(`(\\| \\d+ \\| \`${b.step_id}\` \\|[^|]*\\|[^|]*\\| )coach( \\|)`, "g"),
        `$1${normalized}$2`
      );
    }
    await fs.writeFile(humanIndexPath, raw, "utf8");
  } catch {
    console.warn("Human _INDEX.md not patched — run bootstrap to refresh.");
  }

  for (const b of index.active_step_bindings.filter((x) => targetIds.includes(x.step_id))) {
    console.log(
      `${b.step_id}: engagement_profile=${b.engagement_profile}, assigned_role_skill=${b.assigned_role_skill}`
    );
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
