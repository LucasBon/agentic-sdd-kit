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
import { resolveWorkflow, workflowForBootstrap } from "./resolve-workflow-steps.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULTS = {
  locale: "es",
  artifactsDir: "docs/id2s",
  agentReadyDir: "agent-ready-docs/id2s",
  skillsTargetDir: ".cursor/skills",
  kitVersion: "2.0.0",
};

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

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
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

function renderIndex({ config, workflow, workflowFile }) {
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
  lines.push(`locale: "${config.locale}"`);
  lines.push(`generated_by: bootstrap`);
  lines.push("---");
  lines.push("");
  lines.push("# Índice ID2S (`_INDEX`)");
  lines.push("");
  if (!workflow) {
    lines.push(
      "Workflow **pendiente**. Invocá la skill `id2s-role-project-manager` (Sebastian) para elegir el workflow del catálogo `kit/workflows/` y activarlo en `id2s-kit.config.yaml`."
    );
    lines.push("");
    lines.push("Luego ejecutá: `npm run bootstrap`");
    return lines.join("\n");
  }
  lines.push(
    "Este archivo es la **fuente de verdad operativa** para humanos y agentes: resume el workflow activo, rutas de artefactos y criterios de avance."
  );
  lines.push("");
  lines.push("## Configuración");
  lines.push("");
  lines.push(`- **Locale**: ${config.locale}`);
  lines.push(`- **Workflow**: \`${workflowFile.replace(/\\/g, "/")}\` (${workflow.title})`);
  lines.push(`- **Artefactos humanos**: \`${config.artifactsDir}\``);
  lines.push(`- **Agent-ready**: \`${config.agentReadyDir}\``);
  lines.push("");
  if (workflow.stages?.length) {
    lines.push("## Etapas del workflow");
    lines.push("");
    for (const stage of workflow.stages) {
      const parallelLabel = stage.parallel ? "sí (paralelo)" : "no";
      lines.push(`### Etapa \`${stage.id}\` (paralelo: ${parallelLabel})`);
      lines.push("");
      lines.push("| Orden | Step ID | Rol principal | Artefacto | Doc skill |");
      lines.push("|------:|---------|---------------|-----------|-----------|");
      for (const s of stage.steps || []) {
        lines.push(
          `| ${s.order} | \`${s.id}\` | \`${s.primary_role_skill || "—"}\` | \`${s.artifact_path || ""}\` | \`${s.doc_skill}\` |`
        );
      }
      lines.push("");
    }
  }

  lines.push("## Pasos y artefactos");
  lines.push("");
  lines.push("| Orden | Step ID | Título | Rol principal | Artefacto principal | Skill de documento |");
  lines.push("|------:|---------|--------|---------------|---------------------|--------------------|");
  for (const step of workflow.steps || []) {
    const mainOut = step.outputs?.[0]?.path || "";
    const role = step.primary_role_skill || "—";
    lines.push(
      `| ${step.order} | \`${step.id}\` | ${step.title} | \`${role}\` | \`${mainOut}\` | \`${step.doc_skill}\` |`
    );
  }
  lines.push("");
  lines.push("## Criterios de completitud (resumen)");
  lines.push("");
  for (const step of workflow.steps || []) {
    lines.push(`### ${step.id}`);
    lines.push("");
    for (const c of step.completion_criteria || []) {
      lines.push(`- ${c}`);
    }
    lines.push("");
  }
  lines.push("## Decisiones globales (rellenar)");
  lines.push("");
  lines.push("- **Stack / runtime**:");
  lines.push("- **Entornos** (dev/stage/prod):");
  lines.push("- **Compliance / datos personales**:");
  lines.push("- **Enlaces** (board, designs, contratos):");
  lines.push("");
  return lines.join("\n");
}

function renderAgentReadyIndex({ config, workflow, workflowFile }) {
  const doc = {
    id2s_kit_version: config.kitVersion,
    locale: config.locale,
    artifacts_dir: config.artifactsDir,
    agent_ready_dir: config.agentReadyDir,
    generated_by: "bootstrap",
  };
  if (workflow) {
    doc.workflow = {
      id: workflow.id,
      version: workflow.version,
      title: workflow.title,
      file: workflowFile.replace(/\\/g, "/"),
      format: workflow.format || "legacy",
    };
    if (workflow.stages?.length) {
      doc.stages = workflow.stages;
    }
    doc.steps = (workflow.steps || []).map((step) => ({
      order: step.order,
      id: step.id,
      title: step.title,
      stage_id: step.stage_id || null,
      stage_parallel: step.stage_parallel ?? false,
      primary_role_skill: step.primary_role_skill || null,
      artifact_path: step.outputs?.[0]?.path || null,
      agent_ready_path:
        step.outputs?.[0]?.agent_ready_path ||
        (step.outputs?.[0]?.path
          ? `${config.agentReadyDir}/${path.basename(step.outputs[0].path, ".md")}.agent.yaml`
          : null),
      doc_skill: step.doc_skill,
      suggested_role_skills: step.suggested_role_skills,
      inputs: step.inputs || [],
    }));
  } else {
    doc.workflow = { status: "pending", hint: "Invoke id2s-role-project-manager (Sebastian)" };
    doc.steps = [];
  }
  return stringifyYaml(doc);
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
description: Al trabajar con ID2S/DDD del kit, respetar docs humanos y sincronizar agent-ready.
globs:
  - docs/id2s/**
  - agent-ready-docs/id2s/**
alwaysApply: false
---

# ID2S Kit (Intive Domain To Spec Driven Develop)

## Artefactos humanos (\`docs/id2s/\`)

1. Abrir y respetar \`docs/id2s/_INDEX.md\` como mapa del workflow y rutas canónicas.
2. Al modificar sustancialmente un documento, incrementar \`current_version\` en frontmatter y añadir entrada en \`versions\` (solo metadatos: fecha, autor, resumen).
3. No contradecir decisiones ya volcadas en artefactos previos; si cambian, actualizar el documento y el handoff.

## Agent-ready (\`agent-ready-docs/id2s/\`)

1. Tras editar un artefacto humano, ejecutar \`npm run sync-agent-ready -- <ruta-del-md>\` (o \`--all\`).
2. Los agentes leen **agent-ready** para contexto; los humanos editan **docs/id2s** como fuente de verdad.
3. Cada \`.agent.yaml\` debe referenciar \`meta.source_version\` alineado a \`current_version\` del documento fuente.

## Skills

- Documentos: \`id2s-doc-*\` para producir cada artefacto.
- Roles: \`id2s-role-*\` para coaching; \`id2s-role-project-manager\` (Sebastian) para definir y navegar el workflow.
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
      locale: meta.locale ?? "es",
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
    throw new Error(`No se encontró la carpeta kit/ en ${repoRoot}. Ejecutá el bootstrap desde la raíz del monorepo.`);
  }

  await ensureProjectConfig(repoRoot, dryRun);
  const configPath = path.join(repoRoot, "id2s-kit.config.yaml");
  const exampleCfgPath = path.join(repoRoot, "kit", "bootstrap", "id2s-kit.config.example.yaml");
  let userCfg = {};
  if (await pathExists(configPath)) {
    userCfg = await readYamlFile(configPath);
  } else if (dryRun && (await pathExists(exampleCfgPath))) {
    userCfg = await readYamlFile(exampleCfgPath);
  }
  const config = mergeShallow(DEFAULTS, userCfg);

  let workflow = null;
  let workflowPathRel = null;
  if (config.workflowFile) {
    const workflowPath = path.isAbsolute(config.workflowFile)
      ? config.workflowFile
      : path.join(repoRoot, config.workflowFile);
    if (!(await pathExists(workflowPath))) {
      console.warn(`Workflow configurado no encontrado: ${workflowPath} — continuando sin workflow.`);
    } else {
      const rawWorkflow = await readYamlFile(workflowPath);
      const { resolved, stages, format } = await resolveWorkflow(kitRoot, rawWorkflow);
      workflow = workflowForBootstrap(rawWorkflow, resolved, stages);
      workflow.format = format;
      workflowPathRel = path.relative(repoRoot, workflowPath).replace(/\\/g, "/");
      console.log(`Workflow resolved (${format}): ${workflow.steps.length} step(s)`);
    }
  } else {
    console.log("Sin workflowFile en config — índice stub; usá id2s-role-project-manager (Sebastian).");
  }

  const skillsSrc = path.join(kitRoot, "skills");
  const skillsDest = path.join(repoRoot, config.skillsTargetDir);
  console.log(`Resolve role skills -> ${path.relative(repoRoot, skillsDest)}`);
  await resolveRoleSkills({ kitRoot, skillsSrc, skillsDest, dryRun });
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

        const agentRel =
          out.agent_ready_path ||
          `${config.agentReadyDir}/${path.basename(out.path, ".md")}.agent.yaml`;
        const agentDest = path.isAbsolute(agentRel)
          ? agentRel
          : path.join(repoRoot, agentRel);
        if (!force && (await pathExists(agentDest))) continue;
        await createAgentReadyStub(
          agentDest,
          out.path,
          { id: step.id, workflow_step: step.id, locale: config.locale, source_version: 1 },
          { dryRun }
        );
      }
    }
  }

  const indexPath = path.join(artifactsDir, "_INDEX.md");
  const indexMd = renderIndex({
    config,
    workflow,
    workflowFile: workflowPathRel || "(pending)",
  });
  if (dryRun) {
    console.log(`[dry-run] would write ${path.relative(repoRoot, indexPath)}`);
  } else {
    await fs.writeFile(indexPath, indexMd, "utf8");
    console.log(`Wrote ${path.relative(repoRoot, indexPath)}`);
  }

  const agentIndexPath = path.join(agentReadyDir, "_INDEX.yaml");
  const agentIndexYaml = renderAgentReadyIndex({
    config,
    workflow,
    workflowFile: workflowPathRel || "(pending)",
  });
  if (dryRun) {
    console.log(`[dry-run] would write ${path.relative(repoRoot, agentIndexPath)}`);
  } else {
    await fs.writeFile(agentIndexPath, agentIndexYaml, "utf8");
    console.log(`Wrote ${path.relative(repoRoot, agentIndexPath)}`);
  }

  await ensureCursorRule(repoRoot, dryRun);

  if (workflow && !dryRun) {
    console.log("Tip: ejecutá `npm run sync-agent-ready -- --all` tras completar contenido en docs.");
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
