---
id: insight-agent-trust-explicit-boundary-001
type: insight
topics:
  - agent-runtime
  - ai-coding
tags:
  - trust
  - cli
sources:
  - source-notes/agent-trust-model-article.md
status: pending
created: 2026-05-21
updated: 2026-06-11
summary: CLI Agent 的 trust boundary 应该在关键工具动作前显式呈现。
---

## 触发点

读 agent trust model 文章时想到：CLI 不是网页表单，很多动作直接落到本地文件、命令和网络请求。

## 我的判断

CLI Agent 的 trust boundary 需要在关键动作前显式呈现，尤其是写文件、执行命令、删除内容和访问外部网络时。

## 还没想清楚

哪些动作必须打断确认，哪些动作可以通过策略预授权，还需要进一步拆。

## 后续可能展开

可以推导出一条 CLI 工具权限提示的 decision。
