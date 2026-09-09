# 网关客户端协议

> 状态：**稳定版 6.0**<br>
> 线路协议版本：**7.0.0**<br>
> 路线图：[GitHub issue #251](https://github.com/QwenAudio/qwen-audio-agent/issues/251)<br>
> 当前实现事实来源：`shared/protocol/gateway-client-protocol.mjs`、`server/src/client/client-event-router.mjs`、`server/src/client/client-command-runtime.mjs`、`shared/protocol/realtime-events.mjs`、`shared/protocol/gateway-events.mjs` 与 `server/src/core/gateway-protocol.mjs`

本文档定义了 qwen-audio-agent 网关与每个已认证用户的一个活动客户端环境之间已实现的北向协议。当前第一方客户端使用 6.0 线路协议；健康契约 5.x 的旧入口仅作为临时兼容别名保留。

## 1. 产品边界

```text
客户端环境
        ↕ 网关客户端协议
网关核心 + 实时前端代理
        ↕ 后端端口
后端代理
```

三个角色相互独立：

- **网关核心** 管理实时前台代理、对话、工具、任务生命周期、权限、路由、呈现与恢复。
- **后端代理** 是用户提供的执行环境。网关仅通过 `BackendPort` 访问，由 ACP、A2A 或自定义适配器实现。
- **客户端环境** 负责输入/输出、显示、播放、本地用户体验、传感器、客户端状态、用户行为和外部环境动作。

TUI、WebUI 和桌面悬浮球是第一方参考客户端；OpenCode、Qwen Code、MiniMax Code、Pi、OpenClaw、远程 A2A 代理等是参考后端。两者都不限制框架可接入的实现。

## 2. 架构不变量

1. 每个已认证用户在同一时间只有一个活动客户端连接。默认个人部署只有一个用户，因此仍表现为单客户端。
2. 客户端的业务流量使用一条 WebSocket，不额外建立上下文或观察者连接。
3. 原始音频走媒体快速路径，只有已提交的语义输入进入语义路由。
4. 客户端**事件**描述发生了什么；客户端**动作**要求环境执行操作并返回结果。
5. 实时工具调用是模型接口；适用的工具调用由 `ClientActionPort` 映射为客户端动作。
6. 网关决定事件是确定性处理、仅进入模型上下文、稍后回复还是立即回复。
7. 客户端事件不能伪造网关、任务、权限或后端生命周期事件。
8. 实时提供商与后端协议的原生协议对象不能跨越此边界。所有公开类型由网关定义；语义一致时，可刻意对齐外部标准中熟悉的字段命名和形状。
9. 本地静音、窗口布局、唤醒手段和渲染属于客户端；只有影响共享状态的部分进入协议。
10. 在全部第一方客户端完成迁移并具备一致性测试覆盖前，现有行为通过兼容别名继续可用。

### 2.1 访问边界

网关访问认证与 GCP 明确分层。访问凭据在 `session.hello` 之前完成身份认证；
访问令牌不会进入 GCP 信封、模型上下文、任务事件或日志。

- 本机回环访问继续保持零配置，网关默认仍仅监听 `127.0.0.1`。
- 显式 `--lan` 模式监听 `0.0.0.0`，但仅发布自动选择的物理网卡 IPv4 `ws://` 端点；
  该模式仅面向可信局域网，不支持直接暴露到公网。
- 远程 HTTP 与 WebSocket 必须使用配置的访问密钥，或网关主机签发的可撤销设备令牌。
- 原生客户端在 WebSocket 握手时使用 `Authorization: Bearer <token>`；浏览器通过 WebSocket 子协议携带同一令牌。
- 远程浏览器来源必须显式写入 `QWEN_AUDIO_AGENT_ALLOWED_ORIGINS`。远程部署应使用可信 VPN 或 HTTPS/WSS 反向代理，不支持直接暴露到公网。
- 一个配置密钥映射一个用户；可选的 `QWEN_AUDIO_AGENT_ACCESS_KEYS` JSON 数组可把不同密钥映射到不同用户，而无需修改 GCP。

本机操作者可对运行中的网关执行 `qwenaudio gateway pair`，直接生成一个包含准确
网关地址与可撤销设备令牌、并可直接打开 WebUI 的短浏览器兼容连接码。
设备令牌仅以 SHA-256 摘要持久化，明文凭据仅显示一次；原生远程客户端无需再通过
HTTPS 换取令牌。浏览器扫码页仅把 fragment 中的令牌换成 HttpOnly Cookie。本机管理
接口可列出和撤销设备。
旧版一次性配对接口仍作为兼容路径保留。

端点发布、设备连接码签发与设备管理等主机管理请求不属于交互式 GCP 会话。
它们独立完成认证，也不会取得或替换活动客户端租约。

## 3. 连接与能力协商

客户端连接 `ws://<gateway>/api/realtime`，第一条消息必须是 `session.hello`。

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

`connection.output_voice` 是可选的会话级输出音色偏好。网关将它交给当前
实时提供商解释；未设置时继续使用提供商的部署级默认音色。对于仅允许在
首次会话配置音色的提供商，网关在运行时切换时仅重建上游提供商会话；
客户端 GCP 连接与网关会话保持不变。

网关返回协商后的版本与能力交集：

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
    "client.actions.desktop.presence.enter_sleep",
    "session.replay"
  ]
}
```

规则：

- 同一用户已有活动客户端时，另一客户端默认收到 `client_occupied` 后关闭。
- 协商了 `session.takeover` 的客户端可在 `session.hello` 中设置 `connection.takeover: true`。网关会关闭原客户端，并授予单调递增的新租约代次。
- 相同 `client.instance_id` 的重连无需显式接管，会自动替换旧套接字。
- 不同用户彼此独立，但每个用户仍只有一个活动客户端。
- WebSocket 关闭或心跳超时后释放租约；租约代次 fencing 会阻止旧套接字释放或修改新租约。
- 协商了 `session.heartbeat` 的客户端必须使用关联的 `session.pong` 回复网关的每个 `session.ping`；正常业务消息同样会续租。这避免依赖某些反向代理无法可靠保留的 WebSocket 控制帧。
- 6.0 不提供观察者连接或同一用户下的并发多客户端控制。
- 客户端必须依据协商后的 capabilities 判断能力，不能仅比较产品版本。
- 协议版本、客户端身份和能力不能在当前连接中改变；需要改变时重连。
- 6.0 不定义 `context_source`、`integration` 或观察者连接角色。车辆总线、CRM、传感器等上下文来源通过客户端侧适配器接入当前活动客户端环境，再由该客户端校验并转发已注册的语义事件。

### 3.1 GCP1 兼容实现

GCP1 在不分叉网关业务逻辑的前提下实现信封与握手。6.0 客户端以
`session.hello` 开始；网关返回 `session.ready`，为后续下行事件补充
`event_id`，并将 6.0 输入别名归一化到现有内部事件模型。5.x 客户端仍可使用
`connect`，收到的旧事件形状保持不变。握手仅协商已有运行时实现的能力。GCP2 的
客户端事件与运行时命令能力、GCP3 代理交付、GCP4 客户端动作
以及 GCP5 参考客户端与有限回放均已实现。

### 3.2 GCP2 运行时实现

GCP2 在协商后的同一条 WebSocket 上实现 `client.event.publish`，以及第 5.4 节的
任务、权限和对话历史命令。即时结果与错误通过 `request_event_id` 关联。现有 REST
路由调用同一个运行时命令服务，并暂时作为兼容别名保留。

客户端事件定义在网关组合阶段注册。注册表统一定义负载
Schema、大小、频率、保存、合并、最大路由等级与可选确定性处理器。网关根据
已认证连接填写所有者、会话、客户端类型与客户端实例；这些可信字段不能由
事件数据提供。首个内置定义是 `desktop.presence.sleep_requested`。GCP2 负责接收、
校验、保存和确定性处理，不会将其伪装成用户输入；GCP3 已将其投影到统一的代理
交付边界。

确定性处理器可以使用网关宿主提供的窄效果，例如从部署方拥有的
助手配置文件白名单中为当前实时会话选择一项。客户端仍然只能发送
Schema 校验过的标识：事件数据不会直接变成指令，效果也不接受任意提示文本。

### 3.3 GCP3 交付实现

GCP3 实现第 6 节定义的提供商无关值与四种路由模式。任务最终结果、有意义的低频
进展、权限请求和已注册客户端事件投影统一进入 `RealtimeAgentDeliveryRuntime`。
实时提供商仅编码最终的上下文项与可选回复；客户端或后端协议原始对象不会
进入模型。现有任务播报的批处理、安全窗口重试、通知认领和播放确认继续作为这条共享
投影外围的可靠生命周期。

### 3.4 GCP4 客户端动作实现

GCP4 实现有关联关系的 `client.action.request/result` 与协议无关的
`ClientActionPort`。仅当当前客户端声明对应能力时，实时才能看到由
动作派生的工具。`enter_sleep`、桌面空闲事件与旧网关超时入口统一进入
幂等 `PresenceController`；支持动作的客户端只有在环境切换成功回执后才会被
标记为休眠。第一方桌面客户端已通过 `session.hello` 协商并回传动作
结果；5.x `connect` 仅保留为废弃兼容别名。

### 3.5 GCP5 参考客户端与回放实现

GCP5 发布共享 `GatewayClient` SDK，统一处理握手、命令关联、客户端动作、断线重连
和状态恢复。WebUI、桌面与 TUI 使用同一能力配置文件和一致性测试。任务
生命周期推送携带会话内递增的 `sequence`，`session.replay` 有界回放断线前未消费
的事件；随后通过同一 WebSocket 的 `task.list` 与 `conversation.history` 恢复断线期间
可能变化的最终快照。媒体增量、临时转写和即时命令结果不回放。

健康契约 `5.5.0` 起，`connect` 以及任务、权限、对话历史和会话回放的 REST
路径成为废弃兼容别名，且不会早于健康契约 `6.0.0` 删除。

## 4. 通用事件信封

网关采用扁平的 OpenAI 实时风格信封：

```jsonc
{
  "type": "client.event.publish",
  "event_id": "evt_client_42",
  "name": "user.object.touched",
  "data": { "object_id": "cup" }
}
```

| 字段 | 要求 | 语义 |
|---|---|---|
| `type` | 始终必填 | 协议事件类型 |
| `event_id` | 每个 JSON 事件 | 稳定的逻辑事件标识；回放保持原值 |
| `request_event_id` | 命令结果与命令错误 | 指向发起命令 |
| `sequence` | 可回放的服务端推送 | 在同一网关会话内严格递增 |
| `occurred_at` | 已知发生时间的语义事件 | 事件源的毫秒时间戳；网关另记接收时间 |

即时命令结果和错误不回放。媒体增量、转写增量、心跳以及 `session.replay.result` 也不回放。

命名相似是有意为之，但本文定义的 Schema 才是权威契约。复用标准字段名或兼容形状，不代表引入该标准的对象类型，也不宣称线路兼容。

所有控制消息使用 UTF-8 JSON 文本帧。6.0 在 JSON 中以 base64 承载 PCM 音频；未来可以通过能力协商增加二进制媒体帧，而不改变语义事件路由。

## 5. 协议面

### 5.1 用户输入与媒体

语义相同时采用 OpenAI 实时词汇：

| 事件 | 方向 | 语义 |
|---|---|---|
| `input_audio_buffer.append` | C→G | 追加输入音频 |
| `input_image_buffer.append` | C→G | 向实时视觉缓冲区追加一张 JPEG 帧 |
| `input_image_buffer.clear` | C→G | 丢弃尚未消费的实时视觉帧 |
| `conversation.item.create` | C→G | 提交文本、图片、文件或混合用户输入 |
| `response.cancel` | C→G | 打断当前回复 |
| `response.created` | G→C | 回复开始生成 |
| `response.output_audio.delta` / `.done` | G→C | 音频输出 |
| `response.output_audio_transcript.delta` / `.done` | G→C | 助手转写 |
| `response.done` | G→C | 回复最终状态；取消使用 `response.status = "cancelled"` |

网关扩展包括 `turn.started`、`transcript.discard`、`playback.clear` 和播放回执。`input_file` 是网关内容部分扩展，不属于 OpenAI 实时标准字段。

用户输入代表明确的用户意图，会开启或替代用户轮次。客户端语义事件不能伪装成用户输入。

`input.image` 与 `input.image_buffer` 是两个独立协商的能力。前者表示
`conversation.item.create` 中绑定回合的图片附件；后者表示与实时音频会话对齐的
临时视觉帧。仅当所选实时提供商的实际传输层已实现视觉流时，网关
才会协商 `input.image_buffer`。

```jsonc
{
  "type": "input_image_buffer.append",
  "event_id": "evt_client_frame_18",
  "occurred_at": 1787803060177,
  "media_type": "image/jpeg",
  "image": "<base64-jpeg>"
}
```

第一版仅接受 JPEG，Base64 正文不超过 256 KiB，并且每秒最多接收一帧。视觉帧仅
更新实时视觉上下文：不创建用户回合、不主动触发回复、不进入对话历史，也不会成为
后端附件。用户主动停止实时视觉或关闭相机时，客户端发送
`input_image_buffer.clear`，避免提供商在之后消费最后一帧。短暂断线或麦克风状态
切换仅暂停客户端传帧；传输恢复后继续，并保留用户已开启实时视觉的意图。会话
断开、休眠、输入抢占、麦克风静音和提供商切换仍会清除网关侧尚未消费的视觉
状态，避免旧帧跨越传输生命周期残留。

该 GCP 事件保持提供商无关。Qwen Omni 适配器会在音频开始后写入服务端图像
缓冲区；MiniCPM-o 适配器则把最近一帧放入下一批音频 `input.append` 的
`video_frames`。

### 5.2 客户端语义事件

公开、可扩展的客户端到网关 API：

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

`name` 必须由网关协议或已安装扩展注册。注册定义：

- 负载 Schema 与大小限制；
- 一次性或最新值保存策略；
- 必要时的去重或合并键；
- 默认路由策略；
- 可选的确定性处理器；
- 可选的提供商无关模型投影；
- 回放和客户端展示行为。

建议命名空间包括 `desktop.*`、`environment.*`、`vehicle.*`、`hardware.*` 和扩展自己的前缀。未知名称返回 `client_event_unsupported`，不合法数据返回 `client_event_invalid`。

调用方不能决定最终模型行为。事件定义可以选择接受 `delivery_hint`，但网关只能降级紧急程度，不能升级。

### 5.3 客户端动作

网关到客户端操作使用请求/结果事件：

```text
client.action.request
client.action.result
```

```jsonc
{
  "type": "client.action.request",
  "event_id": "
```