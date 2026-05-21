#!/usr/bin/env node
/**
 * Builds aligned human (_INDEX.md) and agent-ready (_INDEX.yaml) workflow navigation.
 * Step definitions live only in kit/workflows/ and kit/steps/ — indices hold state + transitions.
 */

import { agentReadyPathFromArtifact } from "./agent-ready-path.mjs";

/**
 * @param {import("./resolve-workflow-steps.mjs").ResolvedStep[]} steps
 */
export function buildStepSequence(steps) {
  return (steps || []).map((s) => ({
    id: s.id,
    order: s.order,
    stage_id: s.stage_id ?? null,
    stage_parallel: !!s.stage_parallel,
    primary_role_skill: s.primary_role_skill ?? null,
    artifact_path: s.outputs?.[0]?.path ?? null,
    doc_skill: s.doc_skill ?? null,
  }));
}

/**
 * @param {import("./resolve-workflow-steps.mjs").ResolvedStep[]} steps
 * @param {object[] | null | undefined} stagesMeta
 */
export function buildTransitions(steps, stagesMeta) {
  const transitions = [];

  if (stagesMeta?.length) {
    for (let i = 0; i < stagesMeta.length; i++) {
      const stage = stagesMeta[i];
      const stageSteps = (stage.steps || []).map((s) => s.id);
      transitions.push({
        type: "stage",
        stage_id: stage.id,
        parallel: !!stage.parallel,
        step_ids: stageSteps,
        advance_when: "all_steps_completed",
        next:
          i < stagesMeta.length - 1
            ? { stage_id: stagesMeta[i + 1].id, activate: "first_step_of_stage" }
            : { workflow_status: "completed" },
      });
      for (let j = 0; j < stageSteps.length - 1; j++) {
        if (!stage.parallel) {
          transitions.push({
            type: "sequential",
            from_step_id: stageSteps[j],
            to_step_id: stageSteps[j + 1],
            advance_when: "step_completed",
          });
        }
      }
    }
    return transitions;
  }

  const ids = (steps || []).map((s) => s.id);
  for (let i = 0; i < ids.length - 1; i++) {
    transitions.push({
      type: "sequential",
      from_step_id: ids[i],
      to_step_id: ids[i + 1],
      advance_when: "step_completed",
    });
  }
  if (ids.length) {
    transitions.push({
      type: "workflow_end",
      after_step_id: ids[ids.length - 1],
      advance_when: "step_completed",
      workflow_status: "completed",
    });
  }
  return transitions;
}

/**
 * @param {import("./resolve-workflow-steps.mjs").ResolvedStep[]} steps
 * @param {object[] | null | undefined} stagesMeta
 */
export function initialWorkflowState(steps, stagesMeta) {
  if (!steps?.length) {
    return {
      status: "not_started",
      active_step_ids: [],
      completed_step_ids: [],
      notes: "No workflow configured. Use id2s-role-project-manager (Sebastian) to select a workflow.",
    };
  }

  if (stagesMeta?.length) {
    const firstStage = stagesMeta[0];
    const firstIds = (firstStage.steps || []).map((s) => s.id);
    const active =
      firstStage.parallel && firstIds.length > 1 ? firstIds : firstIds.slice(0, 1);
    return {
      status: "in_progress",
      active_stage_id: firstStage.id,
      active_step_ids: active,
      completed_step_ids: [],
      notes: null,
    };
  }

  return {
    status: "in_progress",
    active_stage_id: null,
    active_step_ids: [steps[0].id],
    completed_step_ids: [],
    notes: null,
  };
}

/**
 * @param {object} existingState
 * @param {string} workflowId
 * @param {string} existingWorkflowId
 * @param {ReturnType<typeof initialWorkflowState>} freshState
 */
export function mergeWorkflowState(existingState, workflowId, existingWorkflowId, freshState) {
  if (
    existingState &&
    existingWorkflowId === workflowId &&
    Array.isArray(existingState.active_step_ids) &&
    existingState.active_step_ids.length
  ) {
    return {
      ...freshState,
      ...existingState,
      status: existingState.status ?? freshState.status,
    };
  }
  return freshState;
}

/**
 * @param {import("./resolve-workflow-steps.mjs").ResolvedStep[]} steps
 * @param {object[] | null | undefined} stagesMeta
 */
export function buildMermaidDiagram(steps, stagesMeta) {
  if (!steps?.length) {
    return "```mermaid\nflowchart LR\n  pending[Workflow not configured]\n```";
  }

  const lines = ["```mermaid", "flowchart TD"];
  const ids = steps.map((s) => s.id.replace(/-/g, "_"));
  const idMap = Object.fromEntries(steps.map((s, i) => [s.id, ids[i]]));

  if (stagesMeta?.length) {
    for (const stage of stagesMeta) {
      const sid = stage.id.replace(/-/g, "_");
      lines.push(`  subgraph ${sid} ["${stage.id}${stage.parallel ? " (parallel)" : ""}"]`);
      for (const ref of stage.steps || []) {
        const node = idMap[ref.id] || ref.id.replace(/-/g, "_");
        const label = ref.id.replace(/_/g, " ");
        lines.push(`    ${node}["${label}"]`);
      }
      lines.push("  end");
      if (!stage.parallel) {
        const stageStepIds = (stage.steps || []).map((s) => s.id);
        for (let j = 0; j < stageStepIds.length - 1; j++) {
          lines.push(`  ${idMap[stageStepIds[j]]} --> ${idMap[stageStepIds[j + 1]]}`);
        }
      }
    }
    for (let i = 0; i < stagesMeta.length - 1; i++) {
      const lastStep = stagesMeta[i].steps?.[stagesMeta[i].steps.length - 1]?.id;
      const firstNext = stagesMeta[i + 1].steps?.[0]?.id;
      if (lastStep && firstNext) {
        lines.push(`  ${idMap[lastStep]} --> ${idMap[firstNext]}`);
      }
    }
  } else {
    for (const s of steps) {
      const node = idMap[s.id];
      lines.push(`  ${node}["${s.id}"]`);
    }
    for (let i = 0; i < steps.length - 1; i++) {
      lines.push(`  ${idMap[steps[i].id]} --> ${idMap[steps[i + 1].id]}`);
    }
  }

  lines.push("```");
  return lines.join("\n");
}

/**
 * Resolve bindings for active steps (paths only — details in workflow/step catalog).
 * @param {import("./resolve-workflow-steps.mjs").ResolvedStep[]} steps
 * @param {string[]} activeStepIds
 * @param {object} config
 */
export function activeStepBindings(steps, activeStepIds, config) {
  const byId = Object.fromEntries((steps || []).map((s) => [s.id, s]));
  return activeStepIds
    .filter((id) => byId[id])
    .map((id) => {
      const s = byId[id];
      const artifactPath = s.outputs?.[0]?.path ?? null;
      return {
        step_id: id,
        title: s.title,
        primary_role_skill: s.primary_role_skill ?? null,
        artifact_path: artifactPath,
        agent_ready_path: artifactPath
          ? agentReadyPathFromArtifact(artifactPath, config.agentReadyDir)
          : null,
        doc_skill: s.doc_skill ?? null,
        definition_ref:
          s.stage_id != null
            ? `kit/steps/${id}.step.yaml`
            : `workflow step inline or kit/steps/${id}.step.yaml`,
      };
    });
}

/**
 * @param {object} params
 */
export function renderHumanIndex({
  config,
  workflow,
  workflowFile,
  workflowState,
  transitions,
  mermaid,
  stepSequence,
  catalog,
}) {
  const lines = [];
  lines.push("---");
  lines.push(`id2s_kit_version: "${config.kitVersion}"`);
  if (workflow) {
    lines.push(`workflow_id: "${workflow.id}"`);
    lines.push(`workflow_version: "${workflow.version}"`);
    lines.push(`workflow_file: "${workflowFile.replace(/\\/g, "/")}"`);
  } else {
    lines.push(`workflow_id: pending`);
    lines.push(`workflow_file: null`);
  }
  lines.push(`agent_conversation_language: "${config.agentConversationLanguage}"`);
  lines.push(`documentation_language: "${config.documentationLanguage}"`);
  lines.push(`generated_by: bootstrap`);
  lines.push("---");
  lines.push("");
  lines.push("# ID2S workflow index (`_INDEX`)");
  lines.push("");
  if (!workflow) {
    lines.push(
      "Workflow **pending**. Use Sebastian (`id2s-role-project-manager`) or the commands below."
    );
    lines.push("");
    lines.push("### Path A — predefined workflow");
    lines.push("");
    lines.push("1. `npm run list-catalog`");
    lines.push("2. Set `workflowFile` in `id2s-kit.config.yaml` (kit or project workflow)");
    lines.push("3. `npm run validate-workflows && npm run bootstrap`");
    lines.push("");
    lines.push("### Path B — compose with Sebastian");
    lines.push("");
    lines.push("1. `npm run list-catalog` — pick steps");
    lines.push("2. `npm run compose-workflow -- --id <id> --title \"...\" --steps a,b,c --set-config`");
    lines.push("3. Optional: `npm run scaffold-step` for new steps/templates/doc skills");
    lines.push("4. `npm run validate-workflows && npm run bootstrap`");
    if (catalog?.workflows?.length) {
      lines.push("");
      lines.push("#### Available kit workflows");
      for (const w of catalog.workflows) lines.push(`- \`${w.file}\``);
    }
    if (catalog?.steps?.length) {
      lines.push("");
      lines.push("#### Available steps (kit + project)");
      for (const s of catalog.steps) lines.push(`- \`${s.id}\` [${s.scope}]`);
    }
    return lines.join("\n");
  }

  lines.push(
    "Operational map for humans and agents. **Step definitions** live in the workflow file and `kit/steps/` catalog — this index tracks **runtime state** and **transitions** only."
  );
  lines.push("");
  lines.push("## Configuration");
  lines.push("");
  lines.push(`- **Agent conversation language**: ${config.agentConversationLanguage}`);
  lines.push(`- **Documentation language**: ${config.documentationLanguage}`);
  lines.push(`- **Workflow definition**: \`${workflowFile.replace(/\\/g, "/")}\` (${workflow.title})`);
  lines.push(`- **Human artifacts**: \`${config.artifactsDir}\``);
  lines.push(`- **Agent-ready**: \`${config.agentReadyDir}\``);
  lines.push("");
  lines.push("## Workflow flow");
  lines.push("");
  lines.push(mermaid);
  lines.push("");
  lines.push("## Runtime state (Sebastian maintains)");
  lines.push("");
  lines.push(`- **Status**: \`${workflowState.status}\``);
  lines.push(
    `- **Active step(s)**: ${workflowState.active_step_ids?.length ? workflowState.active_step_ids.map((id) => `\`${id}\``).join(", ") : "—"}`
  );
  lines.push(
    `- **Completed**: ${workflowState.completed_step_ids?.length ? workflowState.completed_step_ids.map((id) => `\`${id}\``).join(", ") : "—"}`
  );
  if (workflowState.active_stage_id) {
    lines.push(`- **Active stage**: \`${workflowState.active_stage_id}\``);
  }
  lines.push("");
  lines.push("## Step sequence (reference only)");
  lines.push("");
  lines.push("| Order | Step ID | Stage | Parallel stage | Primary role | Artifact |");
  lines.push("|------:|---------|-------|----------------|--------------|----------|");
  for (const s of stepSequence || []) {
    lines.push(
      `| ${s.order} | \`${s.id}\` | ${s.stage_id ? `\`${s.stage_id}\`` : "—"} | ${s.stage_parallel ? "yes" : "no"} | \`${s.primary_role_skill || "—"}\` | \`${s.artifact_path || ""}\` |`
    );
  }
  lines.push("");
  lines.push("## Transitions");
  lines.push("");
  lines.push(
    "Advance when Sebastian confirms a step meets completion criteria defined in the workflow/step catalog. Specialists produce artifacts; Sebastian updates this index."
  );
  lines.push("");
  lines.push("```yaml");
  lines.push("# transitions (summary — full structure in agent-ready _INDEX.yaml)");
  for (const t of transitions || []) {
    if (t.type === "sequential") {
      lines.push(`- ${t.from_step_id} → ${t.to_step_id} when: ${t.advance_when}`);
    } else if (t.type === "stage") {
      lines.push(
        `- stage ${t.stage_id} (${t.parallel ? "parallel" : "sequential"}): [${t.step_ids.join(", ")}] when: ${t.advance_when}`
      );
    } else if (t.type === "workflow_end") {
      lines.push(`- after ${t.after_step_id}: workflow ${t.workflow_status}`);
    }
  }
  lines.push("```");
  lines.push("");
  lines.push("## Where to read step details");
  lines.push("");
  if (workflow.format === "composed") {
    lines.push("- Composed workflow: `kit/workflows/*.yaml` + per-step `kit/steps/<step-id>.step.yaml`");
  } else {
    lines.push("- Legacy workflow: inline steps in the workflow YAML file");
  }
  lines.push("- Agent mirror: `agent-ready-docs/id2s/_INDEX.yaml` (same state and transitions)");
  lines.push("");
  lines.push("## Global decisions (fill in)");
  lines.push("");
  lines.push("- **Stack / runtime**:");
  lines.push("- **Environments** (dev/stage/prod):");
  lines.push("- **Compliance / personal data**:");
  lines.push("- **Links** (board, designs, contracts):");
  lines.push("");
  return lines.join("\n");
}

/**
 * @param {object} params
 */
export function renderAgentReadyIndex({
  config,
  workflow,
  workflowFile,
  workflowState,
  transitions,
  stepSequence,
  activeBindings,
  catalog,
}) {
  const doc = {
    id2s_kit_version: config.kitVersion,
    agent_conversation_language: config.agentConversationLanguage,
    documentation_language: config.documentationLanguage,
    artifacts_dir: config.artifactsDir,
    agent_ready_dir: config.agentReadyDir,
    generated_by: "bootstrap",
  };

  if (!workflow) {
    doc.workflow = { status: "pending", hint: "Invoke id2s-role-project-manager (Sebastian)" };
    doc.workflow_state = initialWorkflowState([], null);
    doc.transitions = [];
    doc.step_sequence = [];
    doc.active_step_bindings = [];
    if (catalog) {
      doc.catalog_available = catalog;
    }
    doc.path_b = {
      list: "npm run list-catalog",
      compose: "npm run compose-workflow -- --id <id> --title <title> --steps a,b,c [--set-config]",
      scaffold_step: "npm run scaffold-step -- --id <id> --title <t> --role id2s-role-* --artifact docs/id2s/<f>.md",
    };
    return doc;
  }

  doc.workflow = {
    ref: workflowFile.replace(/\\/g, "/"),
    id: workflow.id,
    version: workflow.version,
    title: workflow.title,
    format: workflow.format || "legacy",
    stages: workflow.stages || undefined,
  };
  doc.step_sequence = stepSequence;
  doc.transitions = transitions;
  doc.workflow_state = workflowState;
  doc.active_step_bindings = activeBindings;
  doc.orchestrator_skill = "id2s-role-project-manager";
  return doc;
}
