#!/usr/bin/env node
/**
 * SDD Kit bootstrap: sincroniza skills a `.cursor/skills/`, inicializa plantillas en `docs/sdd/`
 * y genera `docs/sdd/_INDEX.md` a partir del workflow configurado.
 *
 * Uso: node kit/bootstrap/bootstrap.mjs [--force] [--dry-run] [--repo-root <path>]
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULTS = {
  locale: "es",
  workflowFile: "kit/workflows/green-field.v1.yaml",
  artifactsDir: "docs/sdd",
  skillsTargetDir: ".cursor/skills",
  kitVersion: "1.0.0",
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

async function copyDirRecursive(src, dest, { dryRun, force }) {
  const stat = await fs.stat(src);
  if (!stat.isDirectory()) throw new Error(`Not a directory: ${src}`);
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const ent of entries) {
    const from = path.join(src, ent.name);
    const to = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      await copyDirRecursive(from, to, { dryRun, force });
    } else if (ent.isFile()) {
      if (!force && (await pathExists(to))) continue;
      if (dryRun) {
        console.log(`[dry-run] copy ${from} -> ${to}`);
      } else {
        await fs.mkdir(path.dirname(to), { recursive: true });
        await fs.copyFile(from, to);
      }
    }
  }
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
  lines.push(`sdd_kit_version: "${config.kitVersion}"`);
  lines.push(`workflow_id: "${workflow.id}"`);
  lines.push(`workflow_version: "${workflow.version}"`);
  lines.push(`workflow_file: "${workflowFile.replace(/\\/g, "/")}"`);
  lines.push(`locale: "${config.locale}"`);
  lines.push(`generated_by: bootstrap`);
  lines.push("---");
  lines.push("");
  lines.push("# Índice SDD (`_INDEX`)");
  lines.push("");
  lines.push("Este archivo es la **fuente de verdad operativa** para agentes: resume el workflow activo, rutas de artefactos y criterios de avance.");
  lines.push("");
  lines.push("## Configuración");
  lines.push("");
  lines.push(`- **Locale**: ${config.locale}`);
  lines.push(`- **Workflow**: \`${workflowFile.replace(/\\/g, "/")}\` (${workflow.title})`);
  lines.push(`- **Artefactos**: \`${config.artifactsDir}\``);
  lines.push("");
  lines.push("## Pasos y artefactos");
  lines.push("");
  lines.push("| Orden | Step ID | Título | Artefacto principal | Skill de documento |");
  lines.push("|------:|---------|--------|---------------------|--------------------|");
  let order = 1;
  for (const step of workflow.steps || []) {
    const mainOut = (step.outputs && step.outputs[0] && step.outputs[0].path) || "";
    lines.push(`| ${order} | \`${step.id}\` | ${step.title} | \`${mainOut}\` | \`${step.doc_skill}\` |`);
    order++;
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

async function ensureProjectConfig(repoRoot, dryRun) {
  const target = path.join(repoRoot, "sdd-kit.config.yaml");
  const example = path.join(repoRoot, "kit", "bootstrap", "sdd-kit.config.example.yaml");
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
  const rulePath = path.join(repoRoot, ".cursor", "rules", "sdd-kit.mdc");
  const body = `---
description: Al trabajar con SDD/DDD del kit, leer primero el índice de artefactos.
globs:
  - docs/sdd/**
alwaysApply: false
---

# SDD Kit

Antes de editar o generar artefactos en \`docs/sdd/\`:

1. Abrir y respetar \`docs/sdd/_INDEX.md\` como mapa del workflow y rutas canónicas.
2. No contradecir decisiones ya volcadas en artefactos previos; si cambian, actualizar el documento correspondiente y el handoff.
3. Preferir las skills \`sdd-doc-*\` para producir cada artefacto y \`sdd-role-*\` para revisión/coaching.
`;
  if (dryRun) {
    console.log(`[dry-run] would write ${rulePath}`);
    return;
  }
  await fs.mkdir(path.dirname(rulePath), { recursive: true });
  if (!(await pathExists(rulePath))) {
    await fs.writeFile(rulePath, body, "utf8");
    console.log(`Created ${path.relative(repoRoot, rulePath)}`);
  }
}

async function main() {
  const { force, dryRun, repoRoot } = parseArgs(process.argv);
  const kitRoot = path.join(repoRoot, "kit");

  if (!(await pathExists(kitRoot))) {
    throw new Error(`No se encontró la carpeta kit/ en ${repoRoot}. Ejecutá el bootstrap desde la raíz del monorepo.`);
  }

  await ensureProjectConfig(repoRoot, dryRun);
  const configPath = path.join(repoRoot, "sdd-kit.config.yaml");
  const exampleCfgPath = path.join(repoRoot, "kit", "bootstrap", "sdd-kit.config.example.yaml");
  let userCfg = {};
  if (await pathExists(configPath)) {
    userCfg = await readYamlFile(configPath);
  } else if (dryRun && (await pathExists(exampleCfgPath))) {
    userCfg = await readYamlFile(exampleCfgPath);
  }
  const config = mergeShallow(DEFAULTS, userCfg);

  const workflowPath = path.isAbsolute(config.workflowFile)
    ? config.workflowFile
    : path.join(repoRoot, config.workflowFile);
  if (!(await pathExists(workflowPath))) {
    throw new Error(`Workflow no encontrado: ${workflowPath}`);
  }
  const workflow = await readYamlFile(workflowPath);

  const skillsSrc = path.join(kitRoot, "skills");
  const skillsDest = path.join(repoRoot, config.skillsTargetDir);
  console.log(`Sync skills: ${path.relative(repoRoot, skillsSrc)} -> ${path.relative(repoRoot, skillsDest)}`);
  await copyDirRecursive(skillsSrc, skillsDest, { dryRun, force: true });

  const artifactsDir = path.join(repoRoot, config.artifactsDir);
  if (!dryRun) await fs.mkdir(artifactsDir, { recursive: true });

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
    }
  }

  const indexPath = path.join(artifactsDir, "_INDEX.md");
  const indexMd = renderIndex({
    config,
    workflow,
    workflowFile: path.relative(repoRoot, workflowPath).replace(/\\/g, "/"),
  });
  if (dryRun) {
    console.log(`[dry-run] would write ${path.relative(repoRoot, indexPath)}`);
  } else {
    await fs.writeFile(indexPath, indexMd, "utf8");
    console.log(`Wrote ${path.relative(repoRoot, indexPath)}`);
  }

  await ensureCursorRule(repoRoot, dryRun);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
