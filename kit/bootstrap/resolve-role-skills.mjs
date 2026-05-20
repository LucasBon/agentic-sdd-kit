#!/usr/bin/env node
/**
 * Resuelve skills de rol ID2S: plantilla + config.yaml → SKILL.md en destino.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";

function renderBulletList(items, { prefix = "- " } = {}) {
  if (!items || items.length === 0) return "_Sin entradas configuradas._";
  return items.map((item) => `${prefix}${item}`).join("\n");
}

function getByPath(obj, pathStr) {
  return pathStr.split(".").reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, obj);
}

/**
 * Soporta bloques `{{#if agent.field}} ... {{/if}}` (sin espacios extra en el cierre).
 */
function processConditionals(template, flat) {
  const re = /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  return template.replace(re, (_, path, inner) => {
    const value = getByPath(flat, path);
    if (value !== undefined && value !== null && value !== false && String(value).trim() !== "") {
      return inner;
    }
    return "";
  });
}

function renderTechniques(techniques) {
  if (!techniques || typeof techniques !== "object") return "";
  const lines = ["### Técnicas disponibles (ofrecelas cuando aporten)", ""];
  for (const [group, items] of Object.entries(techniques)) {
    const title = group.charAt(0).toUpperCase() + group.slice(1);
    lines.push(`#### ${title}`, "");
    lines.push(renderBulletList(items), "");
  }
  return lines.join("\n").trim();
}

/**
 * Convierte `focus_areas` / `out_of_scope_tasks` / `owned_artifacts` desde string o lista.
 */
function asMarkdownBlock(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return renderBulletList(value.map(String));
  return String(value).trimEnd();
}

/**
 * Deriva campos esperados por `role-agent.SKILL.md.template` y mantiene compatibilidad
 * con configs antiguos (`persona_intro`, `boundaries`, `priorities_text`, etc.).
 */
function normalizeAgent(agent, skill) {
  const a = { ...agent };

  if (!a.focus_areas) {
    if (a.priorities_text) {
      a.focus_areas = String(a.priorities_text).trim();
    } else if (Array.isArray(a.priorities) && a.priorities.length) {
      a.focus_areas = a.priorities.map(String).join(" ");
    } else if (a.persona_intro) {
      a.focus_areas = String(a.persona_intro)
        .split(/\n\n+/)[0]
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 400);
    } else {
      a.focus_areas = "_Completá `agent.focus_areas` en `kit/skills/<rol>/config.yaml`._";
    }
  } else {
    a.focus_areas = asMarkdownBlock(a.focus_areas);
  }

  if (!a.out_of_scope_tasks) {
    if (Array.isArray(a.boundaries) && a.boundaries.length) {
      a.out_of_scope_tasks = renderBulletList(a.boundaries);
    } else {
      a.out_of_scope_tasks = "_Completá `agent.out_of_scope_tasks` o `agent.boundaries` en config._";
    }
  } else {
    a.out_of_scope_tasks = asMarkdownBlock(a.out_of_scope_tasks);
  }

  if (!a.owned_artifacts) {
    a.owned_artifacts = [
      "_Sin `owned_artifacts` explícitos: confirmá con el usuario qué documentos persistir (ver `id2s-kit.config.yaml` → `artifactsDir` / `agentReadyDir`)._",
    ];
  }
  const ownedList = Array.isArray(a.owned_artifacts)
    ? a.owned_artifacts
    : String(a.owned_artifacts)
        .split("\n")
        .map((l) => l.replace(/^-\s*/, "").trim())
        .filter(Boolean);
  const humanWritePaths = ownedList.filter(
    (p) => p.endsWith(".md") && !p.includes(".agent.yaml")
  );
  if (humanWritePaths.length > 2) {
    console.warn(
      `[id2s-role] ${data.skill?.name || "role"}: owned_artifacts tiene ${humanWritePaths.length} documentos .md; se recomienda 1–2.`
    );
  }
  a.owned_artifacts = asMarkdownBlock(a.owned_artifacts);

  const defaultTriggers = `Update artifacts only when:
- The user explicitly requests documentation.
- A decision has been clearly made and validated.
- A section has been sufficiently explored and confirmed.

Do NOT update artifacts during early exploration or ambiguous discussions.`;

  if (a.write_triggers != null && String(a.write_triggers).trim()) {
    const lines = String(a.write_triggers)
      .trim()
      .split(/\n|[;]/)
      .map((l) => l.trim())
      .filter(Boolean);
    const bullets = lines.map((l) => `- ${l.replace(/^-\s*/, "")}`).join("\n");
    a.write_triggers_block = `${bullets}

Do NOT update artifacts during early exploration or ambiguous discussions.`;
  } else {
    a.write_triggers_block = defaultTriggers;
  }

  if (a.additional_comments === undefined || a.additional_comments === null) {
    const parts = [];
    if (Array.isArray(a.typical_questions) && a.typical_questions.length) {
      parts.push("### Preguntas típicas (para destrabar)", "", renderBulletList(a.typical_questions), "");
    }
    if (Array.isArray(a.challenges) && a.challenges.length) {
      parts.push("### Challenges (cuestioná al usuario)", "", renderBulletList(a.challenges), "");
    }
    const tech = renderTechniques(a.techniques);
    if (tech) parts.push(tech, "");
    if (Array.isArray(a.expected_output) && a.expected_output.length) {
      parts.push("### Salida esperada en una sesión de coaching", "", renderBulletList(a.expected_output), "");
    }
    a.additional_comments = parts.join("\n").trimEnd();
  } else {
    a.additional_comments = String(a.additional_comments).trimEnd();
  }

  if (a.challenge_level !== undefined && a.challenge_level !== null) {
    a.challenge_level = String(a.challenge_level).trim().toLowerCase();
  }

  return a;
}

function applyTemplate(template, data) {
  const agent = normalizeAgent(data.agent || {}, data.skill || {});
  const flat = { skill: data.skill || {}, agent };
  let out = processConditionals(template, flat);
  const walk = (obj, prefix) => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) walk(v, key);
      else out = out.replaceAll(`{{${key}}}`, String(v ?? ""));
    }
  };
  walk(flat, "");
  return out;
}

export async function resolveRoleSkills({ kitRoot, skillsSrc, skillsDest, dryRun }) {
  const templatePath = path.join(kitRoot, "templates", "skills", "role-agent.SKILL.md.template");
  const template = await fs.readFile(templatePath, "utf8");
  const entries = await fs.readdir(skillsSrc, { withFileTypes: true });
  const roleDirs = entries.filter((e) => e.isDirectory() && e.name.startsWith("id2s-role-"));

  for (const ent of roleDirs) {
    const configPath = path.join(skillsSrc, ent.name, "config.yaml");
    try {
      await fs.access(configPath);
    } catch {
      continue;
    }
    const cfg = parseYaml(await fs.readFile(configPath, "utf8"));
    const skillMd = applyTemplate(template, cfg);
    const destDir = path.join(skillsDest, ent.name);
    const destFile = path.join(destDir, "SKILL.md");
    if (dryRun) {
      console.log(`[dry-run] resolve role ${ent.name} -> ${destFile}`);
    } else {
      await fs.mkdir(destDir, { recursive: true });
      await fs.writeFile(destFile, skillMd, "utf8");
      console.log(`Resolved role skill: ${ent.name}`);
    }
  }
}

export async function copyDocSkills({ skillsSrc, skillsDest, dryRun }) {
  const entries = await fs.readdir(skillsSrc, { withFileTypes: true });
  const docDirs = entries.filter((e) => e.isDirectory() && e.name.startsWith("id2s-doc-"));

  for (const ent of docDirs) {
    const srcDir = path.join(skillsSrc, ent.name);
    const destDir = path.join(skillsDest, ent.name);
    const srcFile = path.join(srcDir, "SKILL.md");
    try {
      await fs.access(srcFile);
    } catch {
      continue;
    }
    if (dryRun) {
      console.log(`[dry-run] copy doc ${ent.name}`);
      continue;
    }
    await fs.mkdir(destDir, { recursive: true });
    await fs.copyFile(srcFile, path.join(destDir, "SKILL.md"));
    console.log(`Copied doc skill: ${ent.name}`);
  }
}
