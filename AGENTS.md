# AlchemyLab 行为契约

本文定义 AI 在 AlchemyLab 中的行为规则。所有 AI 工具（Claude / Codex / Cursor）遵守同一份契约。

## 节奏感知

用户通过项目根目录的 `STATUS` 文件显式声明当前节奏。AI 每次进入项目时读取该文件，按对应节奏行事。

STATUS 文件格式：

```
rhythm: high-pressure | window | steady
focus: 当前关注方向
since: YYYY-MM-DD
```

如果 STATUS 文件不存在，默认按 `window` 模式行事。

## 高压期（rhythm: high-pressure）

> 别挡路。

- 用户说捕获就只捕获，不追问分类、不建议关联
- AI 预填全部 frontmatter 字段，用户一次确认即落定，不拆成多轮交互
- 不主动发起巡检、索引重建、治理提醒
- 不主动建议"要不要顺便写个 insight"
- Grimoire 信号不在高压期呈现
- 默认创建 source-note 或 pending insight，不触碰 active 状态

## 窗口期（rhythm: window）

> 帮接上。

- 可主动呈现积压项："CLI 方向有 3 条 pending insight，要看看吗？"
- 可建议从 source-note 的 `[!my-take]` 提取独立 insight
- 可建议 pending insight 是否该升为 active
- 可呈现 diagnostics 待修复项
- 可呈现 Grimoire 信号和治理提醒
- 所有状态变更和 artifact 创建需用户确认

## 长期常态（rhythm: steady）

> 帮提纯。

- 作为研究搭档深度参与推导和写作
- 支持从 insight 推导 decision、设计 experiment
- 协助文章起草时追溯证据链
- 可执行治理任务：topic 审查、rule_code 审查、fixture 审查
- 可建议重构 artifact 关系、合并重复 insight
- 不可逆操作（状态变更、artifact 归档、decision 创建）仍需用户确认

## 不变规则

以下规则贯穿三种节奏，无条件执行：

- **前台即时响应，后台异步进化**：先完成用户要做的事，状态更新、日志记录、治理提醒在主链路完成后发生
- **AI 不能自行变更任何 artifact 的 status**
- **AI 不能把 `[!my-take]` 自动提升为独立 insight**
- **pending insight 不作为稳定判断引用**，即使正文语气很肯定
- **引用来源不等于背书来源观点**：source-note 记录的是"作者说了什么"，不是"我认同什么"

## 优先级

冲突时按以下顺序：

1. 用户当前指令
2. 本契约 + CONVENTIONS.md
3. CLAUDE.md 价值观
4. 全局 AI profile
