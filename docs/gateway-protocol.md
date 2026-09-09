# 网关客户端协议

> 状态：**稳定版 6.0**<br>
> 线路版本：**7.0.0**<br>
> 路线图：[GitHub Issue #251](https://github.com/QwenAudio/qwen-audio-agent/issues/251)<br>
> 当前实现来源：`shared/protocol/gateway-client-protocol.mjs`、`server/src/client/client-event-router.mjs`、`server/src/client/client-command-runtime.mjs`、`shared/protocol/realtime-events.mjs`、`shared/protocol/gateway-events.mjs` 和 `server/src/core/gateway-protocol.mjs`

本规范定义了 qwen-audio-agent 的网关与每个经过身份验证的所有者的一个活动客户端环境之间已实现的北向边界。当前的官方客户端使用 6.0 线路协议；健康契约 5.x 别名暂时保留以用于兼容。

## 1. 产品边界

```text
客户端环境
        ↕ 网关客户端协议
网关核心 + 实时前端代理
        ↕ 后端端口
后端代理
```

这三个角色有意保持独立：

- **网关核心** 拥有实时前端代理、对话、工具、任务生命周期、授权、路由、呈现和恢复。
- **后端代理** 是用户的执行环境。网关仅通过 `BackendPort` 访问它，该端口由 ACP、A2A 或自定义适配器实现。
- **客户端环境** 拥有 I/O、渲染、播放、本地用户体验、传感器、客户端状态、用户行为以及周围环境中可用的操作。

TUI、WebUI 和 Desktop Orb 是官方参考客户端。OpenCode、Qwen Code、MiniMax Code、Pi、OpenClaw、远程 A2A 代理和其他集成是参考后端。这两个列表均不限制框架。

## 2. 不变量

1. 一个经过身份验证的所有者在同一时间只能有一个活动的客户端连接。默认的个人部署只有一个所有者，因此其行为保持单客户端。
2. 一个 WebSocket 承载客户端的业务流量。不引入第二个上下文或观察者套接字。
3. 原始音频保持在媒体快速路径上。只有已提交的语义输入才进入语义路由。
4. 客户端**事件**描述已发生的事情。客户端**操作**请求环境执行某项操作并返回结果。
5. 实时工具调用面向模型。`ClientActionPort` 将适用的工具调用映射到客户端操作。
6. 网关决定事件是确定性处理、添加到模型上下文、稍后回答还是立即回答。
7. 客户端事件不能伪造网关、任务、权限或后端生命周期事件。
8. 实时提供商和后端协议线路对象永远不会跨越此边界。网关拥有所有公共类型，同时在语义匹配的情况下有意将熟悉的字段名称和形状与外部标准对齐。
9. 本地静音、窗口布局、唤醒机制和渲染仍然是客户端关注的问题，除非它们影响共享的网关状态。
10. 现有行为通过兼容性别名保持可用，直到所有官方客户端都已迁移并存在一致性测试覆盖。

### 2.1 访问边界

网关访问与 GCP 有意分离。凭据在 `session.hello` 之前对主体进行身份验证；访问令牌永远不会出现在 GCP 信封、模型上下文、任务事件或日志中。

- 环回访问保持零配置，网关默认仍绑定到 `127.0.0.1`。
- 显式 `--lan` 模式绑定到 `0.0.0.0`，但仅通告所选物理接口的 IPv4 `ws://` 端点。它适用于受信任的局域网，绝不直接公开暴露。
- 远程 HTTP 和 WebSocket 访问需要配置的访问令牌或由网关主机颁发的可撤销设备令牌。
- 原生客户端在 WebSocket 握手中发送 `Authorization: Bearer <token>`。浏览器通过 WebSocket 子协议携带相同的令牌。
- 远程浏览器来源必须显式列在 `QWEN_AUDIO_AGENT_ALLOWED_ORIGINS` 中。远程部署应使用受信任的 VPN 或 HTTPS/WSS 反向代理；不支持直接公开暴露。
- 配置的令牌映射到一个所有者。可选的 `QWEN_AUDIO_AGENT_ACCESS_KEYS` JSON 数组可以将独立令牌映射到独立所有者，而无需更改 GCP。

本地操作员可以针对正在运行的网关运行 `qwenaudio gateway pair`。它直接创建一个简短的、兼容浏览器的连接代码，其中包含确切的网关端点和可撤销的设备令牌；相同的代码打开 WebUI。设备令牌仅以 SHA-256 哈希形式持久化，明文凭据仅显示一次；原生远程客户端不需要 HTTPS 令牌交换。浏览器外壳将其片段令牌交换为 HttpOnly Cookie。本地管理端点列出和撤销设备。一次性配对端点保留为兼容性路径。

主机管理请求，包括端点发布、设备凭据创建和设备管理，不在交互式 GCP 会话范围内。它们独立进行身份验证，并且从不声明或替换活动的客户端租约。

## 3. 连接与协商

客户端连接到 `ws://<gateway>/api/realtime`。第一条消息是 `session.hello`。

```jsonc
{
  "type": "session.hello",
  "event_id": "evt_client_1",
  "protocol": { "min": "7.0.0", "max": "7.0.0" },
  "client": {
    "type": "desktop",
    "version": "1.12.0",
    "instance_id": "desktop_7f3a"
  },
  "capabilities": [
    "input.audio",
    "input.text",
    "input.image",
    "playback.receipts",
    "tasks.commands",
    "permissions.respond",
    "conversation.history",
    "client.events",
    "session.output_voice",
    "session.takeover",
    "session.heartbeat",
    "client.actions.desktop.presence.enter_sleep",
    "session.replay"
  ],
  "locale": "zh-CN",
  "time_zone": "Asia/Shanghai",
  "connection": {
    "voice_enabled": true,
    "input_enabled": true,
    "output_enabled": true,
    "text_only": false,
    "output_voice": "longanlufeng"
  }
}
```

`connection.output_voice` 是可选的会话级输出语音偏好。网关将其解释留给活动的实时提供商；当它不存在时，提供商保持其部署级默认值。仅在其初始会话配置中接受语音的提供商在语音更改时需要新的实时会话。在运行时，网关执行该上游重建，同时保留客户端的 GCP 连接和网关会话。

网关返回所选版本和能力交集：

```jsonc
{
  "type": "session.ready",
  "event_id": "evt_gateway_1",
  "request_event_id": "evt_client_1",
  "protocol_version": "7.0.0",
  "session_id": "session_01",
  "connection": {
    "lease_generation": 7,
    "replaced": false
  },
  "capabilities": [
    "input.audio",
    "input.text",
    "input.image",
    "playback.receipts",
    "tasks.commands",
    "permissions.respond",
    "conversation.history",
    "client.events",
    "session.output_voice",
    "session.takeover",
    "session.heartbeat",
    "client.actions.desktop.presence.enter_sleep",
    "session.replay"
  ]
}
```

规则：

- 当存在活动客户端时，同一所有者的另一个客户端会收到 `client_occupied` 并被默认关闭。
- 协商了 `session.takeover` 的客户端可以在 `session.hello` 中设置 `connection.takeover: true`。网关关闭先前的客户端并授予新的、单调递增的租约代数。
- 来自同一 `client.instance_id` 的重新连接会替换其过期的套接字，而无需显式接管。
- 所有者是独立的。每个所有者仍然恰好有一个活动客户端。
- 当套接字关闭或其心跳过期时，租约被释放。租约代数防护可防止过期的套接字释放或修改较新的租约。
- 协商了 `session.heartbeat` 的客户端必须使用关联的 `session.pong` 回答每个网关 `session.ping`。应用程序流量也会刷新租约。这避免了依赖某些反向代理无法可靠保留的 WebSocket 控制帧。
- 6.0 中不存在观察者连接或并发多客户端控制。
- 客户端必须根据协商的能力分支，而不是产品版本。
- 协议版本、客户端身份和能力在未重新连接的情况下不能更改。
- 版本 6.0 未定义 `context_source`、`integration` 或观察者连接角色。车辆总线、CRM 数据源、传感器和其他上下文源通过客户端适配器附加到活动客户端环境；该客户端验证并中继注册的语义事件。

### 3.1 GCP1 兼容性推出

GCP1 实现了信封和握手，而无需分叉网关业务逻辑。6.0 客户端以 `session.hello` 开始；网关返回 `session.ready`，将 `event_id` 添加到后续出站事件，并将 6.0 输入别名规范化为现有的内部事件模型。5.x 客户端可以继续以 `connect` 开始，并接收不变的旧版事件形状。只有具有可用运行时的能力才会被协商。GCP2 客户端事件和运行时命令能力、GCP3 代理交付、GCP4 客户端操作以及 GCP5 参考客户端和有界重放均已实现。

### 3.2 GCP2 运行时推出

GCP2 在协商的 WebSocket 上添加了 `client.event.publish` 以及第 5.4 节中的任务、权限和对话历史命令。即时结果和错误通过 `request_event_id` 关联。现有的 REST 路由调用相同的运行时命令服务，并保持为临时兼容性别名。

客户端事件定义在网关组合时注册。注册表拥有载荷 Schema、大小、速率、保留、合并、最大路由以及可选的确定性处理程序。网关从经过身份验证的连接中标记所有者、会话、客户端类型和客户端实例；这些受信任字段均不接受来自事件数据的值。第一个内置定义是 `desktop.presence.sleep_requested`。GCP2 接受、验证、保留和处理该事件，而不假装它是用户输入；GCP3 现在通过共享的代理交付边界投影它。

确定性处理程序可以使用其网关主机提供的窄效果，例如为当前实时会话选择一个部署拥有的助手配置文件。客户端仍然只发送经过 Schema 验证的标识符：事件数据永远不会成为指令，任意提示文本不是允许的效果输入。

### 3.3 GCP3 交付推出

GCP3 实现了提供商中立的数值以及第 6 节中的所有四种路由模式。任务结果、低频有意义的进度、权限提示和已注册的客户端事件投影使用一个 `RealtimeAgentDeliveryRuntime`。实时提供商仅编码生成的上下文项和可选响应；原始客户端或后端协议对象永远不会进入模型。现有的任务公告批处理、安全窗口重试、通知声明和播放确认仍然是该共享投影周围的可靠生命周期。

### 3.4 GCP4 客户端操作推出

GCP4 实现了关联的 `client.action.request/result` 消息和协议中立的 `ClientActionPort`。活动客户端能力门控操作派生的实时工具。`enter_sleep`、桌面空闲事件和旧版网关超时汇聚到一个幂等的 `PresenceController` 上；只有在其报告环境转换完成后，支持操作的客户端才会被标记为睡眠。官方桌面现在通过 `session.hello` 协商并返回操作结果；5.x `connect` 路径仅作为已弃用的兼容性别名保留。

### 3.5 GCP5 参考客户端和重放推出

GCP5 提供了共享的 `GatewayClient` SDK，用于握手、命令关联、客户端操作、重连和恢复。WebUI、Desktop 和 TUI 共享一个能力配置文件和一致性测试套件。任务生命周期推送携带会话单调的 `sequence`；`session.replay` 恢复断开连接时错过的有界事件，然后同一 WebSocket 上的 `task.list` 和 `conversation.history` 协调可能在离线时更改的最终状态。媒体增量、临时转录和即时命令结果不会被重放。

自健康契约 `5.5.0` 起，`connect` 以及 REST 任务、权限、对话历史和会话重放路径是已弃用的兼容性别名。它们不会在健康契约 `6.0.0` 之前被移除。

## 4. 通用事件信封

网关遵循扁平的 OpenAI Realtime 信封风格：

```jsonc
{
  "type": "client.event.publish",
  "event_id": "evt_client_42",
  "name": "user.object.touched",
  "data": { "object_id": "cup" }
}
```

| 字段 | 要求 | 含义 |
|---|---|---|
| `type` | 始终 | 协议事件类型 |
| `event_id` | 每个 JSON 事件 | 稳定的逻辑事件身份；重放保留它 |
| `request_event_id` | 命令结果和命令错误 | 标识发起命令 |
| `sequence` | 可重放的服务器推送 | 在一个网关会话内严格递增 |
| `occurred_at` | 已知时的语义事件 | 事件源处的毫秒时间戳；网关单独记录接收时间 |

即时结果和错误不会被重放。媒体增量、增量转录、心跳流量和 `session.replay.result` 也不会被重放。

命名相似性是有意的，但本规范中的 Schema 是权威的。重用标准的字段名称或兼容形状不会导入该标准的对象类型或声明线路兼容性。

所有控制消息都是 UTF-8 JSON 文本帧。版本 6.0 以 base64 形式在 JSON 中携带 PCM 音频；未来的二进制媒体能力可以在不改变语义事件路由的情况下替换它。

## 5. 协议平面

### 5.1 用户输入和媒体

在语义匹配的地方使用 OpenAI Realtime 术语：

| 事件 | 方向 | 含义 |
|---|---|---|
| `input_audio_buffer.append` | C→G | 追加输入音频 |
| `input_image_buffer.append` | C→G | 将一帧 JPEG 追加到实时视觉缓冲区 |
| `input_image_buffer.clear` | C→G | 丢弃任何待处理的实时视觉帧 |
| `conversation.item.create` | C→G | 提交文本、图像、文件或混合用户输入 |
| `response.cancel` | C→G | 中断当前响应 |
| `response.created` | G→C | 响应生成已开始 |
| `response.output_audio.delta` / `.done` | G→C | 音频输出 |
| `response.output_audio_transcript.delta` / `.done` | G→C | 助手转录 |
| `response.done` | G→C | 最终响应状态；取消为 `response.status = "cancelled"` |

网关扩展包括 `turn.started`、`transcript.discard`、`playback.clear` 和播放回执。`input_file` 是网关内容部分扩展，不是 OpenAI Realtime 标准部分。

用户输入是权威的用户意图，并打开或取代用户轮次。客户端语义事件永远不会冒充用户输入。

`input.image` 和 `input.image_buffer` 是不同的协商能力。前者涵盖 `conversation.item.create` 中绑定轮次的图像部分；后者涵盖与实时音频会话对齐的临时视觉帧。仅当所选实时提供商传输实现它时，网关才协商 `input.image_buffer`。

```jsonc
{
  "type": "input_image_buffer.append",
  "event_id": "evt_client_frame_18",
  "occurred_at": 1787803060177,
  "media_type": "image/jpeg",
  "image": "<base64-jpeg>"
}
```

版本 1 仅接受 JPEG，将 Base64 主体限制为 256 KiB，并且每秒最多接受一帧。帧更新实时视觉上下文；它们不会创建用户轮次、触发响应、进入对话历史或成为后端附件。当用户停止实时视觉或关闭摄像头时，客户端发送 `input_image_buffer.clear`，以便提供商以后不能消费最后一帧。瞬时断开或麦克风状态更改仅暂停客户端帧传输；当传输就绪时，客户端恢复它，同时保留用户的实时视觉意图。会话断开、睡眠、输入暂停、麦克风静音和提供商替换仍然清除网关侧的待处理视觉状态，以便过期帧不能跨越传输边界存活。

网关事件形状是提供商中立的。Qwen Omni 适配器在音频开始后将其映射到提供商图像缓冲区；MiniCPM-o 适配器将最新帧作为 `video_frames` 放入下一个音频 `input.append` 中。

### 5.2 客户端语义事件

公共、可扩展的客户端到网关 API 是：

```text
client.event.publish
client.event.publish.result
```

```jsonc
{
  "type": "client.event.publish",
  "event_id": "evt_client_17",
  "occurred_at": 1787880000000,
  "name": "user.object.touched",
  "data": {
    "object_id": "cup",
    "object_name": "水杯"
  }
}
```

```jsonc
{
  "type": "client.event.publish.result",
  "event_id": "evt_gateway_31",
  "request_event_id": "evt_client_17",
  "accepted": true,
  "name": "user.object.touched"
}
```

`name` 必须由网关协议或已安装的扩展注册。注册定义了：

- 载荷 Schema 和大小限制；
- 瞬时或最新值保留；
- 需要时的去重或合并键；
- 默认路由策略；
- 确定性处理程序（如果有）；
- 提供商中立的模型投影（如果有）；
- 重放和客户端呈现行为。

建议的命名空间包括 `desktop.*`、`environment.*`、`vehicle.*`、`hardware.*` 和扩展拥有的前缀。未知名称返回 `client_event_unsupported`；格式错误的数据返回 `client_event_invalid`。

调用者不选择最终的模型行为。对于允许它的事件定义，可以接受可选的 `delivery_hint`，但网关可以降级且永远不会升级请求的紧急程度。

### 5.3 客户端操作

网关到客户端的操作使用请求/结果对：

```text
client.action.request
client.action.result
```

```jsonc
{
  "type": "client.action.request",
  "event_id": "evt_gateway_51",
  "name
```