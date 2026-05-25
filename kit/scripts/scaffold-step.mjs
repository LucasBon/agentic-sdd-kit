#!/usr/bin/env node
/**
 * Scaffold a project step + human template + doc skill stub (Path B extensions).
 *
 * Usage:
 *   npm run scaffold-step -- --id security-review --title "Security review" \
 *     --role ask-role-architect --artifact docs/ask/security-review.md
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stringify as stringifyYaml } from "yaml";
import { loadKitConfig, pathExists } from "../bootstrap/load-kit-config.mjs";
import { normalizeEngagementProfile } from "../bootstrap/role-skill-ids.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--id") out.id = argv[++i];
    else if (a === "--title") out.title = argv[++i];
    else if (a === "--objective") out.objective = argv[++i];
    else if (a === "--role") out.role = argv[++i];
    else if (a === "--artifact") out.artifact = argv[++i];
    else if (a === "--input") {
      out.inputs = out.inputs || [];
      out.inputs.push(argv[++i]);
    } else if (a === "--profile") out.profile = argv[++i];
  }
  return out;
}

function docSkillId(stepId) {
  return `ask-doc-${stepId}`;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.id || !args.title || !args.role || !args.artifact) {
    console.error(
      "Usage: scaffold-step --id <kebab-id> --title <title> --role ask-role-* --artifact docs/ask/<file>.md [--profile coach|delivery] [--objective <text>] [--input path]"
    );
    process.exit(1);
  }

  const config = await loadKitConfig(REPO_ROOT);
  const stepsDir = path.join(REPO_ROOT, config.projectStepsDir);
  const templatesDir = path.join(REPO_ROOT, config.projectTemplatesDir);
  const docSkillDir = path.join(REPO_ROOT, "kit", "skills", docSkillId(args.id));

  const stepPath = path.join(stepsDir, `${args.id}.step.yaml`);
  if (await pathExists(stepPath)) {
    console.error(`Step already exists: ${stepPath}`);
    process.exit(1);
  }

  const baseName = path.basename(args.artifact, ".md");
  const templateRel = path.join(config.projectTemplatesDir, `${baseName}.md.template`).replace(/\\/g, "/");
  const templateAbs = path.join(REPO_ROOT, templateRel);

  const inputs = (args.inputs || []).map((p) => ({
    kind: "artifact",
    path: p,
    required: true,
    description: `Requires ${p}`,
  }));

  const step = {
    id: args.id,
    version: "1.0.0",
    title: args.title,
    objective: args.objective || `Complete ${args.title} for the project.`,
    primary_role_skill: args.role,
    engagement_profile: normalizeEngagementProfile(args.profile),
    doc_skill: docSkillId(args.id),
    inputs,
    outputs: [{ path: args.artifact.replace(/\\/g, "/"), template: templateRel }],
    completion_criteria: [
      `${args.title} content is validated with the user.`,
      "Handoff pack lists concrete next actions.",
    ],
  };

  await fs.mkdir(stepsDir, { recursive: true });
  await fs.mkdir(templatesDir, { recursive: true });
  await fs.writeFile(stepPath, stringifyYaml(step), "utf8");

  const templateBody = `---
ask_document: ${baseName}
current_version: 1
locale: ${config.documentationLanguage}
workflow_step: ${args.id}
---

# ${args.title}

## Summary

_TBD_

## Handoff pack

- TBD
`;

  await fs.writeFile(templateAbs, templateBody, "utf8");

  if (!(await pathExists(docSkillDir))) {
    await fs.mkdir(docSkillDir, { recursive: true });
    const skillMd = `---
name: ${docSkillId(args.id)}
description: Produce or update \`${path.basename(args.artifact)}\` for workflow step ${args.id}.
---

# Skill: Document — ${args.title} (\`${docSkillId(args.id)}\`)

## Goal

Complete \`${path.basename(args.artifact)}\` following the active workflow step **${args.id}**.

## Paths

- **Write**: \`${args.artifact}\`
- **Template**: \`${templateRel}\`
- **Read**: \`_INDEX.yaml\` for \`active_step_bindings\`

## Completion criteria

Use \`${config.projectStepsDir}/${args.id}.step.yaml\` when the step is active.

## Versioning

Run \`npm run sync-agent-ready -- ${args.artifact}\` after edits.
`;
    await fs.writeFile(path.join(docSkillDir, "SKILL.md"), skillMd, "utf8");
    console.log(`Wrote doc skill stub: kit/skills/${docSkillId(args.id)}/SKILL.md`);
    console.log("Run npm run bootstrap to copy doc skills to .cursor/skills/");
  } else {
    console.log(`Doc skill already exists: ${docSkillDir}`);
  }

  console.log(`Wrote step: ${path.relative(REPO_ROOT, stepPath)}`);
  console.log(`Wrote template: ${path.relative(REPO_ROOT, templateAbs)}`);
  console.log("Next: npm run compose-workflow ... or add step to workflows/<id>.yaml");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
