# Gateway 远程接入与移动端路线图

> 状态：执行中
>
> GitHub 跟踪：[#320](https://github.com/QwenAudio/qwen-audio-agent/issues/320)
>
> 协议：[Gateway 客户端协议](../gateway-protocol.zh.md)

## 目标

让客户端无论运行在 Gateway 本机、另一台电脑还是移动设备上，都能连接同一个个人
Gateway。桌面端、WebUI、TUI 与移动端始终是可替换的客户端环境，共用
同一套 GCP，不依赖具体实时服务提供商或后端代理。

远程接入是一种部署拓扑，不是一种客户端类型，也不是一套新业务协议：

```text
桌面端 ─┐
WebUI ───┤
TUI ─────┼── 基于 WebSocket 的 GCP ── Gateway ── 后端端口
移动端 ──┘               ▲
                         └── 本机、LAN、Tailnet 或连接码覆盖的端点
```

## 架构边界

1. **网络模式**由 Gateway 持有：本机默认监听 loopback，LAN 显式监听 `0.0.0.0`，Tailnet
   调用用户已安装并登录的系统 `tailscale serve`。外部反向代理独立部署，只在生成连接码时
   覆盖端点。项目不内嵌或下载 Tailscale 网络栈。
2. **访问认证**发生在 GCP 之前。字面量 loopback 保持零配置；任何非 loopback 的
   HTTP 或 WebSocket 请求都必须携带配置密钥或已配对设备凭据。
3. **GCP 会话**承载媒体、输入、任务、权限、客户端事件、客户端操作、历史、
   回放与接管，不知道端点如何发布。
4. **客户端展示**持有平台 I/O 与 UI。客户端类型只用于诊断；行为由协商后的
   能力决定，不能由类型分支决定。

Tailscale 名称、身份和内部事件只存在于远程访问模块，不得进入 GCP 信封、模型上下文、
任务状态或后端端口。客户端最终只看到普通 Gateway 端点。

## 用户体验

- 本机客户端继续零配置连接 `http://127.0.0.1:3101`。
- Gateway CLI 只提供本机、`gateway --lan` 和 `gateway --tailnet` 三种启动模式；
  `gateway pair` 直接签发可撤销设备凭据并统一输出二维码和连接码，外部代理地址通过
  `gateway pair --endpoint` 覆盖。Tailnet 模式下 Gateway 主机与远程设备都使用官方
  Tailscale 并加入同一 Tailnet。
- 远程桌面端、TUI、WebUI 或移动端消费同一种直接连接码，无需 HTTP 交换即可将独立
  设备凭据保存到平台安全存储。
- 可以配对多台设备，但每个用户只有一个活动交互客户端。第二个客户端必须询问用户，
  确认后才协商 `session.takeover`。
- 相同 `client.instance_id` 的断线重连自动完成；不同客户端接管后不得互相重连抢占。

客户端不需要理解 Tailscale 或反向代理实现，也不需要共享宿主级长期令牌。网络安装与登录
留在网络层，Gateway 只消费最终端点。

## 共享公开模型

端点描述只表达可达地址，不进入 GCP：

```json
{
  "version": 1,
  "url": "https://gateway.example.ts.net",
  "transport": "websocket",
  "secure": true
}
```

连接配置文件只保存安全存储引用，不保存凭据正文：

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

直接连接码是只展示一次的传输信封，解码后包含：

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

原生客户端使用授权标头。移动端的本地 WebView 无法给 WebSocket 升级设置标头，因此在 TLS 内使用第二个
WebSocket 子协议值承载可撤销设备凭据，服务端只选择并回显公开的 GCP 子协议。
凭据不进入 URL、GCP 消息、日志或模型上下文。

## RA0 — 固化远程接入契约

- [x] 合并中英文路线图，并关联 issue #320。
- [x] 定义端点、连接配置文件与配对码契约。
- [x] 为已有 loopback、令牌、配对、租约与接管行为补齐特性描述。
- [x] 明确管理请求不占用活动交互客户端租约。

完成条件：Tailscale 实现细节不进入 GCP、实时服务、任务、后端端口或客户端。

## RA1 — 端点与连接配置文件

- [x] 增加带版本的连接配置文件存储与凭据存储端口。
- [x] 服务端访问配置和客户端设备凭据分别管理。
- [x] 发布创建和消费配对码的共享辅助工具。

完成条件：任意原生客户端可以通过统一连接配置文件保存并重新连接。

## RA2 — Gateway 公开端点

- [x] 通过系统 `tailscale serve` 发布 Tailnet 私有 HTTPS/WSS 端点，并保持 Gateway
  监听器只监听 loopback。
- [x] 支持在 `gateway pair --endpoint` 中使用用户维护的外部 HTTPS 来源，不把反向代理
  建模为 Gateway 启动模式。
- [x] 增加统一的 `gateway pair`、`devices` 与 `revoke` 命令，删除额外的远程命令层。
- [x] 保持网络发布与 Gateway 配对/设备授权彼此独立。
- [ ] 在真实手机上验证 GCP WebSocket 与长时间音频连接。

完成条件：用户无需复制长期令牌；LAN 用户主动控制监听范围，Tailnet 用户在 Gateway
主机和远程设备上安装官方 Tailscale，外部 HTTPS 用户自行维护可信代理。

## RA3 — 第一方远程客户端对齐

- [x] 给参考客户端配置文件增加 `mobile`，移除 Gateway 中驱动行为的客户端类型白名单。
- [x] 增加最小未认证浏览器配对壳；所有业务 API 与应用页面继续受保护。
- [x] 远程 WebUI 使用 HttpOnly 会话，并能安全重连。
- [x] 桌面端与 TUI 可以消费配对码，并将可撤销凭据保存在普通设置之外（桌面端使用
  操作系统保护存储；缺少跨平台系统钥匙串接口的终端客户端使用仅当前用户可读文件）。
- [x] 统一 occupied、接管确认、replaced、revoked、offline 与 reconnecting 状态。

完成条件：桌面端、WebUI 与 TUI 在本机和远程模式下通过同一套一致性测试套件。

## RA4 — 移动端客户端

- [x] 只复用公开 Gateway 客户端 SDK 与能力配置文件，不导入 Gateway、实时服务、
  ACP、A2A 或 Electron 内部实现。
- [x] 支持二维码/深链接配对与安全凭据存储。
- [x] 支持实时麦克风、音频播放、语音打断、静音、文本、图片/文件、对话历史、任务
  卡片、权限与后台追问响应、重连/回放和显式接管。
- [x] 语音与文字输入共用同一个对话模型。
- [x] 产出可复现的 iOS、Android 开发构建。

完成条件：手机通过私有 Tailnet HTTPS 端点完成一次配对后，后续可自动重连，并
完成与 WebUI 相同的核心对话和任务流程。

## RA5 — 加固与发版准备

- [x] 增加远程未认证、来源绕过、配对码过期/重放、设备撤销和旧租约的反例测试。
- [x] 移动端在应用重启后复用配对时持久化的客户端实例身份，避免被误判为新客户端。
- [ ] 测试 Tailnet 直连/DERP 回退、Wi-Fi/蜂窝切换、电脑休眠/唤醒、Gateway 重启，以及
  一小时 WebSocket/音频会话。
- [x] 对桌面端、WebUI、TUI 与移动端执行统一协议一致性测试。
- [x] 增加 macOS、Windows、Linux、iOS 与 Android 构建检查；真实设备场景仍按上一项
  执行。
- [x] 参考路径可复现后更新中英文用户手册与开发构建说明。

完成条件：远程路径安全失败、恢复后不重复输入或播报，并且不影响本机零配置体验。

## PR 规则

- 每个实现 PR 关联 issue #320，并标注 RA 阶段。
- 协议/核心、公开端点网络适配器与移动端 UI 尽量保持独立评审。
- 每个公开模型同时提交 Schema、解析器、反例测试和中英文文档。
- 远程访问模块不得改变 Gateway 任务、实时服务、后端端口或 GCP 行为。
- 客户端不得把凭据正文存入普通设置、日志、URL、二维码历史或模型可见上下文。