# Gateway 契约

本文件是外部客户端——桌面应用、CLI、WebUI 或集成 qwen-audio-agent 的平台——可以依赖的唯一索引。此处未列出的任何内容（内部模块路径、除下文指定外的配置目录内文件布局、数据库和状态文件格式）均不属于契约范围，并可能在任何版本中更改。

本文件中的每项承诺均由测试锁定；各章节中的表格会指明具体测试。

## 协议版本与能力

`GET /api/health` 报告 `protocolVersion` 和 `capabilities`。客户端应根据能力进行分支判断，而非比较产品版本——早于某项功能的 Gateway 应降级运行而非报错。

版本控制遵循 SemVer：次要版本号递增表示新增能力，主要版本号递增表示对下文提及的任何端点或事件有破坏性变更。

稳定的 7.0 北向边界在 [Gateway 客户端协议](https://github.com/QwenAudio/qwen-audio-agent/blob/main/docs/gateway-protocol.md) 及其[已完成路线图](https://github.com/QwenAudio/qwen-audio-agent/blob/main/docs/roadmap/gateway-client-protocol.md)中有文档说明，由已关闭的 [GitHub issue #251](https://github.com/QwenAudio/qwen-audio-agent/issues/251) 跟踪。GCP1–GCP5 已完成：7.0 握手、客户端事件入口、运行时命令平面、Agent 投递、客户端操作、参考客户端 SDK 和有界重放均共享同一 WebSocket。本契约索引对已实现行为保持权威性。

Wire 7.0 将权限决策 `once` 替换为显式的 Task 作用域 `task`。Gateway 和客户端必须同步更新。能力 ID 保留其历史名称；通过 `session.hello` 协商实际的 wire 版本。

当前健康契约版本为 `5.9.0`。增量 `5.9` 系列新增主机签发的直接设备连接码：会话客户端通过一个 WS/WSS 连接进行认证和操作，而回环 HTTP 仍作为主机管理平面。`5.8` 系列新增能力协商的实时 JPEG 视觉帧，同时将提供商 wire 格式保留在 Realtime Provider 适配器之后。增量 `5.7` 系列新增经过认证的远程客户端访问、一次性设备配对以及基于租约代际围栏的所有者作用域活动客户端接管。增量 `5.6` 系列为可替换客户端暴露了提供商无关的前端内存控制平面。增量 `5.5` 系列发布了共享参考客户端 SDK、有界 Task 事件重放和重连状态恢复。第一方 WebUI、Desktop 和 TUI 客户端现在通过相同的合规性测试套件，不再使用内部 REST 路由进行 Task 控制、权限决策或会话历史。增量 `5.4` 系列新增关联的客户端操作和共享 Presence 状态机。增量 `5.3` 系列新增提供商无关的 Agent 投递。增量 `5.2` 系列在协商的 6.0 WebSocket 上暴露了已注册的客户端事件入口以及 Task、权限和会话历史命令，同时保留 REST 兼容别名。增量 `5.1` 系列暴露了可选的 GCP 6.0 `session.hello` / `session.ready` 握手，同时保留 5.x `connect` 路径和业务事件别名。`5.0` 系列移除了后端控制的 Task `presentation` 信封。后端返回事实性 `content` 加上可选类型化 `artifacts`；前台 Chatbot 决定如何表达，而每个会话客户端决定如何渲染。同一系列将现有的 `WS /api/realtime` 事件模型发布为可替换的会话客户端边界。`4.0` 系列将原先的 `workId` / `jobId` 对替换为一个短 Task `id`（模型工具结果中为 `task_id`），并新增增量 `task.updated` 快照。这改变了 Task 事件形态，因此提升了主要版本号。`3.1` 系列为最终助手转录事件新增了有界引用。`3.0` 系列为原生 Task 事件提供了 A2A 对齐的 `submitted`、`working` 和 `auth_required` 状态，以及类型化 artifact 和授权值。它取代了 `2.x` 的 `active` 状态和不透明结果元数据，因此事件消费者必须检查下方能力表。`2.1` 系列新增了可选的 AG-UI Task 事件投影，而不改变其默认事件流。`2.x` 系列接替了 `feat/embedded-gateway-host-contract` 分支的 `1.x` 系列（终止于 `1.7.0`）：主要版本提升记录了该系列所宣称的能力——如 `gateway.embedded-lifecycle` 和 `desktop.settings-window`——不属于本契约。从该分支迁移的主机应重新检查下方能力表，而非假设旧列表。

| 能力 | 含义 | 锁定测试 |
| --- | --- | --- |
| `web.same-origin-ui` | Gateway 在其自身源上静态托管 Web UI；指向 Gateway URL 的 webview 无需额外配置 | `test/consumer-install.test.mjs` |
| `web.skin-assets` | 主机可显式设置 `QWEN_AUDIO_WEB_SKINS_DIR` 以在 `/skins/<id>/` 以只读方式提供客户端拥有的资源；不扫描 Gateway 数据目录 | `test/consumer-install.test.mjs` |
| `gateway.instance-lease` | 配置目录中的租约标识正在运行的实例；`/api/health` 回显 `gatewayInstanceId`，因此同一端口上的外部进程不会被误认为此 Gateway | `test/consumer-install.test.mjs` |
| `gateway.setup-gate` | 未配置的启动会被拒绝，返回 `QWAUDIO_GATEWAY_SETUP_REQUIRED` 和 `missing` 列表，而不是提供语音无法工作的实例 | `test/gateway-setup.test.mjs` |
| `gateway.settings-store` | 配置持久化由此包拥有：`createSettingsStore({ configDir, clientDir })`——主机不指定任何设置或自己的文件 | `desktop/test/settings-store.test.mjs` |
| `gateway.remote-access-pairing` | 回环保持零配置；远程 HTTP/WS 访问需要已配置或已配对的凭据，本地操作员可签发和撤销设备令牌 | `server/test/gateway-access.test.mjs`, `server/test/request-security.test.mjs` |
| `gateway.direct-device-connection` | 仅回环的管理调用签发一个短浏览器兼容连接码，包含可撤销的每设备凭据；原生客户端无需 HTTP 配对或健康预检即可导入，而浏览器将其片段令牌交换为 HttpOnly cookie | `server/test/gateway-application.test.mjs`, `test/gateway-remote-access.test.mjs`, `desktop/test/gateway-connection.test.mjs` |
| `host.electron-entry` | `qwen-audio-agent/electron`：Electron 主进程可 `require` 的 CommonJS 入口，通过一次 `load()` 加载所有 ESM 契约 | `test/consumer-install.test.mjs` |
| `host.gateway-process` | `GatewayProcess` 提供：fork、端口回退、就绪握手、重启以及区分计划退出与崩溃——桌面应用运行相同的实现 | `desktop/test/gateway-process.test.mjs` |
| `input.suspend-protocol` | `POST /api/input/suspend\|resume`、`GET /api/input`；Gateway 通过 `input.suspend` / `input.resume` 将挂起中继给客户端 | `server/test/input-suspend-protocol.test.mjs` |
| `input.suspend-clears-playback` | 挂起同时清除播放，使主机录音保持干净 | `server/test/input-suspend-protocol.test.mjs` |
| `input.suspend-ttl` | 当持有者从未恢复时，挂起会自行过期 | `server/test/input-arbitration.test.mjs` |
| `input.suspend-ack` | 客户端通过 `input.suspend.ack` 确认挂起（仅用于状态显示——绝不等待它） | `server/test/input-suspend-protocol.test.mjs` |
| `tasks.ag-ui-event-stream` | `GET /api/tasks/:id/events?format=ag-ui` 将现有 Task 流投影为 AG-UI `ACTIVITY_SNAPSHOT` 事件；省略 `format` 则保留原生流 | `server/test/agui-event-projector.test.mjs` |
| `tasks.structured-results-authorization` | 原生 Task 事件使用 A2A 对齐的工作状态，并暴露事实性 `result`、类型化 `artifacts` 和 `authorization`，而不规定语音或 UI | `test/gateway-event-schema.test.mjs`, `server/test/task-state.test.mjs` |
| `tasks.unified-id-updates` | Task 暴露一个短 `id`；`task.updated` 携带适配器规范化的增量消息和 artifacts | `test/gateway-event-schema.test.mjs`, `server/test/task-manager.test.mjs` |
| `messages.citations` | 最终助手 `transcript.final` 事件可携带从同一轮次前端检索中收集的规范化引用 | `test/gateway-event-schema.test.mjs`, `server/test/realtime-presentation-runtime.test.mjs` |
| `frontend.memory-control` | `GET/PATCH /api/memory` 允许可替换客户端列出并精确编辑 Realtime 使用的同一提供商支持的 USER/MEMORY 文档，而不依赖存储实现 | `server/test/gateway-application.test.mjs` |
| `realtime.conversation-client-v1` | `WS /api/realtime`、发布的事件常量和消息 Schema 构成可替换的文本/音频/多模态会话客户端边界 | `test/gateway-event-schema.test.mjs`, `test/custom-conversation-client.test.mjs` |
| `realtime.visual-input-buffer-v1` | 协商后的 Web 客户端通过 GCP `input_image_buffer.append` 追加有界 JPEG 视觉帧，并通过 `input_image_buffer.clear` 清除待处理上下文；Gateway 验证并限流帧，而 Qwen Omni 和 MiniCPM-o 适配器拥有提供商原生编码 | `test/gateway-client-protocol.test.mjs`, `server/test/visual-input-buffer.test.mjs`, `server/test/realtime-provider.test.mjs`, `server/test/minicpm-o-provider.test.mjs`, `web/test/camera-input.test.mjs` |
| `realtime.gateway-client-protocol-v6-handshake` | 同一 WebSocket 接受可选的 7.0 `session.hello`，返回关联的 `session.ready`，协商已实现的能力，并将 7.0 输入别名规范化为现有业务路径 | `test/gateway-client-protocol.test.mjs`, `server/test/gateway-client-handshake.test.mjs` |
| `realtime.gateway-client-protocol-v6-runtime-commands` | 协商后的 7.0 客户端可通过同一 WebSocket 发布已注册的语义客户端事件，并使用关联的 Task、权限、会话历史和会话输出语音命令；现有 REST 路由调用同一命令服务作为兼容别名 | `test/gateway-client-protocol.test.mjs`, `server/test/client-event-router.test.mjs`, `server/test/client-command-runtime.test.mjs`, `server/test/gateway-client-handshake.test.mjs` |
| `realtime.gateway-client-protocol-v6-agent-delivery` | 客户端事件、Task 结果和进度以及权限提示通过一个提供商无关的 `AgentDelivery` 边界，具有 `handle`、`context`、`respond` 和 `interrupt` 模式 | `server/test/agent-delivery.test.mjs`, `server/test/client-event-router.test.mjs`, `server/test/realtime-provider.test.mjs`, `server/test/announcement-manager.test.mjs` |
| `realtime.gateway-client-protocol-v6-client-actions` | 关联的 `client.action.request/result` 消息执行客户端拥有的环境操作；`enter_sleep` 受能力门控，且仅在客户端成功后提交睡眠 | `test/gateway-client-protocol.test.mjs`, `server/test/client-action-port.test.mjs`, `server/test/gateway-client-handshake.test.mjs`, `desktop/test/enter-sleep-flow.test.mjs` |
| `realtime.gateway-client-protocol-v6-reference-client-replay` | 共享参考客户端 SDK 拥有握手、命令关联、`updateOutputVoice()`、客户端操作、重连和恢复；Task 推送使用有界 `sequence` 重放，WebUI、Desktop 和 TUI 共享一个合规性测试套件 | `test/gateway-client-sdk.test.mjs`, `test/gateway-client-conformance.test.mjs`, `server/test/gateway-client-protocol-session.test.mjs`, `server/test/gateway-client-replay-buffer.test.mjs` |
| `realtime.gateway-client-protocol-v6-owner-takeover` | 每个已认证所有者强制执行一个活动客户端租约；协商的显式接管、同实例重连、心跳过期和单调递增的租约代际可防止过期套接字重新获得控制权 | `server/test/active-client-leases.test.mjs`, `server/test/gateway-client-handshake.test.mjs` |
| `desktop.orb-shell` | orb 表单的主进程契约提供：`bindOrbShell` 应答随附预加载发送的通道 | `desktop/test/orb-shell.test.mjs` |
| `desktop.orb-window-factory` | `createOrbWindow` 拥有 orb 窗口配方；其 `destroy()` 是主机的同步拆除路径（渲染器退出才是释放麦克风的方式） | `desktop/test/orb-window.test.mjs` |
| `desktop.orb-placement` | `createOrbPlacement` 涵盖默认锚点、显示边界限制和拖放持久化 | `desktop/test/orb-placement.test.mjs` |
| `desktop.orb-position-store` | orb 的位置由此包记忆（设置存储 ui-state） | `desktop/test/settings-store.test.mjs` |
| `desktop.skin-store` | 导入、列出、移除和解析 orb 皮肤是已发布的库接口 | `desktop/test/skin-store.test.mjs` |

列表本身是 `server/src/core/gateway-protocol.mjs` 中的 `GATEWAY_CAPABILITIES`；当能力与本文件偏离时，`test/gateway-contract.test.mjs` 将失败。

## 包入口点

仅以下子路径属于契约；通过内部路径导入任何内容均不受支持，且可能随时中断而不另行通知。

| 入口 | 导出 |
| --- | --- |
| `qwen-audio-agent/electron` | **CJS**：`load()`（所有契约在一个命名空间中）、`PRELOAD_PATH` |
| `qwen-audio-agent/gateway-protocol` | `GATEWAY_PROTOCOL_VERSION`、`GATEWAY_CAPABILITIES` |
| `qwen-audio-agent/gateway-client-protocol` | GCP 7.0 信封、握手和运行时命令 Schema、解析器、能力常量和参考客户端辅助工具 |
| `qwen-audio-agent/gateway-client-sdk` | `GatewayClient`：WebSocket 生命周期、7.0 握手、请求关联、客户端操作、有界重放和重连恢复 |
| `qwen-audio-agent/gateway-client-profiles` | WebUI、Desktop 和 TUI 的参考能力配置文件 |
| `qwen-audio-agent/gateway-access-client` | 签发直接设备连接、保留旧版配对交换以及通过安全存储抽象保存凭据的辅助工具 |
| `qwen-audio-agent/gateway-remote-access` | 版本化端点、配置文件、直接连接码和旧版配对 Schema；配置文件包含安全存储引用而非凭据 |
| `qwen-audio-agent/gateway-connection-profiles` | 版本化连接配置文件持久化和原生客户端凭据存储端口 |
| `qwen-audio-agent/client-events` | 客户端事件定义注册表、内置定义、路由策略以及用于 Gateway 扩展的 `GatewayEventRouter` |
| `qwen-audio-agent/client-actions` | `ClientActionPort`、内置操作名称、能力映射、请求/结果关联、截止时间和在途去重 |
| `qwen-audio-agent/agent-delivery` | 提供商无关的 `AgentDelivery` 值和路由模式 |
| `qwen-audio-agent/gateway-setup` | `gatewaySetupStatus`、`assertGatewaySetup` |
| `qwen-audio-agent/gateway-process` | `GatewayProcess`、`createGatewayProcess`、`GATEWAY_READY_MESSAGE`、`DEFAULT_GATEWAY_ENTRY`、`validateGatewayOrigin`、`portInUse` |
| `qwen-audio-agent/gateway-lease` | `readGatewayLease`、`findRunningGateway`、`acquireGatewayLease` |
| `qwen-audio-agent/realtime-events` | `GatewayClientEvent`、`GatewayServerEvent`、`GatewayTaskEvent` |
| `qwen-audio-agent/gateway-events` | Gateway 事件 Zod Schema 和解析器 |
| `qwen-audio-agent/ag-ui-events` | 受支持 AG-UI 兼容面的 Zod Schema 和解析器 |
| `qwen-audio-agent/gateway-client-state` | `createGatewayClientState`、`reduceGatewayClientState`、`acceptsGatewayVoiceState` |
| `qwen-audio-agent/settings` | `createSettingsStore` |
| `qwen-audio-agent/skin-store` | `importSkin`、`listSkins`、`removeSkin`、`effectiveOrbSkin`、`skinsDirectory`、`validateSkinPackage` |
| `qwen-audio-agent/orb/main` | `bindOrbShell`、`configureOrbWindow`、`ORB_CHANNELS` |
| `qwen-audio-agent/orb/window` | `createOrbWindow`、`orbWindowOptions`、`ORB_PRELOAD_PATH`、`ORB_WIND