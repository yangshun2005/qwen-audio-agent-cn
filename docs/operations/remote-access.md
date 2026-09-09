# 远程连接与配对

其他计算机上的移动端、桌面端以及 TUI/WebUI 可以连接到您计算机上的 Gateway。
客户端负责输入和输出；Gateway 和后端代理驻留在主机上。桌面端并非必需的转发中继。

> 以下步骤基于 `main` 分支的开发进展。请确认两个构建版本都包含远程配对功能。

## 1. 选择连接方式

默认情况下，Gateway 绑定到回环地址，并且只信任字面意义上的回环 Host/Origin。远程
请求必须先获得 Gateway 访问凭证，之后才能访问 HTTP 或 WebSocket 业务 API。请勿将
Gateway 的回环端口直接暴露到公共互联网。

客户端始终使用其连接代码中存储的 WebSocket 端点和设备令牌。网络发布和
Gateway 配对/设备授权是相互独立的层。Gateway 仅有三种运行模式：
本地（local）、局域网（LAN）和 Tailnet。

- **LAN** 模式适用于同一可信 Wi-Fi 网络上的硬件和原生客户端。Gateway
  会显式绑定到 LAN，优先选择物理接口的 IPv4 地址，并广播一个直接的 `ws://`
  端点。切勿将此端点转发到公共互联网。
- **私有 Tailnet** 模式适用于个人计算机。请在 Gateway
  主机和远程设备上都安装官方 Tailscale，并登录到同一个 tailnet。Gateway 会调用系统
  `tailscale serve` 命令来发布一个私有 HTTPS 端点。

## 2. 启动端点

如需在同一 LAN 上直接访问：

```bash
qwenaudio gateway --lan
```

这会将 Gateway 绑定到 `0.0.0.0`，而连接代码包含选定的物理接口 IPv4
地址，而非不可用的通配符地址。如需持久化服务，请使用 `qwenaudio gateway install --lan`，
或设置 `QWEN_AUDIO_GATEWAY_LAN=1`。在具有多个物理接口的主机上，设置
`QWEN_AUDIO_GATEWAY_LAN_HOST=192.168.x.x` 可显式选择一个接口。

安装并登录官方 Tailscale 后，在前台运行 Gateway：

```bash
qwenaudio gateway --tailnet
```

该命令会等待 `tailscale serve` 打印其私有 HTTPS 端点，并在 Gateway 退出时停止该
发布。如需持久化的用户服务，请运行
`qwenaudio gateway install --tailnet`，或将其放入 `config.env`：

```dotenv
QWEN_AUDIO_GATEWAY_TAILNET=1
```

反向代理不是 Gateway 的一种运行模式。当代理运行在
同一主机上时，请保持默认的本地模式；当代理运行在另一台机器上时，请使用 `--lan`。配置代理后，仅在生成连接代码时覆盖公共端点：

```bash
qwenaudio gateway pair --endpoint https://voice.example.com --name "AI Passport"
```

固定 IP 配合公开可信的 IP 地址证书可用作 `https://<fixed-ip>`。
端点必须是 HTTPS 源，且不能包含凭据、路径、查询或片段。代理必须
仅接受 HTTPS，正确转发 WebSocket，保留公共 `Host`，并将流量转发到
同一主机上的 `127.0.0.1:3101` 或 Gateway 的 LAN 地址。
同时设置 `Forwarded` 或 `X-Forwarded-For`。转发的请求不会获得本地认证
豁免，仍然需要配对或访问凭证；这些头部绝不能用于建立身份。
不要同时剥离公共 `Host` 和所有转发头部，否则 Gateway 将无法区分
代理流量与真正的本地请求。

Tailnet 仅在 `tailscale serve status --json` 确认为当前 Gateway 配置了私有 HTTPS 根代理后
才标记为就绪。CLI 打印的登录或同意 URL 并不表示就绪。
请通过官方 Tailscale 完成首次授权。

## 3. 连接客户端

端点就绪后，在 Gateway 主机上打开另一个终端并运行：

```bash
qwenaudio gateway pair --name "AI Passport"
```

Gateway 主机直接签发一个独立的、可撤销的设备令牌。小二维码包含一个
URL，例如 `https://gateway/c#credential`（在 LAN 上为 `http://IP/c#credential`），并将其作为唯一的连接代码。扫描该二维码即可打开 Gateway WebUI，即使未安装客户端；
已安装的客户端可以扫描或粘贴相同的代码。Gateway 不再生成或返回长格式的
`qwaudio://connect#...` 深度链接。凭证仅显示一次。

桌面端、移动端和其他原生客户端保存凭证，然后使用一个 WebSocket 连接进行
认证、会话协商、语音、任务、历史记录和审批——不存在 HTTPS 配对
交换。浏览器外壳会将片段中的设备令牌交换为 HttpOnly cookie；该
片段绝不会包含在 HTTP 请求或访问日志中。该流程在 LAN、Tailnet
和 `pair --endpoint` 覆盖场景下完全相同。使用 `qwenaudio gateway devices` 列出客户端，
使用 `qwenaudio gateway revoke <device-id>` 撤销某个客户端。
在滚动升级期间，只有旧版客户端需要 `qwenaudio gateway pair --legacy` 来生成
短期有效的单次配对代码。

在桌面端，将完整的连接代码粘贴到 设置 → 应用程序 → Gateway 中，然后点击
应用以保存并连接。同一字段也接受本地或之前保存的远程 Gateway URL；
没有单独的远程连接设置。

LAN 和远程访问不会绕过 Gateway 认证：WebSocket 握手必须携带设备凭证。

## 验证连接

- 检查 Gateway 连接状态，然后检查语音前端状态。导入代码不会验证模型凭证。
- 允许手机访问麦克风。Tailscale 提供网络可达性，而非 Gateway 授权。
- 当第二个客户端接管时，前一个客户端会断开连接；Gateway 本身并未退出。
- 如果代码泄露或设备变更，请撤销旧设备并在 Gateway 主机上重新运行 `qwenaudio gateway pair`。
- 如果 Tailnet 端点不可达，请检查两台设备是否在同一 tailnet 中在线，然后检查策略和 HTTPS 发布。

客户端操作步骤请参阅 [移动端](../getting-started/mobile.md) 和 [桌面端](../desktop/overview.md#remote-connections)，
其他错误请参阅 [故障排除](troubleshooting.md)。

## 高级认证与反向代理

如需单个个人访问密钥：

```dotenv
QWEN_AUDIO_GATEWAY_ACCESS_TOKEN=replace-with-at-least-24-random-characters
```

使用 `openssl rand -base64 32` 生成一个。此令牌仅用于 Gateway
访问认证；切勿将其放入 URL、GCP 消息或公共日志中。

原生客户端在 WSS 握手中将其作为 Bearer 令牌发送。浏览器客户端通过
WebSocket 子协议携带相同的令牌。如需通过
外部 HTTPS 反向代理提供浏览器 UI，请将 Gateway 保持在回环地址上，并白名单确切的公共 Origin：

```dotenv
HOST=127.0.0.1
QWEN_AUDIO_AGENT_ALLOWED_ORIGINS=https://voice.example.com
```

例如，原生 TUI 可以连接而无需将凭证放入其 URL：

```bash
QWEN_AUDIO_AGENT_URL=https://voice.example.com \
QWEN_AUDIO_GATEWAY_CLIENT_TOKEN="$ACCESS_TOKEN" \
qwenaudio tui
```

`qwenaudio gateway pair` 使用仅限回环的 `POST /api/access/devices` 管理端点来
签发直接的设备连接代码。设备可通过 `GET /api/access/devices` 列出，并通过
`DELETE /api/access/devices/:id` 撤销；撤销会立即关闭活动的 WSS 连接。
短期配对端点保留用于兼容性，但新客户端不依赖它们。

多个受信任的 Origin 可用逗号分隔。高级主机可以将不同的访问
令牌映射到不同的所有者身份：

```dotenv
QWEN_AUDIO_AGENT_ACCESS_KEYS='[{"token":"replace-with-a-long-random-token","owner_id":"user_alice","label":"Alice"}]'
```

每个所有者拥有一个活动的客户端租约。第二个客户端将被拒绝，除非它使用
相同的 `client.instance_id` 重新连接或显式协商 `session.takeover`；接管会关闭
前一个客户端，并对其套接字发送的延迟消息进行代际隔离。

`QWEN_AUDIO_AGENT_AUTH_SECRET` 仅用于签署本地和远程会话身份。它不是
远程访问密码，绝不能被发送到客户端。

`QWEN_AUDIO_AGENT_ACCESS_TOKEN` 仍然是这两个设置的已弃用别名。新配置使用
上述独立的主机和客户端名称，这样客户端凭证就不会被误认为是 Gateway
服务器配置。