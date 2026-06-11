# Judge Report 生成规则

本文件不是红队或蓝队 prompt，而是主线程生成 judge report 的处理逻辑。

## 输入

- 红队答案卡。
- 蓝队输出。
- 本轮 diagnostics 结果。

## 自动对照逻辑

对每个 question 执行以下检查：

1. include 检查：红队 `expected_include` 中的每个 `artifact_id` 是否出现在蓝队 `cited` 列表中。匹配则 PASS，缺失则 FAIL。
2. exclude 检查：红队 `expected_exclude` 中的每个 `artifact_id` 是否出现在蓝队 `excluded` 列表中。匹配则 PASS，缺失或出现在 `cited` 中则 FAIL。
3. rule_code 检查：对每个 exclude 匹配项，红队 `rule_code` 与蓝队 `exclude_rule_code` 是否一致。一致则 PASS，不一致则 NEEDS_REVIEW。
4. 候选完整性检查：蓝队 `candidates_count` 是否等于 `cited` 数量加 `excluded` 数量。相等则 PASS，不等则 FAIL。

## 输出格式

```md
# kb-verify judge report
run: {{timestamp}}
diagnostics: {{pass_count}} passed, {{error_count}} errors

## Q1: {{question_text}}

| 检查项 | 红队预期 | 蓝队实际 | 结果 |
| --- | --- | --- | --- |
| include insight-cli-001 | active, cli | cited | PASS |
| exclude insight-cli-adversary-001 | pending | excluded | PASS |
| rule_code 一致性 | INSIGHT_PENDING_NOT_TRUSTED | INSIGHT_PENDING_NOT_TRUSTED | PASS |
| 候选完整性 | 3 candidates | 1 cited + 2 excluded | PASS |

## 汇总

- PASS: {{pass}}
- FAIL: {{fail}}
- NEEDS_REVIEW: {{review}}

## 人工裁定区

仅在 FAIL 或 NEEDS_REVIEW 时出现。

| 失败项 | 失败原因 | 处置选项 |
| --- | --- | --- |
| ... | ... | 改规则 / 改 prompt / 接受局限 |

- [ ] 是否提升本轮探索性 fixture 为固定 fixture
- [ ] 是否需要补充新的 rule_code
```

## 处理边界

- 主线程生成 report，不替人做最终裁定。
- FAIL 和 NEEDS_REVIEW 项必须列出处置选项，但不自动选择。
- 全 PASS 时人只需要扫一眼确认。
