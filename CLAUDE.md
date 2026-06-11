# AlchemyLab

> Refine experience into judgment, judgment into work — and trace the growth along the way.

## 价值观

灵感转瞬即逝，值得被善待。

AlchemyLab 让那些灵感迸发的瞬间不会因为忙碌而丢失，在有空的时候能被提纯成作品和成长轨迹。它服务的是那些即使在高压下也不愿意停止思考和探索的人。

### 使用节奏

- **高压期**（求职、工作冲刺、生活变动）：低摩擦捕获，不打断主线，保护好那些"现在没空展开但不想丢掉"的想法
- **窗口期**：捡起之前的积累，深度推进、提纯、产出
- **长期常态**：持续学习、保持对新鲜事物的敏感——这不是某个阶段的目标，是生活方式

### 原则

- 诚实优先于展示
- 写入体验优先于治理完备
- 好的积累自然产出作品

### 调性

严肃对待知识，但不严肃对待自己。允许情绪存在，但不让情绪驱动判断。规则和契约保护的不只是判断力不被时间稀释，也是不被情绪扭曲。使用系统的体验像经营自己的魔法实验室——保持平常心，耐心等待提纯完成。

## 必读

| 文件 | 角色 | 何时读 |
|---|---|---|
| `AGENTS.md` | AI 行为契约：节奏感知、三种模式行为差异、不变规则 | 任务开始前 |
| `STATUS` | 用户当前节奏声明 | 每次进入项目时 |
| `CONVENTIONS.md` | 规则契约：rule_code、字段清单、正反例 | 涉及 artifact 读写时 |
| `topics/topic-registry.md` | 受控 topic 词表 | 创建或修改 artifact 时 |

## 视任务而定

| 触发条件 | 读 |
|---|---|
| 涉及 artifact 查询 | `generated/artifacts.jsonl` |
| 涉及诊断或质量检查 | `generated/diagnostics.jsonl` |
| 涉及验收 | `evals/fixtures/` + `skills/kb-verify/` |
| 涉及 Grimoire | `grimoire/` 当前季度卷 |

## 优先级

冲突时按以下顺序：

1. **用户当前指令**
2. **AGENTS.md 行为契约 + CONVENTIONS.md 规则契约**
3. **本文件价值观**
4. **全局 AI profile**
