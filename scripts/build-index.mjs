import { promises as fs } from "node:fs";
import path from "node:path";

const ARTIFACT_DIRS = ["source-notes", "insights"];
const GENERATED_DIR = "generated";
const ARTIFACTS_FILE = "artifacts.jsonl";
const DIAGNOSTICS_FILE = "diagnostics.jsonl";
const MVP_TYPES = new Set(["source-note", "insight"]);

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const root = path.resolve(readOption("--root") ?? process.cwd());

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

function readOption(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

async function main() {
  const conventionsText = await readText(path.join(root, "CONVENTIONS.md"));
  const topicsText = await readText(path.join(root, "topics", "topic-registry.md"));
  const ruleCodes = parseRuleCodes(conventionsText);
  const contracts = parseFieldContracts(conventionsText);
  const validTopics = parseTopicRegistry(topicsText);
  const artifactFiles = await listArtifactFiles(root);
  const indexWasStale = await isIndexStale(root, artifactFiles);

  const artifacts = await scanArtifacts(root, artifactFiles);
  const edges = buildEdges(artifacts);
  const diagnostics = buildDiagnostics({
    artifacts,
    contracts,
    edges,
    ruleCodes,
    validTopics,
  });

  if (checkOnly && indexWasStale.stale) {
    diagnostics.unshift(
      diagnostic({
        severity: "error",
        code: "INDEX_STALE",
        message: indexWasStale.reason,
      }),
    );
  }

  if (!checkOnly) {
    await fs.mkdir(path.join(root, GENERATED_DIR), { recursive: true });
    await writeJsonl(path.join(root, GENERATED_DIR, ARTIFACTS_FILE), artifacts.map(toArtifactRecord));
    await writeJsonl(path.join(root, GENERATED_DIR, DIAGNOSTICS_FILE), diagnostics);
  }

  const errorCount = diagnostics.filter((item) => item.severity === "error").length;
  const warningCount = diagnostics.filter((item) => item.severity === "warning").length;
  const mode = checkOnly ? "Checked" : "Indexed";
  console.log(
    `${mode} ${artifacts.length} artifact(s), ${errorCount} error(s), ${warningCount} warning(s).`,
  );

  if (checkOnly && errorCount > 0) {
    for (const item of diagnostics) {
      if (item.severity === "error") console.error(JSON.stringify(item));
    }
    process.exitCode = 1;
  }
}

async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listArtifactFiles(rootDir) {
  const files = [];

  for (const dirName of ARTIFACT_DIRS) {
    const absoluteDir = path.join(rootDir, dirName);
    if (!(await pathExists(absoluteDir))) continue;

    const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const absolutePath = path.join(absoluteDir, entry.name);
      const stat = await fs.stat(absolutePath);
      files.push({
        absolutePath,
        relativePath: toPosix(path.relative(rootDir, absolutePath)),
        mtimeMs: stat.mtimeMs,
      });
    }
  }

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

async function isIndexStale(rootDir, artifactFiles) {
  const artifactIndexPath = path.join(rootDir, GENERATED_DIR, ARTIFACTS_FILE);
  let generatedStat = null;

  try {
    generatedStat = await fs.stat(artifactIndexPath);
  } catch {
    return {
      stale: true,
      reason: `${GENERATED_DIR}/${ARTIFACTS_FILE} is missing`,
    };
  }

  const staleFile = artifactFiles.find((file) => file.mtimeMs > generatedStat.mtimeMs);
  if (!staleFile) return { stale: false, reason: "index is fresh" };

  return {
    stale: true,
    reason: `${staleFile.relativePath} is newer than ${GENERATED_DIR}/${ARTIFACTS_FILE}`,
  };
}

async function scanArtifacts(rootDir, artifactFiles) {
  const artifacts = [];

  for (const file of artifactFiles) {
    const content = await fs.readFile(file.absolutePath, "utf8");
    const frontmatter = parseFrontmatter(content);
    const data = frontmatter.data;

    artifacts.push({
      path: file.relativePath,
      directory: file.relativePath.split("/")[0],
      frontmatter,
      id: stringOrNull(data.id),
      type: stringOrNull(data.type),
      topics: normalizeList(data.topics),
      tags: normalizeList(data.tags),
      status: stringOrNull(data.status),
      created: stringOrNull(data.created),
      updated: stringOrNull(data.updated),
      sources: normalizeList(data.sources),
      derived_from: normalizeList(data.derived_from),
      summary: stringOrNull(data.summary),
    });
  }

  return artifacts;
}

function parseFrontmatter(content) {
  const lines = content.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    return {
      data: {},
      fields: new Set(),
      error: "frontmatter is missing",
    };
  }

  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (endIndex === -1) {
    return {
      data: {},
      fields: new Set(),
      error: "frontmatter is not closed",
    };
  }

  const yamlLines = lines.slice(1, endIndex);
  const data = {};
  const fields = new Set();

  for (let index = 0; index < yamlLines.length; index += 1) {
    const line = yamlLines[index];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    const match = /^([A-Za-z_][A-Za-z0-9_-]*):(?:\s*(.*))?$/.exec(line);
    if (!match) continue;

    const [, key, rawValue = ""] = match;
    fields.add(key);

    if (rawValue.trim() === "") {
      const blockItems = [];
      let cursor = index + 1;
      while (cursor < yamlLines.length) {
        const itemMatch = /^\s+-\s*(.*)$/.exec(yamlLines[cursor]);
        if (!itemMatch) break;
        blockItems.push(parseScalar(itemMatch[1]));
        cursor += 1;
      }

      if (blockItems.length > 0) {
        data[key] = blockItems;
        index = cursor - 1;
      } else {
        data[key] = "";
      }
      continue;
    }

    data[key] = parseValue(rawValue);
  }

  return {
    data,
    fields,
    error: null,
  };
}

function parseValue(rawValue) {
  const value = rawValue.trim();

  if (value === "[]") return [];
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((item) => parseScalar(item));
  }

  return parseScalar(value);
}

function parseScalar(rawValue) {
  const value = rawValue.trim();
  const withoutComment = stripInlineComment(value).trim();
  if (
    (withoutComment.startsWith('"') && withoutComment.endsWith('"')) ||
    (withoutComment.startsWith("'") && withoutComment.endsWith("'"))
  ) {
    return withoutComment.slice(1, -1);
  }
  return withoutComment;
}

function stripInlineComment(value) {
  const hashIndex = value.indexOf(" #");
  if (hashIndex === -1) return value;
  return value.slice(0, hashIndex);
}

function parseRuleCodes(conventionsText) {
  const yamlBlock = /```yaml\s*([\s\S]*?)```/.exec(conventionsText)?.[1];
  if (!yamlBlock) {
    throw new Error("CONVENTIONS.md does not contain a machine-readable yaml block");
  }

  const ruleCodes = [];
  let current = null;

  for (const line of yamlBlock.split(/\r?\n/)) {
    const startMatch = /^\s*-\s+code:\s*(.+)$/.exec(line);
    if (startMatch) {
      if (current) ruleCodes.push(current);
      current = { code: parseScalar(startMatch[1]) };
      continue;
    }

    const fieldMatch = /^\s+([A-Za-z_][A-Za-z0-9_-]*):\s*(.+)$/.exec(line);
    if (current && fieldMatch) {
      current[fieldMatch[1]] = parseScalar(fieldMatch[2]);
    }
  }

  if (current) ruleCodes.push(current);
  if (ruleCodes.length === 0) {
    throw new Error("CONVENTIONS.md yaml block does not define rule_codes");
  }

  return ruleCodes;
}

function parseFieldContracts(conventionsText) {
  return {
    "source-note": parseContractSection(conventionsText, "source-note"),
    insight: parseContractSection(conventionsText, "insight"),
  };
}

function parseContractSection(conventionsText, type) {
  const section = extractSection(conventionsText, `### ${type}`);
  if (!section) throw new Error(`CONVENTIONS.md is missing ${type} field contract`);

  return {
    required: parseFieldLine(section, "必填"),
    optional: parseFieldLine(section, "可选"),
    forbidden: parseFieldLine(section, "禁用"),
    statusValues: parseStatusValues(section),
  };
}

function extractSection(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`${escaped}\\n([\\s\\S]*?)(?=\\n### |\\n## |$)`).exec(text);
  return match?.[1] ?? null;
}

function parseFieldLine(section, label) {
  const match = new RegExp(`^${label}：(.+)$`, "m").exec(section);
  if (!match) return [];
  return [...match[1].matchAll(/`([^`]+)`/g)].map((item) => item[1]);
}

function parseStatusValues(section) {
  const match = /`status`\s*枚举：(.+)$/m.exec(section);
  if (!match) return [];
  return [...match[1].matchAll(/`([^`]+)`/g)].map((item) => item[1]);
}

function parseTopicRegistry(topicsText) {
  const topics = new Set();
  for (const match of topicsText.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)) {
    topics.add(match[1]);
  }
  return topics;
}

function buildEdges(artifacts) {
  const byPath = new Map(artifacts.map((artifact) => [artifact.path, artifact]));
  const byId = new Map(artifacts.filter((artifact) => artifact.id).map((artifact) => [artifact.id, artifact]));
  const edges = [];

  for (const artifact of artifacts) {
    for (const targetRef of artifact.sources) {
      edges.push(resolveEdge({ artifact, byId, byPath, kind: "sources", targetRef }));
    }
    for (const targetRef of artifact.derived_from) {
      edges.push(resolveEdge({ artifact, byId, byPath, kind: "derived_from", targetRef }));
    }
  }

  return edges;
}

function resolveEdge({ artifact, byId, byPath, kind, targetRef }) {
  const normalizedTarget = normalizeArtifactRef(targetRef);
  const target = byPath.get(normalizedTarget) ?? byId.get(targetRef) ?? null;

  return {
    from: artifact.path,
    kind,
    target_ref: targetRef,
    target_path: target?.path ?? normalizedTarget,
    target_type: target?.type ?? null,
    exists: Boolean(target),
  };
}

function buildDiagnostics({ artifacts, contracts, edges, ruleCodes, validTopics }) {
  const diagnostics = [];
  const baseRequired = sharedRequiredFields(contracts);
  const sourceNoteUpstreamRule = findRuleCode(ruleCodes, {
    group: "source-note",
    scope: "source-note",
  });
  const insightSourcesRule = findRuleCode(ruleCodes, {
    group: "insight",
    scope: "insight.sources",
  });

  for (const artifact of artifacts) {
    if (artifact.frontmatter.error) {
      diagnostics.push(
        diagnostic({
          severity: "error",
          code: "FRONTMATTER_INVALID",
          path: artifact.path,
          message: artifact.frontmatter.error,
        }),
      );
    }

    const contract = contracts[artifact.type] ?? { required: baseRequired, forbidden: [], statusValues: [] };

    for (const field of contract.required) {
      if (isMissing(artifact.frontmatter.data[field])) {
        diagnostics.push(
          diagnostic({
            severity: "error",
            code: "REQUIRED_FIELD_MISSING",
            path: artifact.path,
            field,
            message: `${field} is required`,
          }),
        );
      }
    }

    if (artifact.type && !MVP_TYPES.has(artifact.type)) {
      diagnostics.push(
        diagnostic({
          severity: "warning",
          code: "TYPE_NOT_ENABLED",
          path: artifact.path,
          field: "type",
          value: artifact.type,
          message: `${artifact.type} is not enabled in MVP`,
        }),
      );
    }

    for (const topic of artifact.topics) {
      if (!validTopics.has(topic)) {
        diagnostics.push(
          diagnostic({
            severity: "error",
            code: "TOPIC_NOT_REGISTERED",
            path: artifact.path,
            field: "topics",
            value: topic,
            message: `${topic} is not registered in topics/topic-registry.md`,
          }),
        );
      }
    }

    if (artifact.tags.length > 5) {
      diagnostics.push(
        diagnostic({
          severity: "warning",
          code: "TAGS_LIMIT_EXCEEDED",
          path: artifact.path,
          field: "tags",
          value: artifact.tags.length,
          message: "tags should not exceed 5 items",
        }),
      );
    }

    if (artifact.type === "source-note") {
      for (const field of contracts["source-note"].forbidden) {
        if (artifact.frontmatter.fields.has(field)) {
          diagnostics.push(
            diagnostic({
              severity: "error",
              code: "FORBIDDEN_FIELD_PRESENT",
              rule_code: sourceNoteUpstreamRule,
              path: artifact.path,
              field,
              message: `source-note must not define ${field}`,
            }),
          );
        }
      }
    }

    if (artifact.type === "insight") {
      const validStatuses = new Set(contracts.insight.statusValues);
      if (artifact.status && validStatuses.size > 0 && !validStatuses.has(artifact.status)) {
        diagnostics.push(
          diagnostic({
            severity: "error",
            code: "STATUS_INVALID",
            path: artifact.path,
            field: "status",
            value: artifact.status,
            message: `insight status must be one of: ${[...validStatuses].join(", ")}`,
          }),
        );
      }

      for (const edge of edges.filter((item) => item.from === artifact.path && item.kind === "sources")) {
        if (!edge.exists) {
          diagnostics.push(
            diagnostic({
              severity: "error",
              code: "SOURCE_NOT_FOUND",
              rule_code: insightSourcesRule,
              path: artifact.path,
              field: "sources",
              value: edge.target_ref,
              message: `${edge.target_ref} does not exist`,
            }),
          );
          continue;
        }

        if (edge.target_type !== "source-note") {
          diagnostics.push(
            diagnostic({
              severity: "error",
              code: "SOURCE_NOT_SOURCE_NOTE",
              rule_code: insightSourcesRule,
              path: artifact.path,
              field: "sources",
              value: edge.target_ref,
              message: `${edge.target_ref} must point to a source-note`,
            }),
          );
        }
      }
    }
  }

  return diagnostics;
}

function sharedRequiredFields(contracts) {
  const requiredSets = Object.values(contracts).map((contract) => new Set(contract.required));
  const [first = new Set()] = requiredSets;
  return [...first].filter((field) => requiredSets.every((set) => set.has(field)));
}

function findRuleCode(ruleCodes, criteria) {
  const rule = ruleCodes.find((item) => item.group === criteria.group && item.scope === criteria.scope);
  return rule?.code ?? null;
}

function diagnostic(input) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== null && value !== undefined));
}

function toArtifactRecord(artifact) {
  return {
    path: artifact.path,
    id: artifact.id,
    type: artifact.type,
    topics: artifact.topics,
    tags: artifact.tags,
    status: artifact.status,
    created: artifact.created,
    updated: artifact.updated,
    sources: artifact.sources,
    derived_from: artifact.derived_from,
    summary: artifact.summary,
  };
}

async function writeJsonl(filePath, records) {
  const content = records.length === 0 ? "" : `${records.map((item) => JSON.stringify(item)).join("\n")}\n`;
  await fs.writeFile(filePath, content, "utf8");
}

function normalizeList(value) {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  return [String(value)].filter(Boolean);
}

function stringOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function isMissing(value) {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  return String(value).trim() === "";
}

function normalizeArtifactRef(ref) {
  return toPosix(path.posix.normalize(String(ref).replace(/^\.\//, "")));
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}
