#!/usr/bin/env node
/**
 * Resolves ID2S role skills: domain specialists from template + config;
 * project manager orchestrator from static SKILL.md.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const ORCHESTRATOR_ROLE = "id2s-role-project-manager";

function renderBulletList(items, { prefix = "- " } = {}) {
  if (!items || items.length === 0) return "_No entries configured._";
  return items.map((item) => `${prefix}${item}`).join("\n");
}

function getByPath(obj, pathStr) {
  return pathStr.split(".").reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, obj);
}

/**
 * Supports `{{#if agent.field}} ... {{/if}}` (no extra spaces in closing tag).
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

function asMarkdownBlock(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return renderBulletList(value.map(String));
  return String(value).trimEnd();
}

function normalizeAgent(agent) {
  const a = { ...agent };

  if (!a.focus_areas) {
    a.focus_areas = "_Complete `agent.focus_areas` in `kit/skills/<role>/config.yaml`._";
  } else {
    a.focus_areas = asMarkdownBlock(a.focus_areas);
  }

  if (!a.out_of_scope_tasks) {
    a.out_of_scope_tasks = "_Complete `agent.out_of_scope_tasks` in config._";
  } else {
    a.out_of_scope_tasks = asMarkdownBlock(a.out_of_scope_tasks);
  }

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

  if (a.additional_comments != null && String(a.additional_comments).trim()) {
    a.additional_comments = String(a.additional_comments).trimEnd();
  } else {
    a.additional_comments = "";
  }

  if (a.challenge_level !== undefined && a.challenge_level !== null) {
    a.challenge_level = String(a.challenge_level).trim().toLowerCase();
  }

  return a;
}

function applyTemplate(template, data, kitConfig) {
  const agent = normalizeAgent(data.agent || {});
  const kit = {
    agentConversationLanguage: kitConfig.agentConversationLanguage ?? "en",
    documentationLanguage: kitConfig.documentationLanguage ?? "en",
  };
  const flat = { skill: data.skill || {}, agent, kit };
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

async function copyOrchestratorSkill({ skillsSrc, skillsDest, dryRun }) {
  const srcFile = path.join(skillsSrc, ORCHESTRATOR_ROLE, "SKILL.md");
  const destDir = path.join(skillsDest, ORCHESTRATOR_ROLE);
  const destFile = path.join(destDir, "SKILL.md");
  try {
    await fs.access(srcFile);
  } catch {
    console.warn(`Missing orchestrator SKILL.md at ${srcFile}`);
    return;
  }
  if (dryRun) {
    console.log(`[dry-run] copy orchestrator ${ORCHESTRATOR_ROLE} -> ${destFile}`);
    return;
  }
  await fs.mkdir(destDir, { recursive: true });
  await fs.copyFile(srcFile, destFile);
  console.log(`Copied orchestrator skill: ${ORCHESTRATOR_ROLE}`);
}

export async function resolveRoleSkills({ kitRoot, skillsSrc, skillsDest, dryRun, kitConfig = {} }) {
  const templatePath = path.join(kitRoot, "templates", "skills", "role-agent.SKILL.md.template");
  const template = await fs.readFile(templatePath, "utf8");
  const entries = await fs.readdir(skillsSrc, { withFileTypes: true });
  const roleDirs = entries.filter((e) => e.isDirectory() && e.name.startsWith("id2s-role-"));

  await copyOrchestratorSkill({ skillsSrc, skillsDest, dryRun });

  for (const ent of roleDirs) {
    if (ent.name === ORCHESTRATOR_ROLE) continue;

    const configPath = path.join(skillsSrc, ent.name, "config.yaml");
    try {
      await fs.access(configPath);
    } catch {
      continue;
    }
    const cfg = parseYaml(await fs.readFile(configPath, "utf8"));
    const skillMd = applyTemplate(template, cfg, kitConfig);
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
