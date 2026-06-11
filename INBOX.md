# INBOX

> 原始捕获池。不分类、不评判、不要求完整。等基础设施就位后再拆成正式 artifact。

## 2026-06-11

### Grimoire 实验日志
- 定位：实验日志，不是任务清单也不是私人日记
- 内容模型：当前状态 + 知识系统进度 + 一句感性沉淀（可选）
- 情感深度：记录结论不展开过程
- 触发：build-index 生成 grimoire_signal（基于实际变化），任何 AI 工具读到后主任务完成后呈现；用户可随时主动触发
- 写入：AI 起草，用户确认
- 分卷：按季度，当前卷是默认读取范围
- 跨工具一致：触发逻辑在 build-index 基础设施层，不在 AI 判断层

### 节奏状态可视化
- 需要一条状态栏让用户一眼看到当前节奏，类似 Claude Code 底部的模型信息和 Context 占用率
- 存储层：项目根目录 STATUS 文件，所有工具读写同一份
- 展示层：各工具各自适配（Claude Code 状态栏、Codex/Cursor 会话开头带出）
- 可通过一条指令或对话显式修改

### Agent 角色与调度
- 四种角色定义：Scribe（记录员）、Librarian（索引员）、Alchemist（炼金师）、Inspector（质检员）
- MVP 不建调度层，AGENTS.md 只写当前可执行的行为规则
- 后置增强：设计调度机制（用户显式调用 / Router 派发 / 主 Agent 委派）
- 参考：Qoder 研发军团模式

### Slogan 备选
- **Think Long** — Apple "Think Different" 式的态度声明，时间维度上的不同
- **Every Spark Counts** — 每一次灵感都算数
- 中文 slogan 待定，"每一次灵感都算数"暂用
- 后续继续打磨

### 电梯演讲（暂定初版）
- 我们在工作和学习中不断产生灵感，但大多数在忙碌中丢失了。AlchemyLab 是一个基于 Markdown 与结构化元数据的个人知识系统。它的核心能力是让每条内容都有明确的身份——原始笔记、未成熟的灵感、还是已确认的判断——并通过自动化索引与诊断机制，确保 AI 在任何时候都能准确理解该读什么、该信什么。忙的时候，低摩擦捕获；有空的时候，精准找回，逐步提纯，最终产出文章和开源项目。Every spark counts.

### 高压期 frontmatter 预填策略
- AI 一定能填对的（created, updated, type）：直接填入
- AI 大概率能推断的（topics, tags）和不该替用户决定的（status, sources）：预填最佳猜测
- 用户一次确认即落定，不拆多轮，不延后到窗口期

### artifacts.jsonl 长期增长风险
- MVP 阶段全量读取，几十条无压力
- 中期：按 topic + status 预过滤
- 长期：可能需要向量索引或 MCP 查询接口
- 记录为长期风险，不阻塞 MVP

### 价值观讨论中的关键沉淀
- "灵感转瞬即逝，值得被善待"从讨论中自然产生，成为项目开头第一句
- "保持平常心"来自面试等待期的真实经历，写入了项目调性
- "拒绝成为什么"从负向表述翻转为正向原则：诚实优先于展示、写入体验优先于治理完备、好的积累自然产出作品
- 主语从"我"扩展到"这类人"——系统不只服务一个人

### Agent 方向 topic 三层切分（调研支撑）
- 业界三层模型：Runtime（执行基础设施）→ Framework（中间抽象）→ Harness（驾驭层）
- Anthropic 将 Claude Code 定位为 agent harness
- AlchemyLab 采用：agent-runtime / agent-harness / ai-coding
- 来源：LangChain 博客、Anthropic 工程博客、UIUC+Meta+Stanford 百页 survey

### Grimoire 候选首条（待 Grimoire 落地后迁移）
06-11：完成 AlchemyLab 核心价值观定稿和阶段 0-1 全部落地。确定了"前台即时响应，后台异步进化"原则，设计了 Grimoire 实验日志和节奏感知机制。ROADMAP.md 交付，Codex 可以从阶段 2 开始执行。
面试拿到一个好消息，从这段经历里提炼出"保持平常心"写进了项目调性。意识到允许情绪存在，但不让情绪驱动判断。
