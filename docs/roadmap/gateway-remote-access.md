# 网关远程访问与移动客户端路线图

> 状态：进行中
>
> 跟踪：[GitHub issue #320](https://github.com/QwenAudio/qwen-audio-agent/issues/320)
>
> 协议：[网关客户端协议](../gateway-protocol.md)

## 目标

允许客户端从网关主机、另一台计算机或移动设备连接到同一个个人网关。桌面端、WebUI、TUI 和移动端仍然是可互换的客户端环境。它们使用相同的 GCP，并且从不依赖于实时提供商或后端代理的实现。

远程访问是一种部署拓扑，而非客户端类型或新的应用协议：

```text
桌面端 ─┐
WebUI ──┤
TUI ────┼── 基于 WebSocket 的 GCP ── 网关 ── BackendPort
移动端 ─┘               ▲
                        └── 本地、局域网、Tailnet 或连接码端点
```

## 架构边界

1. **网络模式**由网关拥有。本地模式绑定到回环地址，局域网模式显式绑定到 `0.0.0.0`，Tailnet 模式调用用户安装并认证的系统 `tailscale serve`。外部反向代理独立部署，仅在签发连接码时覆盖端点。本项目既不嵌入也不下载 Tailscale 网络栈。
2. **访问认证**在 GCP 之前运行。字面回环地址保持零配置；每个非回环的 HTTP 或 WebSocket 请求都需要已配置或已配对的设备凭据。
3. **GCP 会话**承载媒体、输入、任务、权限、客户端事件、客户端操作、历史记录、重放和接管，而无需了解端点是如何发布的。
4. **客户端呈现**负责平台 I/O 和 UI。客户端类型是诊断元数据；协商的能力（而非类型检查）定义行为。

Tailscale 名称、身份和内部事件保留在远程访问模块内部，绝不进入 GCP 信封、模型上下文、任务状态或 BackendPort。客户端只能看到普通的网关端点。

## 用户体验

- 本地客户端继续连接到 `http://127.0.0.1:3101`，无需设置。
- 网关 CLI 仅有本地模式、`gateway --lan` 和 `gateway --tailnet` 三种运行模式。`gateway pair` 直接签发可撤销的设备凭据并生成一个二维码/连接码；使用 `gateway pair --endpoint` 可用外部代理地址覆盖它。在 Tailnet 模式下，网关主机和远程设备都使用官方 Tailscale 并加入同一个 tailnet。
- 远程桌面端、TUI、WebUI 或移动客户端使用相同的直接连接码，并将其每设备凭据存储在平台安全存储中，无需 HTTP 交换。
- 可以配对多个设备，但每个所有者只有一个活动的交互式客户端。第二个客户端在协商 `session.takeover` 之前会询问用户。
- 相同 `client.instance_id` 的重连是自动的。另一个客户端的接管绝不会导致竞争性重连循环。

客户端不理解 Tailscale 或反向代理的细节，也永远不需要共享的主机级令牌。网络安装和认证保留在网络层；网关仅使用最终端点。

## 共享公共模型

端点描述符标识可达的网关，而不进入 GCP：

```json
{
  "version": 1,
  "url": "https://gateway.example.ts.net",
  "transport": "websocket",
  "secure": true
}
```

客户端连接配置文件仅存储安全存储引用，绝不存储原始凭据：

```json
{
  "version": 1,
  "id": "phone",
  "gateway_url": "https://gateway.example.ts.net",
  "device_id": "device_example",
  "credential_ref": "platform-secure-store-key",
  "client_instance_id": "mobile_example"
}
```

直接连接码是一次性显示的传输信封。解码后包含：

```json
{
  "schema": "qwaudio.connection/v2",
  "websocket_url": "wss://gateway.example.ts.net/api/realtime",
  "device_id": "device_example",
  "credential_id": "device_key_example",
  "access_token": "per-device-secret",
  "issued_at": 1780000000000
}
```

原生客户端使用 Authorization 头。本地移动 WebView 无法向 WebSocket 升级请求添加头，因此它在 TLS 内的第二个 WebSocket 子协议值中携带其可撤销的设备凭据。服务器仅选择并回显公共的 GCP 子协议。凭据绝不会进入 URL、GCP 消息、日志或模型上下文。

## RA0 — 冻结远程访问契约

- [x] 合并此双语路线图并链接 issue #320。
- [x] 添加端点、连接配置文件和配对码契约。
- [x] 描述现有的回环、令牌、配对、租约和接管行为。
- [x] 记录管理请求不声明活动交互式租约。

退出标准：Tailscale 实现细节不进入 GCP、Realtime、Task、BackendPort 或客户端代码。

## RA1 — 端点和连接配置文件

- [x] 添加带凭据存储端口的版本化连接配置文件存储。
- [x] 保持服务器访问配置与客户端凭据分离。
- [x] 发布用于配对码创建和使用的共享辅助函数。

退出标准：任何原生客户端都可以通过一个连接配置文件契约保存并重新连接。

## RA2 — 网关公共端点

- [x] 通过系统 `tailscale serve` 命令发布私有 tailnet HTTPS/WSS 端点，同时保持网关监听器在回环地址上。
- [x] 允许通过 `gateway pair --endpoint` 使用运营商管理的外部 HTTPS 源，而无需将反向代理建模为网关运行模式。
- [x] 添加扁平化的 `gateway pair`、`devices` 和 `revoke` 命令，并移除额外的远程命令层。
- [x] 保持网络发布与网关配对/设备访问相互独立。
- [ ] 在实体手机上验证持久 GCP WebSocket 和长时间运行的音频。

退出标准：用户永远不需要复制长期有效的共享令牌。局域网用户显式控制监听器范围，Tailnet 用户在网关主机和远程设备上都安装官方 Tailscale，外部 HTTPS 用户拥有受信任的代理。

## RA3 — 第一方远程客户端对等

- [x] 将 `mobile` 添加到参考客户端配置文件，并从网关中移除驱动行为的客户端类型允许列表。
- [x] 添加最小的未认证浏览器配对外壳，同时保护所有业务 API 和应用页面。
- [x] 让远程 WebUI 持久化 HttpOnly 会话并安全地重新连接。
- [x] 让桌面端和 TUI 使用配对码并将可撤销凭据存储在普通设置之外（桌面端使用操作系统保护存储；终端客户端在没有可移植钥匙串 API 的情况下使用仅所有者可读的文件）。
- [x] 添加统一的占用、接管确认、替换、撤销、离线和重连状态。

退出标准：桌面端、WebUI 和 TUI 在本地和远程都通过相同的符合性测试套件。

## RA4 — 移动客户端

- [x] 复用公共网关客户端 SDK 和能力配置文件；不导入 Gateway、Realtime、ACP、A2A 或 Electron 内部实现。
- [x] 提供二维码/深链配对和安全凭据存储。
- [x] 支持实时麦克风采集、音频播放、语音打断、静音、文本、图像/文件输入、历史记录、任务卡片、权限和后端输入响应、重连/重放以及显式接管。
- [x] 在语音和文本输入之间保持单一对话模型。
- [x] 生成可复现的 iOS 和 Android 开发构建。

退出标准：手机通过私有 tailnet HTTPS 端点配对，稍后重新连接，并完成与 WebUI 相同的核心对话和任务流程。

## RA5 — 加固和发布就绪

- [x] 为未认证的远程请求、源绕过、过期/重放的配对码、已撤销设备和过期租约添加负面测试。
- [x] 在移动应用重启后复用已配对、持久化的客户端实例身份，以免被误认为是不同的客户端。
- [ ] 测试直接 tailnet/DERP 回退、Wi-Fi/蜂窝网络切换、计算机睡眠/唤醒、网关重启以及一小时 WebSocket/音频会话。
- [x] 对桌面端、WebUI、TUI 和移动端运行协议一致性测试。
- [x] 添加 macOS、Windows、Linux、iOS 和 Android 构建检查；真实设备场景仍由上述项目覆盖。
- [x] 在参考路径可复现后更新双语用户手册和开发构建指南。

退出标准：远程路径在失败时安全关闭，恢复时不会产生重复输入或播放，并且不会回归本地零配置使用。

## PR 政策

- 每个实现 PR 都引用 issue #320 并标明其 RA 阶段。
- 协议/核心更改、公共端点网络适配器和移动 UI 应保持可单独审查。
- 每个公共模型都附带 Schema、解析器、负面测试和双语文档。
- 远程访问模块不得更改网关 Task、Realtime、BackendPort 或 GCP 行为。
- 任何客户端都不得在普通设置、日志、URL、二维码历史记录或模型可见上下文中存储原始凭据。