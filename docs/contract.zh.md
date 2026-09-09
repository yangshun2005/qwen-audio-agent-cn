# Gateway 契约

本文件是外部客户端（桌面版、CLI、WebUI，或集成 qwen-audio-agent 的平台方）可以依赖的**唯一契约索引**。未在此列出的一切（内部模块路径、配置目录内除下文点名之外的文件布局、数据库与状态文件格式）都不属于契约，可能在任意版本变更。

本文件中的每一条承诺都有测试锁定；各节表格中注明了对应测试。

## 协议版本与能力位

`GET /api/health` 返回 `protocolVersion` 与 `capabilities`。客户端应按能力位分支，而不是比较产品版本号——旧版 Gateway 会降级而不是报错。

版本号遵循 SemVer：新增能力升 minor；下文点名的任一端点或事件发生破坏性变更升 major。

稳定的 7.0 北向边界记录在 [Gateway Client Protocol](https://github.com/QwenAudio/qwen-audio-agent/blob/main/docs/gateway-protocol.zh.md) 与 [已完成的 Roadmap](https://github.com/QwenAudio/qwen-audio-agent/blob/main/docs/roadmap/gateway-client-protocol.zh.md) 中，并由已关闭的 [GitHub issue #251](https://github.com/QwenAudio/qwen-audio-agent/issues/251) 记录。GCP1–GCP5 已完成：7.0 握手、Client Event Ingress、运行时命令面、Agent Delivery、Client Action、参考 Client SDK 与有限回放均落在同一条 WebSocket 上。已实现行为仍以本契约索引为准。

线协议 7.0 将权限决定 `once` 替换为明确的 Task 级 `task`，Gateway 与客户端需要同步更新。Capability ID 保留历史名称，实际线协议版本通过 `session.hello` 协商。

当前健康契约版本为 `5.9.0`。新增的 `5.9` 能力允许网关主机直接签发设备连接码：对话客户端只用一条 WS/WSS 完成认证与业务，本机 HTTP 仅保留为宿主管理面。`5.8` 能力通过 capability 协商提供实时 JPEG 视觉帧，并把厂商线协议保留在 Realtime Provider Adapter 内。`5.7` 能力提供远程 Client 认证、一次性设备配对，以及按用户生效的活动 Client 接管与租约代次 fencing。`5.6` 能力为可替换客户端提供 Provider 无关的前台记忆控制面。`5.5` 能力提供共享参考 Client SDK、有限 Task 事件回放与断线状态恢复。第一方 WebUI、Desktop 和 TUI 已通过同一套一致性测试，Task 控制、权限决策和对话历史不再依赖内部 REST 路由。`5.4` 能力提供有关联关系的 Client Action 与共享 Presence 状态机；`5.3` 增加 Provider 无关 Agent Delivery；`5.2` 在协商后的 6.0 WebSocket 上提供已注册 Client Event Ingress 与 Task、权限、对话历史命令，同时保留 REST 兼容别名。`5.1` 能力提供可选 GCP 6.0 `session.hello` / `session.ready` 握手，同时保留 5.x `connect` 路径与业务事件别名。`5.0` 删除由后台控制的 Task `presentation` 包装：后台只返回事实性 `content` 与可选的类型化 `artifacts`，前台 Chatbot 决定如何播报，各个对话客户端决定如何呈现。同一版本同时将现有 `WS /api/realtime` 事件模型正式发布为可替换的对话客户端边界。`4.0` 将原来的 `workId` / `jobId` 双重身份收敛为 Task 的唯一短 `id`（模型工具结果中为 `task_id`），并增加 `task.updated` 增量快照。该字段变更会影响读取 Task 事件的客户端，因此升 major。`3.1` 在最终助手转写事件中增加有界 Citation。`3.0` 为原生 Task 事件提供与 A2A 对齐的 `submitted`、`working`、`auth_required` 状态，以及类型明确的产物与授权对象。它替换了 `2.x` 的 `active` 状态与不透明结果元数据，因此事件消费者必须检查下方能力位。`2.1` 新增了可选的 AG-UI Task 事件投射，且未改变默认事件流。`2.x` 接替 `feat/embedded-gateway-host-contract` 分支的 `1.x` 版本线（止于 `1.7.0`）：升 major 记录的事实是——那条线宣告过的部分能力位（如 `gateway.embedded-lifecycle`、`desktop.settings-window`）不在本契约中。从该分支迁移的宿主应重新核对下方能力位表，而不是假设旧清单仍然成立。

| 能力位 | 含义 | 锁定测试 |
| --- | --- | --- |
| `web.same-origin-ui` | Gateway 在自己的 origin 上静态托管 Web UI，webview 指向 Gateway 地址即可，无需额外配置 | `test/consumer-install.test.mjs` |
| `web.skin-assets` | 宿主可显式设置 `QWEN_AUDIO_WEB_SKINS_DIR`，在 `/skins/<id>/` 只读提供客户端资源；不扫描网关数据目录 | `test/consumer-install.test.mjs` |
| `gateway.instance-lease` | 配置目录中的租约标识运行中的实例；`/api/health` 回显 `gatewayInstanceId`，同端口的陌生进程不会被误认为本 Gateway | `test/consumer-install.test.mjs` |
| `gateway.setup-gate` | 未配置的启动以 `QWAUDIO_GATEWAY_SETUP_REQUIRED` 拒绝并附带 `missing` 清单，而不是运行一个语音不可用的实例 | `test/gateway-setup.test.mjs` |
| `gateway.settings-store` | 配置持久化由本包自持：`createSettingsStore({ configDir, clientDir })`——宿主不认识任何配置项、不持有任何配置文件 | `desktop/test/settings-store.test.mjs` |
| `gateway.remote-access-pairing` | 本机访问保持零配置；远程 HTTP/WS 必须使用配置或配对凭据，本机操作者可签发和撤销设备令牌 | `server/test/gateway-access.test.mjs`、`server/test/request-security.test.mjs` |
| `gateway.direct-device-connection` | 仅本机可调用的管理接口签发一个包含可撤销独立设备凭证的短浏览器兼容连接码；原生客户端导入时不需要 HTTP 配对或健康预检，浏览器仅把 fragment Token 换成 HttpOnly Cookie | `server/test/gateway-application.test.mjs`、`test/gateway-remote-access.test.mjs`、`desktop/test/gateway-connection.test.mjs` |
| `host.electron-entry` | `qwen-audio-agent/electron`：Electron 主进程可直接 `require` 的 CommonJS 入口，一次 `load()` 拿到全部契约 | `test/consumer-install.test.mjs` |
| `host.gateway-process` | `GatewayProcess` 随包发布：fork、端口回退、就绪握手、重启、计划退出与崩溃分离——桌面版跑的是同一份实现 | `desktop/test/gateway-process.test.mjs` |
| `input.suspend-protocol` | `POST /api/input/suspend\|resume`、`GET /api/input`；Gateway 通过 `input.suspend` / `input.resume` 把抢占传达给客户端 | `server/test/input-suspend-protocol.test.mjs` |
| `input.suspend-clears-playback` | 抢占同时清除播报，宿主录音不会录进 Gateway 自己的语音 | `server/test/input-suspend-protocol.test.mjs` |
| `input.suspend-ttl` | 持有者不主动释放时抢占自行过期 | `server/test/input-arbitration.test.mjs` |
| `input.suspend-ack` | 客户端以 `input.suspend.ack` 确认抢占生效（仅用于状态展示——不要等待它） | `server/test/input-suspend-protocol.test.mjs` |
| `tasks.ag-ui-event-stream` | `GET /api/tasks/:id/events?format=ag-ui` 将现有 Task 事件流投射为 AG-UI `ACTIVITY_SNAPSHOT`；不传 `format` 时仍为原生事件流 | `server/test/agui-event-projector.test.mjs` |
| `tasks.structured-results-authorization` | 原生 Task 事件使用与 A2A 对齐的工作状态，并暴露事实性 `result`、类型化 `artifacts` 与 `authorization`，不规定播报或 UI | `test/gateway-event-schema.test.mjs`、`server/test/task-state.test.mjs` |
| `tasks.unified-id-updates` | Task 只公开一个短 `id`；`task.updated` 携带 Adapter 归一化后的增量消息与产物 | `test/gateway-event-schema.test.mjs`、`server/test/task-manager.test.mjs` |
| `messages.citations` | 最终助手 `transcript.final` 可以携带同一轮前台检索产生的规范化 Citation | `test/gateway-event-schema.test.mjs`、`server/test/realtime-presentation-runtime.test.mjs` |
| `frontend.memory-control` | `GET/PATCH /api/memory` 供可替换客户端列出并精确编辑 Realtime 共用的 Provider 记忆文档，不暴露具体存储实现 | `server/test/gateway-application.test.mjs` |
| `realtime.conversation-client-v1` | `WS /api/realtime`、公开事件常量与消息 Schema 共同构成可替换的文本/音频/多模态对话客户端边界 | `test/gateway-event-schema.test.mjs`、`test/custom-conversation-client.test.mjs` |
| `realtime.visual-input-buffer-v1` | 协商后的 Web Client 通过 GCP `input_image_buffer.append` 追加有界 JPEG 视觉帧，并通过 `input_image_buffer.clear` 清除待消费上下文；Gateway 负责校验与节流，Qwen Omni 和 MiniCPM-o Adapter 负责厂商原生编码 | `test/gateway-client-protocol.test.mjs`、`server/test/visual-input-buffer.test.mjs`、`server/test/realtime-provider.test.mjs`、`server/test/minicpm-o-provider.test.mjs`、`web/test/camera-input.test.mjs` |
| `realtime.gateway-client-protocol-v6-handshake` | 同一 WebSocket 可选择以 7.0 `session.hello` 接入，返回有关联关系的 `session.ready`，协商已实现能力，并把 7.0 输入别名归一化到现有业务路径 | `test/gateway-client-protocol.test.mjs`、`server/test/gateway-client-handshake.test.mjs` |
| `realtime.gateway-client-protocol-v6-runtime-commands` | 协商后的 7.0 Client 可以通过同一 WebSocket 发布已注册的语义 Client Event，并使用有关联结果的 Task、权限、对话历史和会话输出音色命令；现有 REST 路由调用同一命令服务作为兼容别名 | `test/gateway-client-protocol.test.mjs`、`server/test/client-event-router.test.mjs`、`server/test/client-command-runtime.test.mjs`、`server/test/gateway-client-handshake.test.mjs` |
| `realtime.gateway-client-protocol-v6-agent-delivery` | Client Event、Task 结果与低频进展、权限请求统一跨越 Provider 无关 `AgentDelivery` 边界，并支持 `handle`、`context`、`respond`、`interrupt` 四种模式 | `server/test/agent-delivery.test.mjs`、`server/test/client-event-router.test.mjs`、`server/test/realtime-provider.test.mjs`、`server/test/announcement-manager.test.mjs` |
| `realtime.gateway-client-protocol-v6-client-actions` | 有关联关系的 `client.action.request/result` 执行 Client 自有环境操作；`enter_sleep` 按 capability 暴露，只有 Client 成功后才提交 sleeping | `test/gateway-client-protocol.test.mjs`、`server/test/client-action-port.test.mjs`、`server/test/gateway-client-handshake.test.mjs`、`desktop/test/enter-sleep-flow.test.mjs` |
| `realtime.gateway-client-protocol-v6-reference-client-replay` | 共享参考 Client SDK 统一处理握手、命令关联、`updateOutputVoice()`、Client Action、重连与状态恢复；Task 推送以 `sequence` 有限回放，WebUI、Desktop、TUI 共用一致性测试 | `test/gateway-client-sdk.test.mjs`、`test/gateway-client-conformance.test.mjs`、`server/test/gateway-client-protocol-session.test.mjs`、`server/test/gateway-client-replay-buffer.test.mjs` |
| `realtime.gateway-client-protocol-v6-owner-takeover` | 每个已认证用户只有一个活动 Client 租约；显式接管、同实例重连、心跳过期与单调递增的租约代次共同阻止旧 Socket 重新取得控制 | `server/test/active-client-leases.test.mjs`、`server/test/gateway-client-handshake.test.mjs` |
| `desktop.orb-shell` | 悬浮球形态的主进程契约随包发布：`bindOrbShell` 应答随包 preload 发出的全部通道 | `desktop/test/orb-shell.test.mjs` |
| `desktop.orb-window-factory` | `createOrbWindow` 持有悬浮球窗口配方；其 `destroy()` 是宿主的同步销毁路径（渲染进程退出才能确定性释放麦克风） | `desktop/test/orb-window.test.mjs` |
| `desktop.orb-placement` | `createOrbPlacement` 覆盖默认锚点、显示器夹取与拖放持久化 | `desktop/test/orb-placement.test.mjs` |
| `desktop.orb-position-store` | 悬浮球位置由本包记忆（settings store 的 ui-state） | `desktop/test/settings-store.test.mjs` |
| `desktop.skin-store` | 皮肤的导入、列表、删除与生效决策是发布的库接口 | `desktop/test/skin-store.test.mjs` |

能力位清单本体是 `server/src/core/gateway-protocol.mjs` 的 `GATEWAY_CAPABILITIES`；`test/gateway-contract.test.mjs` 会在能力位与本文档不一致时失败。

## 包入口（package exports）

只有下列子路径属于契约；按内部路径引用不受支持，随时会断。

| 入口 | 导出 |
| --- | --- |
| `qwen-audio-agent/electron` | **CJS**：`load()`（一个命名空间拿到全部契约）、`PRELOAD_PATH` |
| `qwen-audio-agent/gateway-protocol` | `GATEWAY_PROTOCOL_VERSION`、`GATEWAY_CAPABILITIES` |
| `qwen-audio-agent/gateway-client-protocol` | GCP 7.0 信封、握手与运行时命令 Schema、解析器、能力常量和参考 Client Helper |
| `qwen-audio-agent/gateway-client-sdk` | `GatewayClient`：WebSocket 生命周期、7.0 握手、请求关联、Client Action、有限回放和重连恢复 |
| `qwen-audio-agent/gateway-client-profiles` | WebUI、Desktop、TUI 的参考 capability profile |
| `qwen-audio-agent/gateway-access-client` | 直接签发设备连接、保留旧配对交换并通过安全存储抽象保存凭据的 Client Helper |
| `qwen-audio-agent/gateway-remote-access` | 带版本的端点、连接配置、直接连接码与旧配对 Schema；配置仅保存安全存储引用，不保存凭据 |
| `qwen-audio-agent/gateway-connection-profiles` | 带版本的 Connection Profile 持久化与原生 Client Credential Store Port |
| `qwen-audio-agent/client-events` | 供 Gateway 扩展使用的 Client Event Definition Registry、内置定义、路由 Policy 与 `GatewayEventRouter` |
| `qwen-audio-agent/client-actions` | `ClientActionPort`、内置 Action 名称、capability 映射、请求/结果关联、deadline 与进行中请求去重 |
| `qwen-audio-agent/agent-delivery` | Provider 无关的 `AgentDelivery` 值与路由模式 |
| `qwen-audio-agent/gateway-setup` | `gatewaySetupStatus`、`assertGatewaySetup` |
| `qwen-audio-agent/gateway-process` | `GatewayProcess`、`createGatewayProcess`、`GATEWAY_READY_MESSAGE`、`DEFAULT_GATEWAY_ENTRY`、`validateGatewayOrigin`、`portInUse` |
| `qwen-audio-agent/gateway-lease` | `readGatewayLease`、`findRunningGateway`、`acquireGatewayLease` |
| `qwen-audio-agent/realtime-events` | `GatewayClientEvent`、`GatewayServerEvent`、`GatewayTaskEvent` |
| `qwen-audio-agent/gateway-events` | Gateway 事件 Zod Schema 与解析函数 |
| `qwen-audio-agent/ag-ui-events` | 当前支持的 AG-UI 兼容事件 Zod Schema 与解析函数 |
| `qwen-audio-agent/gateway-client-state` | `createGatewayClientState`、`reduceGatewayClientState`、`acceptsGatewayVoiceState` |
| `qwen-audio-agent/settings` | `createSettingsStore` |
| `qwen-audio-agent/skin-store` | `importSkin`、`listSkins`、`removeSkin`、`effectiveOrbSkin`、`skinsDirectory`、`validateSkinPackage` |
| `qwen-audio-agent/orb/main` | `bindOrbShell`、`configureOrbWindow`、`ORB_CHANNELS` |
| `qwen-audio-agent/orb/window` | `createOrbWindow`、