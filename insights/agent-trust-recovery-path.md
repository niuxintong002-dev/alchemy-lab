---
id: insight-agent-trust-recovery-path-001
type: insight
topics:
  - agent-runtime
  - ai-coding
tags:
  - trust
  - recovery
sources:
  - source-notes/agent-trust-model-article.md
status: pending
created: 2026-05-21
updated: 2026-06-11
summary: Trust model 不只关心授权前提示，也要覆盖误操作后的恢复路径。
---

## 触发点

同一篇文章让我想到：只问“是否允许执行”还不够，用户更关心出错后能不能恢复。

## 我的判断

CLI Agent 的 trust model 应该包含恢复路径，例如可撤销写入、操作摘要、变更 diff 和失败后的回滚提示。

## 还没想清楚

恢复能力应该由 Agent Runtime 提供，还是由上层 harness 统一编排，还需要比较。

## 后续可能展开

可以继续设计工具执行日志和回滚策略。
