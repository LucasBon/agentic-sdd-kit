import path from "node:path";

/**
 * Ruta agent-ready derivada del artefacto humano (convención de sync-agent-ready).
 * @param {string} artifactPath - p.ej. docs/ask/product-intent.md
 * @param {string} [agentReadyDir] - p.ej. agent-ready-docs/ask
 */
export function agentReadyPathFromArtifact(artifactPath, agentReadyDir = "agent-ready-docs/ask") {
  const base = path.basename(artifactPath, ".md");
  const dir = agentReadyDir.replace(/\\/g, "/").replace(/\/$/, "");
  return `${dir}/${base}.agent.yaml`;
}
