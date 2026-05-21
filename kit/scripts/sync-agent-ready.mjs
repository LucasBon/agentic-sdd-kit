#!/usr/bin/env node
/**
 * Sincroniza docs/id2s/*.md → agent-ready-docs/id2s/*.agent.yaml
 *
 * Uso:
 *   node kit/scripts/sync-agent-ready.mjs --all
 *   node kit/scripts/sync-agent-ready.mjs docs/id2s/01-project-brief.md
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { all: false, files: [], repoRoot: process.cwd() };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") out.all = true;
    else if (a === "--repo-root") out.repoRoot = path.resolve(argv[++i] || "");
    else if (!a.startsWith("-")) out.files.push(path.resolve(out.repoRoot, a));
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

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  return { meta: parseYaml(match[1]) || {}, body: match[2] };
}

function slugifyHeading(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function parseSections(body) {
  const sections = {};
  const lines = body.split("\n");
  let current = "_preamble";
  let buf = [];

  const flush = () => {
    const text = buf.join("\n").trim();
    if (text) sections[current] = text;
    buf = [];
  };

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flush();
      current = slugifyHeading(h2[1]);
      continue;
    }
    buf.push(line);
  }
  flush();
  return sections;
}

function extractHandoff(sections) {
  const handoff = {};
  const key = Object.keys(sections).find((k) => k.includes("handoff"));
  if (!key) return handoff;
  const lines = sections[key].split("\n").filter((l) => l.trim().startsWith("-"));
  for (const line of lines) {
    const m = line.match(/^\s*-\s*\*\*(.+?)\*\*:\s*(.*)$/);
    if (m) handoff[slugifyHeading(m[1])] = m[2].trim() || null;
  }
  return handoff;
}

function extractOpenQuestions(sections) {
  const key = Object.keys(sections).find((k) => k.includes("preguntas") || k.includes("open"));
  if (!key) return [];
  return sections[key]
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => l.replace(/^\s*-\s*/, "").trim())
    .filter(Boolean);
}

async function loadConfig(repoRoot) {
  const cfgPath = path.join(repoRoot, "id2s-kit.config.yaml");
  if (!(await pathExists(cfgPath))) {
    return {
      artifactsDir: "docs/id2s",
      agentReadyDir: "agent-ready-docs/id2s",
      documentationLanguage: "en",
    };
  }
  return parseYaml(await fs.readFile(cfgPath, "utf8"));
}

export async function syncOne(mdPath, { repoRoot, config }) {
  const raw = await fs.readFile(mdPath, "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const sections = parseSections(body);
  const base = path.basename(mdPath, ".md");
  const agentPath = path.join(repoRoot, config.agentReadyDir || "agent-ready-docs/id2s", `${base}.agent.yaml`);

  const doc = {
    meta: {
      id: meta.id2s_document || meta.sdd_document || base.replace(/^\d+-/, ""),
      source_path: path.relative(repoRoot, mdPath).replace(/\\/g, "/"),
      source_version: meta.current_version ?? 1,
      locale: meta.locale ?? config.documentationLanguage ?? "en",
      workflow_step: meta.workflow_step || meta.id2s_document,
      updated_at: new Date().toISOString(),
    },
    content: sections,
    handoff: extractHandoff(sections),
    open_questions: extractOpenQuestions(sections),
  };

  await fs.mkdir(path.dirname(agentPath), { recursive: true });
  await fs.writeFile(agentPath, stringifyYaml(doc), "utf8");
  console.log(`Synced ${path.relative(repoRoot, mdPath)} -> ${path.relative(repoRoot, agentPath)} (v${doc.meta.source_version})`);
  return agentPath;
}

async function main() {
  const { all, files, repoRoot } = parseArgs(process.argv);
  const config = await loadConfig(repoRoot);
  const artifactsDir = path.join(repoRoot, config.artifactsDir || "docs/id2s");

  let targets = files;
  if (all) {
    const entries = await fs.readdir(artifactsDir);
    targets = entries
      .filter((f) => f.endsWith(".md") && f !== "_INDEX.md")
      .map((f) => path.join(artifactsDir, f));
  }

  if (targets.length === 0) {
    console.error("Indicá un archivo .md o usá --all");
    process.exitCode = 1;
    return;
  }

  for (const f of targets) {
    if (!(await pathExists(f))) {
      console.warn(`Skip missing: ${f}`);
      continue;
    }
    await syncOne(f, { repoRoot, config });
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
