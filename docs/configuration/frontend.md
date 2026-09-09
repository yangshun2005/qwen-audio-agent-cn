# 前端配置

语音前端是网关所连接的实时语音模型。本页所有设置均位于用户配置文件中
（`~/.config/qwaudio/config.env`，参见 [配置](../configuration.md)）；
[为你的运行模式应用更改](../operations/gateway.md#applying-configuration-changes)：重启前台运行，对于已安装的服务使用 `gateway restart`，或在桌面端点击“应用”。

## 凭据与端点

默认提供商为 DashScope（`QWEN_AUDIO_REALTIME_PROVIDER=dashscope`）：

```dotenv
DASHSCOPE_API_KEY=your-key
```

| 设置 | 默认值 | 描述 |
| --- | --- | --- |
| `DASHSCOPE_API_KEY` | — | Model Studio API 密钥，由实时前端和其他网关功能共享 |
| `QWEN_AUDIO_REALTIME_API_KEY` | 空 | `DASHSCOPE_API_KEY` 的高优先级别名，仅用于实时前端 |
| `QWEN_AUDIO_REALTIME_BASE_URL` / `QWEN_AUDIO_REALTIME_URL` | 空 | 覆盖 DashScope Realtime 端点（私有部署或代理） |
| `DASHSCOPE_WORKSPACE_ID` | 空 | 切换到专用的 Model Studio 工作空间端点 |

其他前端包括 [语音到语音](../voice-frontends/speech-to-speech.md) 和
[ModelBest](../voice-frontends/minicpm-o.md)，其 MiniCPM-o 4.5 端点可以是本地或托管的。
自定义提供商实现提供商契约；参见 [自定义提供商](../voice-frontends/custom-provider.md)。

MiniCPM-o 的公共音频 Realtime 传输目前支持连续音频输入和文本/音频输出，但不支持会话项、结构化
Function Calling 或输入转写。因此，它是一个实时语音聊天前端，而非后端 Agent 编排的前端。

前端工具是单独配置的：Web 搜索（`QWEN_AUDIO_WEB_SEARCH_PROVIDER`，
参见 [配置](../configuration.md)），以及通过
[前端 MCP 客户端](../reference/frontend-mcp.md)、
[前端 OpenAPI 适配器](../reference/frontend-openapi.md) 或
[前端配置文件](../reference/frontend-profile.md) 配置的通用聊天机器人工具。

## 实时模型选择

一个网关拥有一个活动的实时模型。桌面设置页面可以为本地拥有的网关配置模型，
CLI 提供等效命令：

```bash
qwenaudio config show
qwenaudio config set --realtime-model qwen3.5-omni-flash-realtime
# 仅适用于已安装的用户后台服务：
qwenaudio gateway restart
```

支持的确切 ID 如下：

| 模型 | 模型输入 | 模型输出 | 实时传输 |
| --- | --- | --- | --- |
| `qwen3.5-omni-flash-realtime` | 文本、音频、图像/视频帧 | 文本、音频 | 文本、音频、实时 JPEG 帧 |
| `qwen3.5-omni-plus-realtime` | 文本、音频、图像/视频帧 | 文本、音频 | 文本、音频、实时 JPEG 帧 |
| `qwen-audio-3.0-realtime-plus`（默认） | 文本、音频 | 文本、音频 | 文本、音频 |
| `qwen-audio-3.0-realtime-flash` | 文本、音频 | 文本、音频 | 文本、音频 |

所有四个配置文件均支持 Function Calling。模型能力与传输方式保持独立：
Omni 接受 WebUI 通过能力协商的实时 JPEG 流，而普通上传的图片
继续通过附件路径处理。桌面端和 TUI 不捕获实时帧。客户端从网关健康状态
读取权威配置文件。不同客户端不能在一个网关上选择冲突的模型。连接到借用网关的桌面端，
或使用冲突配置模型的后续 CLI 运行时，会拒绝不匹配，而不是静默更改正在运行的服务。
要回滚，请设置上述旧版 ID 并重启网关。