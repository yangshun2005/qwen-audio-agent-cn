# Gateway 客户端协议路线图

> 状态：提案
>
> GitHub 跟踪：[#251](https://github.com/QwenAudio/qwen-audio-agent/issues/251)
>
> 协议：[Gateway 客户端协议](../gateway-protocol.zh.md)

## 目标

完成 qwen-audio-agent 尚未固化的公开架构边界。`BackendPort` 已将 Gateway 与 ACP、A2A、自定义后端 Agent 隔离；本路线图继续将 Gateway Core 与 TUI、WebUI、桌面悬浮球及未来的客户端环境隔离。

最终形成三个可替换边界：

```text
客户端环境
        ↕ Gateway 客户端协议 / ClientPort
Gateway Core
        ├─ RealtimeProvider
        ↕ BackendPort
后端 Agent
```

## 当前基础

仓库已具备：

- 一条 WebSocket 承载语音、文本、播放回执、Task 与状态，但部分运行时命令仍使用内部 REST/SSE 路由；
- 共享事件常量和 Zod 消息 Schema；
- 独立用户输入运行时；
- 规范化 BackendPort 事件与 Task 投影；
- 与 Provider 无关的结果和权限注入基础；
- Task 播报排队、重试和播放确认；
- 第一方 WebUI、TUI 和桌面客户端。

尚未解决：

- 客户端分发仍集中在 `realtime-gateway.mjs`；
- 桌面能力与休眠仍存在特殊分支；
- 缺少通用的 Gateway 到客户端 Action/Result 契约；
- 第一方客户端的部分 Task 控制、权限、对话历史与恢复流程仍在使用内部 REST/SSE 兼容别名；
- 用户输入、Task 播报、权限和 Gateway 触发尚未共享统一语义事件/投递边界；
- 回放、完整第一方迁移与完整客户端一致性测试套件尚未实现。

## 架构规则

1. 每个 Gateway 只保留一个活动客户端。
2. 原始媒体不进入语义事件路由器。
3. 用户输入、客户端事件、Task 事件与客户端 Action 保持不同权限语义。
4. 模型是否感知、何时回复由 Gateway 策略决定。
5. 语义事件先投影成与 Provider 无关的 Agent 投递，再编码成 Provider 协议。
6. 模型可见的客户端工具来自协商后的客户端 Action 能力。
7. 使用一条 WebSocket 作为运行时控制面；REST 只保留发现、健康检查、静态配置和主机管理。
8. 所有公开 Gateway 类型由本协议定义；语义一致时，可以刻意对齐外部标准中熟悉的字段名和载荷形状。
9. 上下文来源放在单一活动客户端后面，不增加第二种连接角色。
10. 所有第一方客户端完成迁移前，每个阶段保持向后兼容。
11. 每个阶段使用独立可审查 PR，并关联 issue #251。

## GCP0 — 固化契约

- [x] 合并中英文协议和本路线图。
- [x] 记录当前 5.x 别名与特征化覆盖。
- [x] 将协议文档加入公开契约索引。
- [x] 固化标准对齐映射、WebSocket 运行时命令面和单客户端上下文来源决策。

完成条件：术语、单客户端所有权、事件/Action 语义、路由模式、休眠汇合与迁移策略可以在一个位置完整评审。

## GCP1 — 信封、握手与能力

- [x] 增加包含 `event_id`、`request_event_id`、回放 `sequence` 的 6.0 Schema。
- [x] 增加 `session.hello` / `session.ready` 协商。
- [x] 增加客户端事件、客户端 Action 和回放能力。
- [x] 增加 Task 命令、权限决策和对话历史能力。
- [x] 通过归一化层继续支持 5.x `connect` 和旧事件别名。
- [x] 发布共享解析器与客户端 SDK 辅助库。

完成条件：5.x 与 6.0 参考客户端可以连接同一个 Gateway，且不分叉业务逻辑。

## GCP2 — 客户端事件入口与运行时命令

- [x] 增加客户端事件定义注册表。
- [x] 增加 `GatewayEventRouter` 与 `client.event.publish/result`。
- [x] 增加 `task.create/get/list/cancel`、`permission.respond` 与 `conversation.history` 的 WebSocket Schema 和处理程序。
- [x] 即时命令结果通过 `request_event_id` 关联；后续 Task 与权限变化继续通过普通事件流发布，并在 GCP5 具备回放能力。
- [x] 在连接边界填写可信来源身份。
- [x] 执行 Schema、大小、频率、保存、去重与合并策略。
- [x] 以 `desktop.presence.sleep_requested` 完成首个端到端事件。

完成条件：客户端可以发布已注册的环境或用户行为事件，不需要伪装成用户文本，也不需要给 Gateway 增加新的条件分支；第一方运行时命令都有内部 REST 路径的 WebSocket 替代方案。

## GCP3 — Agent 投递

- [x] 定义与 Provider 无关的 `AgentDelivery` 以及 `handle`、`context`、`respond`、`interrupt`。
- [x] 为全部实时 Provider 增加仅上下文注入。
- [x] 抽取共享投递串行化与 Provider 投影，同时保留 Task 链路的阻塞、重试和播放确认生命周期。
- [x] 让有意义的 Task、权限、Gateway 与客户端事件投影使用共享投递运行时。
- [x] 高频进展和媒体不进入模型路径。

完成条件：同一个事件可以只更新 Gateway/UI、静默更新模型上下文，或只产生一次安全的实时回复，并且 Gateway 不包含 Provider 专属逻辑。

## GCP4 — 客户端 Action 端口

- [x] 增加 `ClientActionPort` 与 `client.action.request/result`。
- [x] 在握手中声明客户端 Action 能力。
- [x] 只有客户端支持时才暴露 Action 派生的实时工具。
- [x] 将 `enter_sleep` 从 `requestClientState()` 迁移到共享 Action 链路。
- [x] 以一个幂等 `PresenceController` 处理用户主动、自动、超时与重复休眠请求。
- [x] 客户端 Action 成功后才标记 sleeping。

完成条件：实时工具调用与 Gateway 兜底共用一个 Action/状态机，Gateway Core 不再知道桌面如何隐藏窗口。

## GCP5 — 参考客户端、回放与稳定

- [x] WebUI、TUI、桌面迁移到共享参考客户端 SDK。
- [x] 增加有界回放与重连恢复。
- [x] 将 Task 控制、权限决策、对话历史和 Task 事件恢复从内部 REST/SSE 别名迁走。
- [x] 对所有第一方客户端运行同一套一致性测试套件。
- [x] 在 `docs/contract.md` 及中文版记录有测试锁定的能力。
- [x] 旧别名至少经过一个明确废弃版本后再删除。
- [x] 替代链路验证完成后，才将 6.0 规范标记为稳定。

完成条件：第一方客户端只包含表示层与环境行为，不自行重建 Gateway 状态机；Gateway 不包含第一方客户端实现分支。

## PR 规则

- 协议版本迁移、事件入口、Agent 投递与客户端 Action 不能合并成一个 PR。
- 每个 PR 关联 issue #251，并注明所属 GCP 阶段。
- 每个公开事件同时提交 Schema、解析器、反例测试、能力行为与文档。
- 删除兼容别名前，现有第一方行为必须持续通过测试。
- 任何阶段都不能让实时 Provider、ACP、A2A、Electron、React 或 CoreAudio 原生协议对象跨越公开端口；Gateway 规范明确记录的语义字段名和载荷形状对齐除外。