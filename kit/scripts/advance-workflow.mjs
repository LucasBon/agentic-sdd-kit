#!/usr/bin/env node
/**
 * Advance workflow state in _INDEX files (Sebastian / CLI).
 * Usage: npm run advance-workflow -- --complete project-brief
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { loadKitConfig } from "../bootstrap/load-kit-config.mjs";
import { buildCatalogContext, resolveWorkflow } from "../bootstrap/resolve-workflow-steps.mjs";
import {
  buildStepSequence,
  buildTransitions,
  activeStepBindings,
  mergeActiveBindings,
  initialWorkflowState,
} from "../bootstrap/render-workflow-index.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const KIT_ROOT = path.join(REPO_ROOT, "kit");

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--complete") out.complete = argv[++i];
  }
  return out;
}

/**
 * @param {object[]} transitions
 * @param {string} justCompleted
 */
function findNextState(transitions, justCompleted) {
  for (const t of transitions) {
    if (t.type === "sequential" && t.from_step_id === justCompleted) {
      return {
        active_step_ids: [t.to_step_id],
        active_stage_id: null,
        status: "in_progress",
      };
    }
  }

  for (const t of transitions) {
    if (t.type === "workflow_end" && t.after_step_id === justCompleted) {
      return { active_step_ids: [], active_stage_id: null, status: "completed" };
    }
  }

  for (const t of transitions) {
    if (t.type !== "stage") continue;
    const idx = t.step_ids.indexOf(justCompleted);
    if (idx === -1) continue;
    if (t.parallel && idx < t.step_ids.length - 1) {
      return {
        active_step_ids: t.step_ids.slice(idx + 1, idx + 2),
        active_stage_id: t.stage_id,
        status: "in_progress",
      };
    }
    const next = t.next;
    if (next?.workflow_status === "completed") {
      return { active_step_ids: [], active_stage_id: null, status: "completed" };
    }
    if (next?.stage_id) {
      const nextStage = transitions.find((x) => x.type === "stage" && x.stage_id === next.stage_id);
      if (nextStage) {
        const active = nextStage.parallel ? nextStage.step_ids : [nextStage.step_ids[0]];
        return {
          active_step_ids: active,
          active_stage_id: next.stage_id,
          status: "in_progress",
        };
      }
    }
  }

  return null;
}

async function patchHumanIndexMd(indexPath, state) {
  let raw = await fs.readFile(indexPath, "utf8");
  const statusLine = `- **Status**: \`${state.status}\``;
  const activeLine = `- **Active step(s)**: ${
    state.active_step_ids?.length
      ? state.active_step_ids.map((id) => `\`${id}\``).join(", ")
      : "—"
  }`;
  const completedLine = `- **Completed**: ${
    state.completed_step_ids?.length
      ? state.completed_step_ids.map((id) => `\`${id}\``).join(", ")
      : "—"
  }`;

  raw = raw.replace(/- \*\*Status\*\*: `[^`]*`/, statusLine);
  raw = raw.replace(/- \*\*Active step\(s\)\*\*:.*\n/, `${activeLine}\n`);
  raw = raw.replace(/- \*\*Completed\*\*:.*\n/, `${completedLine}\n`);
  await fs.writeFile(indexPath, raw, "utf8");
}

async function main() {
  const { complete } = parseArgs(process.argv);
  if (!complete) {
    console.error("Usage: advance-workflow --complete <step-id>");
    process.exit(1);
  }

  const config = await loadKitConfig(REPO_ROOT);
  if (!config.workflowFile) {
    console.error("No workflowFile in ask-kit.config.yaml");
    process.exit(1);
  }

  const workflowPath = path.join(REPO_ROOT, config.workflowFile);
  const rawWorkflow = parseYaml(await fs.readFile(workflowPath, "utf8"));
  const ctx = buildCatalogContext(KIT_ROOT, REPO_ROOT, config);
  const { resolved, stages } = await resolveWorkflow(ctx, rawWorkflow);

  const agentIndexPath = path.join(REPO_ROOT, config.agentReadyDir, "_INDEX.yaml");
  const index = parseYaml(await fs.readFile(agentIndexPath, "utf8"));
  const state = index.workflow_state || initialWorkflowState(resolved, stages);

  if (!state.active_step_ids?.includes(complete)) {
    console.warn(`Step "${complete}" is not in active_step_ids: ${state.active_step_ids?.join(", ")}`);
  }

  const completed = [...new Set([...(state.completed_step_ids || []), complete])];
  const transitions = index.transitions || buildTransitions(resolved, stages);
  const next = findNextState(transitions, complete);

  if (!next) {
    console.error("Could not determine next step from transitions.");
    process.exit(1);
  }

  index.workflow_state = {
    ...state,
    ...next,
    completed_step_ids: completed,
    notes: `Advanced past ${complete} at ${new Date().toISOString()}`,
  };
  index.active_step_bindings = mergeActiveBindings(
    activeStepBindings(resolved, next.active_step_ids, config),
    index.active_step_bindings
  );

  await fs.writeFile(agentIndexPath, stringifyYaml(index), "utf8");

  const humanIndexPath = path.join(REPO_ROOT, config.artifactsDir, "_INDEX.md");
  await patchHumanIndexMd(humanIndexPath, index.workflow_state);

  console.log(`Completed: ${complete}`);
  console.log(`Active: ${next.active_step_ids.join(", ") || "(none)"}`);
  console.log(`Status: ${next.status}`);
  if (index.active_step_bindings?.[0]) {
    const b = index.active_step_bindings[0];
    console.log(
      `Next: profile=${b.engagement_profile}, skill=${b.assigned_role_skill}, doc=${b.doc_skill}`
    );
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
