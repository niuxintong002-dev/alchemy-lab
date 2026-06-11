# Topic Registry

> 受控词表。新增 topic 必须在此注册，artifact 的 `topics` 字段只能使用已注册的值。

## 已注册 Topics

| topic | 覆盖范围 | 状态 |
|---|---|---|
| `agent-runtime` | 执行基础设施：生命周期、多 Agent 隔离、持久执行、沙箱、调度 | active |
| `agent-harness` | 驾驭层设计：prompt 编排、上下文管理、工具调度、安全护栏、状态恢复 | active |
| `ai-coding` | 应用层实践：用 harness 做事的方法论、CLI 工效学、人机协作模式 | active |
| `context-engineering` | 上下文管理、Prefix Cache、token 膨胀治理 | active |
| `knowledge-system` | 知识管理、RAG、知识进入 Agent 上下文的链路 | active |
| `ai-safety` | Agent 安全拦截、权限治理、Prompt Injection 防护 | active |
| `full-stack` | 前端工程化、跨端能力、微前端、性能优化 | active |
| `problem-solving` | 算法、智力题、抽象建模、思维敏捷度训练 | active |

## 治理规则

- 每个 artifact 的 `topics` 必填，1-3 个
- 新 topic 必须在此注册，不能随手创建
- tag 出现 5 次以上时触发晋升评审
- topic 总量超过 15 个时触发审查提醒（不硬阻塞）
- 每季度审查一次活跃度，无 artifact 产出的 topic 标记 dormant
