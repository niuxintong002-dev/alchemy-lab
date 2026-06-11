# AlchemyLab 第一版落地计划

> 本文是 Codex 执行的入口文档。阶段 0-1 已由 Claude 完成，Codex 从阶段 2 开始执行。

## 已完成

### 阶段 0：指令契约层（Claude 已完成）

- [x] `CLAUDE.md`：价值观 + 指针 + 优先级
- [x] `AGENTS.md`：节奏感知 + 三种模式行为差异 + 不变规则
- [x] `STATUS`：节奏声明文件格式已定义（待首次写入）
- [x] `INBOX.md`：原始捕获池，已有 8 条灵感

### 阶段 1：规则基础设施（Claude 已完成）

- [x] `CONVENTIONS.md`：6 条 rule_code（machine-readable YAML block）+ 正反例 + 字段契约
- [x] `topics/topic-registry.md`：8 个初始 topic
- [x] `templates/source-note.md`：frontmatter + 正文模板
- [x] `templates/insight.md`：frontmatter + 正文模板

---

## 待执行

### 阶段 2：项目脚手架

- [x] 阶段状态：已完成（2026-06-11）

**目标**：建立完整目录结构，让 artifact 有地方落。

**产出**：

```
alchemy-lab/
  source-notes/          ← source-note 存放目录
  insights/              ← insight 存放目录
  decisions/             ← 预留，MVP 不启用
  experiments/           ← 预留，MVP 不启用
  output-records/        ← 预留，MVP 不启用
  generated/             ← 索引和诊断输出目录
    .gitkeep
  evals/
    fixtures/            ← 固定回归样本
  .verify/
    runs/                ← 探索性红队样本（gitignore）
  skills/
    kb-verify/
      prompts/           ← 红蓝对抗 prompt 模板
  scripts/               ← 索引和诊断脚本
  grimoire/              ← 实验日志（后置增强，先建目录占位）
  STATUS                 ← 首次写入：rhythm: window, focus: AlchemyLab 建设, since: 当天日期
  .gitignore             ← 排除 .verify/runs/、generated/*.jsonl
  package.json           ← 注册 kb:index 和 kb:check 命令
```

**执行要点**：
- MVP 只启用 `source-notes/` 和 `insights/`，其余 type 目录预留但不写入
- `generated/` 下的文件全部由脚本生成，不手工维护
- `.verify/runs/` 不进版本控制
- `grimoire/` 只建目录，不写内容（后置增强）

**验收标准**：
- 目录结构存在且 git tracked
- STATUS 文件已写入初始值
- package.json 存在且定义了 `kb:index` 和 `kb:check` script（可以是占位）

---

### 阶段 3：索引能力

- [x] 阶段状态：已完成（2026-06-11）

**目标**：实现 build-index 脚本，生成 `artifacts.jsonl` 和 `diagnostics.jsonl`。

**输入**：
- `CONVENTIONS.md` 中的 rule_code YAML block（规则定义）
- `CONVENTIONS.md` 中的字段契约（必填/可选/禁用）
- `topics/topic-registry.md`（合法 topic 列表）
- `source-notes/*.md` 和 `insights/*.md`（扫描目标）

**产出**：
- `scripts/build-index.sh`（或 `.ts`/`.mjs`，语言由 Codex 决定）
- `generated/artifacts.jsonl`
- `generated/diagnostics.jsonl`
- `generated/diagnostics.md`（可选）

**架构约束**（来自风险膨胀审查）：
1. **两阶段架构**：先扫描 artifact 生成标准化 metadata + 内部 edges 数据结构，再基于字段清单、连接矩阵和跨字段约束生成 diagnostics。即使 MVP 不输出 `edges.jsonl`，内部必须先构建 edges。
2. **rule_code 从 CONVENTIONS.md 解析**：脚本只读 machine-readable YAML block，不硬编码规则。
3. **过期判定**：artifact 目录下任一 `.md` 文件的 mtime 晚于 `generated/artifacts.jsonl` 时，视为索引过期。

**MVP diagnostics 范围**：
- 必填字段缺失：`id`, `type`, `topics`, `status`, `created`, `updated`
- `type` 不在 MVP 启用列表（source-note, insight）时给 warning
- `topics` 不在 topic-registry.md 中
- `tags` 超过 5 个
- source-note 出现禁用字段
- insight 的 `sources` 指向不存在的文件，或目标不是 source-note
- insight 的 `status` 不在 `pending / active / archived` 中

**验收标准**：
- 空知识库运行不报错，生成空 `artifacts.jsonl`
- 放入一条合法 source-note + 一条合法 insight，运行后 `artifacts.jsonl` 有 2 行
- 放入一条 frontmatter 缺失 `topics` 的 insight，`diagnostics.jsonl` 报 error
- 放入一条 `sources` 指向不存在文件的 insight，`diagnostics.jsonl` 报 error
- `npm run kb:index` 可正常执行

---

### 阶段 4：验收能力

- [x] 阶段状态：已完成（2026-06-11）

**目标**：落地 `/kb-verify` 的 fixture、prompt 模板和执行流程。

**输入**：
- 工作稿 §12.2 的 fixture 策略和执行流程
- 工作稿 §12.3 的三份 prompt 模板（已冻结）
- `CONVENTIONS.md` 中的 rule_code

**产出**：

```
evals/fixtures/
  pending-insight-should-not-be-trusted/
    source-notes/...
    insights/...
  my-take-should-not-be-promoted/
    source-notes/...
  source-note-claim-should-not-be-overread/
    source-notes/...
    insights/...

skills/kb-verify/
  SKILL.md               ← skill 定义和执行流程
  prompts/
    red-team.md
    blue-team.md
    judge-report.md
```

**执行要点**：
- 三份 prompt 模板从工作稿 §12.3 原样提取，不修改正文
- 每个 fixture 目录是一个自包含的迷你知识库，可独立运行 build-index
- fixture 中的 artifact frontmatter 必须合法（能通过 diagnostics），对抗在语义层不在格式层
- SKILL.md 定义 `/kb-verify` 的完整编排流程：build-index → spawn 红队 → 重建索引 → spawn 蓝队 → 生成 judge report

**验收标准**：
- 3 个 fixture 目录各自包含至少一条 source-note 和相关 artifact
- 对每个 fixture 运行 build-index，diagnostics 无 error
- prompt 模板中的 `{{变量}}` 与 SKILL.md 的编排逻辑一致
- SKILL.md 的执行流程与工作稿 §12.2 的 8 步流程一致

---

### 阶段 5：端到端验收

- [x] 阶段状态：已完成（2026-06-11）

**目标**：用 MVP 验收场景跑一遍完整流程。

**验收场景**（来自工作稿 §12）：

> 三周前面试准备时，我读了一篇关于 agent trust model 的文章，随手记了两条想法。现在有空了，我想找到 CLI 方向下所有"记了但还没处理"的想法，挑一个开始做。

**执行步骤**：

1. 按模板创建一条 source-note（agent trust model 文章笔记），包含 `[!my-take]`
2. 按模板创建两条 pending insight，`sources` 指向该 source-note
3. 运行 `npm run kb:index`，确认 `artifacts.jsonl` 包含 3 条记录
4. 查询：`type: insight, topics includes agent-runtime, status: pending`
5. 确认能找到 2 条 pending insight
6. 运行 `/kb-verify`，确认红蓝对抗正常完成，judge report 生成
7. 人工确认：整个流程是否贴合"面试密集期捕获、空闲窗口期找回"的真实节奏

**验收标准**：
- 步骤 1-5 全部通过
- `/kb-verify` judge report 全 PASS 或 NEEDS_REVIEW 项有明确处置方案
- 人工确认流程可接受

---

## 后置增强（不在 MVP 范围）

| 项目 | 触发条件 |
|---|---|
| Grimoire 实验日志 | MVP 验收通过后 |
| STATUS 状态栏展示 | Grimoire 落地时一起做 |
| Agent 角色与调度机制 | type 扩展到 5 种后 |
| `generated/edges.jsonl` | 启用 decision / experiment 时 |
| `generated/topics.md` + `generated/backlinks.md` | artifact 超过 20 条后 |
| Git Hook 触发 | 日常使用稳定后 |
| Watch 模式 | Obsidian 接入时 |
| 向量索引 / MCP 查询 | artifact 超过几百条后 |
| Slogan 和品牌定稿 | 持续打磨中：Think Long / Every Spark Counts |
| `confidence` / `visibility` 字段回填 | 完整系统启用时 |

---

## 参考文档

| 文档 | 路径 |
|---|---|
| 脑暴工作稿（设计冻结） | `workshop/supporting/知识系统设计/codex-长期研发知识系统-脑暴工作稿-2026-06-09.md` |
| 风险膨胀审查结论 | `workshop/supporting/知识系统设计/风险膨胀审查结论-2026-06-10.md` |
