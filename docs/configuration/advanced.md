# 高级设置

## 远程访问安全

连接方法、Tailnet、HTTPS 反向代理以及配对命令，请参阅
[远程连接](../operations/remote-access.md)。

## 网关操作

有关前台运行、持久化服务、桌面版内置网关以及重启等内容，
请参阅[运行网关](../operations/gateway.md)。

## 本地日志

qwen-audio-agent 使用统一的结构化日志，由各自的属主存储：

- CLI 托管的网关：`~/.config/qwaudio/state/logs/`。
- 桌面版托管的网关：`~/.config/qwaudio/state/desktop/logs/`。
- 桌面客户端：其[应用数据目录](../configuration.md#configuration-and-data-directories)下的 `logs/`。
- TUI：`~/.config/qwaudio/tui/logs/`。

以下文件职责说明并不意味着所有文件都位于同一目录：

```text
logs/                       # 根目录取决于运行模式
├── gateway.log   # 网关、Realtime、ACP 和任务生命周期
├── desktop.log   # 桌面主进程和嵌入式网关生命周期
├── cli.log       # CLI 命令生命周期
└── tui.log       # 直接启动 TUI 时的生命周期
```

日志采用 JSON Lines 格式，每行一个 JSON 对象，包含稳定的 `schema`、
`time`、`level`、`component`、`event` 和 `pid` 字段，并根据需要携带 `sessionId`、`turnId`、
`taskId`、`provider`、`backend`、`durationMs` 等关联信息。API
密钥、令牌、Authorization、cookies、密码和机密字段在写入前会进行脱敏处理；默认情况下，
麦克风音频、用户转写文本、模型回复文本、任务目标和任务结果不会被记录。

如需进行前台工具延迟分析，请通过 `sessionId` 和 `turnId` 关联
`realtime.provider.speech_stopped`、
`realtime.tool_call.received`、`realtime.tool_call.result_ready` 和
`realtime.playback.started` 事件；失败的调用使用
`realtime.tool_call.failed`。第一个事件是 Realtime 提供商的端点决策，
而非用户物理上的最后一个语音样本。测量更早的声学到端点间隔
需要客户端侧的捕获时间戳或受控的实时 PCM 重放。

桌面版可以在“设置 → 应用 → 日志”中打开日志目录。默认
日志级别为 `info`；单个文件达到 10 MiB 后轮转，共保留 5 个
文件。这些可以通过以下环境变量进行调整：

| 设置 | 默认值 | 描述 |
| --- | --- | --- |
| `QWEN_AUDIO_LOG_LEVEL` | `info` | `trace`、`debug`、`info`、`warn`、`error`、`fatal` 或 `silent` |
| `QWEN_AUDIO_LOG_DIR` | 实例状态目录下的 `logs` | 自定义日志目录 |
| `QWEN_AUDIO_LOG_MAX_BYTES` | `10485760` | 单个日志文件的轮转阈值 |
| `QWEN_AUDIO_LOG_MAX_FILES` | `5` | 保留的当前和已轮转文件总数 |
| `QWEN_AUDIO_LOG_FILE` | `1` | 设置为 `0` 以禁用文件日志记录 |
| `QWEN_AUDIO_LOG_CONSOLE` | `1` | 设置为 `0` 以禁用终端日志输出 |

日志仅存储在本地，不会自动上传。在报告问题之前，请检查
并根据需要分享相关片段；尽管系统会自动脱敏，但您仍应在发送前
再次确认日志中不包含您不希望公开的本地路径或业务信息。

### 只读诊断

对于常见的连接、音频和工具问题，请从[故障排查](../operations/troubleshooting.md)开始。

```bash
qwenaudio doctor
qwenaudio doctor --json
qwenaudio doctor --turn <turnId>
```

在不启动模型、后端 Agent 或麦克风、不更改配置或修复文件的情况下，
检查配置、网关、语音前端和 MCP 连接、后端就绪状态以及会话文件。
填充的配置并不能证明密钥仍有剩余配额；在没有活动语音会话的情况下，
报告会明确指出连接未经验证。使用 `--url https://<gateway>` 进行
远程检查，并使用 `QWEN_AUDIO_GATEWAY_CLIENT_TOKEN` 提供凭据。本地文件不用于推断
远程配置。

`--turn` 从与 `turnId` 匹配的现有日志记录中汇编时间线，仅显示标识符和
时间信息，不包含对话文本、工具参数或结果。它从最近的 5 个
网关日志中各读取最多 2 MiB，并返回最多 500 个事件。日志轮转、缺少埋点或
这些限制可能导致时间线不完整。请在网关主机上运行它以检查远程时间线。

会话文件与轮转日志是分开的：它们保留可恢复的历史记录，不会被
日志轮转删除。诊断最多检查 1,000 个会话文件和总计 64 MiB 的数据，
跳过超过 8 MiB 的文件，并标记未检查的数据。异常退出留下的部分最终记录
会被报告为可恢复，并在下次以写入方式打开该会话时进行修复。损坏的已提交记录
永远不会被静默删除。

TUI、WebUI 和桌面版仅连接到网关，不直接连接、
启动或停止任何后端 Agent。桌面设置中的核心配置保存到
用户配置文件中，并在下次网关启动时生效；网关地址会
被验证并立即切换。

OpenCode 和 OpenClaw 使用一致的用户环境优先级顺序：

1. 由 `OPENCODE_BIN` / `OPENCLAW_BIN` 明确指定的可执行文件。
2. 由 `OPENCODE_SOURCE_DIR` / `OPENCLAW_SOURCE_DIR` 明确指定的源码目录。
3. 用户已在 PATH 中安装的 `opencode` / `openclaw`。
4. 当未找到兼容安装时，通过 `npx` 自动使用固定 npm 包中当前已验证的版本。

源码目录仅在用户明确配置时使用，不会推断
相邻的项目目录。要强制使用特定的启动方式，请配置：

```dotenv
# auto（默认）、binary、source、installed 或 package
OPENCODE_RUNTIME=auto
OPENCLAW_RUNTIME=auto
```

要临时验证其他固定包版本或内部镜像，您可以显式
覆盖完整的包说明符：

```dotenv
OPENCODE_PACKAGE=opencode-ai@1.18.5
OPENCLAW_PACKAGE=openclaw@2026.6.33
```

OpenCode ACP 集成目前需要 OpenCode `1.18.0` 或更高版本。在 `auto` 模式下，
当发现旧版本时，会使用固定的兼容包，而不会修改用户的
安装；当显式设置 `installed` 时，会直接报错。
最小版本可以通过 `OPENCODE_MIN_VERSION` 覆盖，用于验证其他
兼容版本。

由 qwen-audio-agent 启动的 OpenCode 默认继承用户原始的全局
配置（通常为 `~/.config/opencode/opencode.json`），因此已安装的 MCP、Skills、
权限、模型和插件可以继续使用。协调规则和
可用的 Session 工具通过网关的后端集成提供，
无需额外安装或覆盖 OpenCode Agent。

如果用户的配置或第三方插件与 qwen-audio-agent 冲突，您可以
临时启用隔离模式进行故障排查：

```dotenv
QWEN_AUDIO_AGENT_OPENCODE_ISOLATE_USER_CONFIG=true
```

您还可以通过
`QWEN_AUDIO_AGENT_OPENCODE_XDG_CONFIG_HOME` 指定不同的 OpenCode 用户配置目录。
隔离后，原始全局配置中的 MCP 和插件将不再自动加载。

## 高级设置

以下设置均具有稳定的默认值；普通用户无需将其
写入配置文件：

| 设置 | 默认值 |
| --- | --- |
| `HOST` / `PORT` | `127.0.0.1` / `3101` |
| `QWEN_AUDIO_AGENT_ALLOWED_ORIGINS` | 空；仅允许回环地址 |
| `QWEN_AUDIO_GATEWAY_LAN` | 空；设置为 `1` 以在局域网（`0.0.0.0`）上监听 |
| `QWEN_AUDIO_GATEWAY_LAN_HOST` | 自动选择的物理 IPv4；可选的显式局域网端点主机 |
| `QWEN_AUDIO_GATEWAY_TAILNET` | 空；设置为 `1` 以使用系统 Tailscale Serve |
| `QWEN_AUDIO_TAILSCALE_BINARY` | 自动检测；可选的系统 Tailscale CLI 绝对路径 |
| `OPENCODE_WORKSPACE` | 共享数据目录下的 `workspace` |
| `QODER_WORKSPACE` | 共享数据目录下的 `workspace` |
| `QWEN_AUDIO_AGENT_BACKEND_MODEL` | 空；显式值仅通过标准 ACP 覆盖 Sessions，托管式 OpenCode/OpenClaw 配置除外 |
| `QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE` | `native` |
| `QWEN_AUDIO_AGENT_ACP_FORWARD_ENV` | 空；仅适用于通用 ACP 的逗号分隔可选环境变量名称 |
| `QWEN_AUDIO_REALTIME_MODEL` | `qwen-audio-3.0-realtime-plus` |
| `QWEN_AUDIO_REALTIME_PROVIDER` | `dashscope` |
| `QWEN_AUDIO_WEB_SEARCH_PROVIDER` | `so360`；可选 `bailian`、`bing`、`mcp` 或 `none` |
| `QWEN_AUDIO_WEB_SEARCH_MCP_URL` | 空；`mcp` 提供商使用的自定义 Streamable HTTP 端点 |
| `QWEN_AUDIO_WEB_SEARCH_MCP_TOKEN` | 显式 `bailian` 时为 `DASHSCOPE_API_KEY`；自定义端点除非设置否则为空 |
| `QWEN_AUDIO_WEB_SEARCH_MCP_TOOL` | `bailian` 时为 `bailian_web_search`；否则为 `web_search` |
| `QWEN_AUDIO_SCHEDULE_TOOL_ENABLED` | `true`；设置为 `false` 以隐藏 `schedule_reminder` |
| `QWEN_AUDIO_WEB_TOOLS_ENABLED` | `true`；设置为 `false` 以对前端 Agent 隐藏 `web_search` 和 `fetch_url` |
| `QWEN_AUDIO_KNOWLEDGE_TOOL_ENABLED` | `true`；设置为 `false` 以隐藏 `knowledge` |
| `QWEN_AUDIO_NOTES_TOOL_ENABLED` | `true`；设置为 `false` 以隐藏 `notes` |
| `QWEN_AUDIO_RECALL_TOOL_ENABLED` | `true`；设置为 `false` 以隐藏 `recall` |
| `QWEN_AUDIO_FRONTEND_PROFILE` | 空；轻量级前端 Profile JSON 文件的路径 |
| `QWEN_AUDIO_FRONTEND_MCP_CONFIG` | 空；带版本号的前端 MCP JSON 文件的绝对路径 |
| `QWEN_AUDIO_FRONTEND_OPENAPI_CONFIG` | 空；带版本号的前端 OpenAPI JSON 配置文件的绝对路径 |
| `QWEN_AUDIO_REALTIME_VOICE` | 空；可选的 Audio 系列覆盖，否则运行时使用 `longanqian` |
| `QWEN_OMNI_REALTIME_VOICE` | 空；可选的 Omni 系列覆盖，否则运行时使用 `Ethan` |
| `SPEECH_TO_SPEECH_REALTIME_URL` | `ws://127.0.0.1:8765/v1/realtime` |
| `SPEECH_TO_SPEECH_AUTH_TOKEN` | 空；仅用于带 Bearer 认证的代理 |
| `MINICPM_O_REALTIME_URL` | `ws://127.0.0.1:8006/v1/realtime?mode=audio` |
| `MINICPM_O_AUTH_TOKEN` | 空；仅用于带 Bearer 认证的代理 |
| `QWEN_AUDIO_AGENT_IDENTITY_MODE` | `personal` |
| `QWEN_AUDIO_AGENT_TUI_AUDIO_MODE` | `half` |
| `AGENT_TIMEOUT_MS` | `300000`；ACP 连接初始化和有界控制请求的超时时间，不适用于活动 Agent 轮次 |

macOS TUI CoreAudio 辅助程序默认编译到
`~/Library/Caches/qwaudio/tui/macos-voice-io`，无需额外配置。它
在播放期间持续录制音频，仅支持语音打断。
Linux 和 Windows 最小化 TUI 使用内置的 Python 音频桥接，采用
`sounddevice`/PortAudio 半双工模式；在回复播放期间麦克风暂停，仅
支持使用 `/interrupt` 手动打断，并在播放结束或手动
打断后恢复。

在 Linux 和 Windows 上，您可以通过
`qwenaudio tui --audio-mode full` 或设置 `QWEN_AUDIO_AGENT_TUI_AUDIO_MODE=full` 显式启用 PortAudio 全双工模式。此
模式没有回声消除，仅支持直接语音打断；建议佩戴
耳机以避免扬声器回声触发误识别或误打断。
macOS 始终使用 CoreAudio AEC 全双工模式，不受此选项影响。

如果 PortAudio 全双工模式持续报告输入溢出、输出欠载或设备
错误，请退出 TUI 并切换到 `qwenaudio tui --audio-mode half`。不同的
Linux/Windows 声卡和蓝牙耳机对同时输入和输出流在不同采样率下的
支持程度各不相同；半双工是兼容性回退方案。

任务状态、通知重试、内存容量和保留时间等运行时参数
也使用内置默认值。仅在明确执行容量规划或故障诊断时，
才建议覆盖这些默认值。