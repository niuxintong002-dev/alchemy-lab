# AlchemyLab Conventions

> 本文是规则契约的唯一事实源。diagnostics 脚本、prompt 模板、fixture 答案卡和 judge report 只能引用本文定义的 rule_code，不能自行发明。

## Rule Codes

以下 YAML block 是 machine-readable 定义，脚本只解析此 block。正反例和人读说明在 block 之后。

```yaml
rule_codes:
  - code: INSIGHT_PENDING_NOT_TRUSTED
    group: insight
    scope: insight.status
    rule: "pending insight 不进入默认可信引用路径"

  - code: INSIGHT_SOURCES_ONLY_SN
    group: insight
    scope: insight.sources
    rule: "insight 的 sources 字段只能指向 source-note"

  - code: SOURCE_NOTE_NO_UPSTREAM
    group: source-note
    scope: source-note
    rule: "source-note 不允许 sources / derived_from 字段"

  - code: MY_TAKE_NOT_PROMOTED
    group: my-take
    scope: source-note.[!my-take]
    rule: "[!my-take] 不作为上层推导节点"

  - code: REF_NOT_ENDORSEMENT
    group: reference
    scope: sources
    rule: "引用来源不等于背书来源观点"

  - code: REF_PENDING_BLOCKED
    group: reference
    scope: derived_from
    rule: "pending insight 需先处理为 active 才能被引用为上游依据"
```

---

### INSIGHT_PENDING_NOT_TRUSTED

> pending insight 不进入默认可信引用路径。

**正例**：用户问"CLI 方向当前有哪些已确认的判断？"。AI 查到 `insight-cli-001`（status: active）和 `insight-cli-002`（status: pending）。AI 只引用 `insight-cli-001`，在排除列表中写明 `insight-cli-002` 因 status 为 pending 被排除。

**反例**：`insight-cli-002`（status: pending）正文写着"CLI 的 trust model 必须显式声明，这是确定的结论"。AI 因为正文语气肯定就把它当已确认判断引用。错误——status 是判断依据，正文语气不是。

---

### INSIGHT_SOURCES_ONLY_SN

> insight 的 sources 字段只能指向 source-note。

**正例**：用户写了一条 insight，灵感来自一篇文章笔记 `source-notes/model-spec-trust.md` 和另一条 insight `insights/insight-cli-001.md`。AI 把文章笔记放入 `sources`，把另一条 insight 放入 `derived_from`。两个字段各司其职。

**反例**：AI 把 `insights/insight-cli-001.md` 写进了 `sources` 字段。错误——insight 不是原始来源，它是上游判断，应该走 `derived_from`。`sources` 只放 source-note。

---

### SOURCE_NOTE_NO_UPSTREAM

> source-note 不允许 sources / derived_from 字段。

**正例**：用户读了一篇论文，要求创建 source-note。AI 生成的 frontmatter 里只有 id、type、topics、tags、status、created、updated。没有 sources，没有 derived_from。

**反例**：用户说"这篇论文是从另一篇综述里发现的"。AI 在 source-note 的 frontmatter 里加了 `sources: [source-notes/survey-xxx.md]`。错误——source-note 是引用链起点，不能有上游 artifact。"从哪里发现的"可以写在正文里，但不进入 frontmatter 引用关系。

---

### MY_TAKE_NOT_PROMOTED

> `[!my-take]` 不作为上层推导节点。

**正例**：用户想基于一篇 source-note 写 decision。source-note 里有一段 `[!my-take]` 写着"这个假设在 CLI 场景下不成立"。AI 提醒用户：这段想法还在 source-note 里，需要先拆成独立 insight 才能作为 decision 的上游依据。

**反例**：AI 直接把 `[!my-take]` 的内容当成 insight 引用进 decision 的 `derived_from`。错误——`[!my-take]` 是批注，不是独立判断节点，必须先拆分才能进入引用链。

---

### REF_NOT_ENDORSEMENT

> 引用来源不等于背书来源观点。

**正例**：用户写了一条 insight，`sources` 指向 `source-notes/model-spec-trust.md`。insight 正文写着"原文认为隐式 trust 可接受，但我认为在 CLI 场景下不成立"。AI 理解这条 insight 引用了 source-note 但明确不认同其结论。

**反例**：AI 看到 insight 的 `sources` 引用了 `source-notes/model-spec-trust.md`，就在回答中说"根据用户的判断，隐式 trust 是可接受的"。错误——AI 把 source-note 的观点等同于用户的观点了。sources 只表示"读过这个"，不表示"认同这个"。

---

### REF_PENDING_BLOCKED

> pending insight 需先处理为 active 才能被引用为上游依据。

**正例**：用户想创建一条 decision，要求引用 `insight-cli-002`（status: pending）。AI 提醒：这条 insight 还是 pending 状态，建议先确认并改为 active，再作为 decision 的 derived_from。

**反例**：AI 直接把 `insight-cli-002`（status: pending）写进 decision 的 `derived_from`，因为"内容看起来已经很成熟"。错误——pending 表示未经处理确认，不论内容质量如何，都不能作为 decision 的上游依据。

---

## 字段契约

> MVP 阶段只强制校验 source-note 和 insight。其余 type 保留设计，不进入脚本检查范围。

### source-note

必填：`id`, `type`, `topics`, `status`, `created`, `updated`

可选：`tags`, `origin`, `author`, `url`, `captured_at`, `summary`

禁用：`sources`, `derived_from`, `confidence`, `hypothesis`, `verdict`, `implemented_in`, `target`

### insight

必填：`id`, `type`, `topics`, `status`, `created`, `updated`

可选：`tags`, `sources`, `derived_from`, `confidence`, `visibility`, `summary`

禁用：`hypothesis`, `verdict`, `implemented_in`, `target`

字段约束：
- `sources` 只能指向 source-note
- `derived_from` 可指向其他 insight
- `status` 枚举：`pending` / `active` / `archived`
- `confidence`：MVP 不强制，完整系统保留
- `visibility`：MVP 不强制，完整系统保留
