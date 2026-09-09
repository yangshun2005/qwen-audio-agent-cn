# 快速开始

首先选择使用方式；桌面版无需先执行 CLI 安装流程。

| 我的需求 | 从这里开始 |
| --- | --- |
| 打开应用即可对话 | [桌面版](../desktop/overview.zh.md#首次使用)：下载安装、填写设置、开始对话。 |
| 通过终端或浏览器使用 | 按照下方命令行步骤启动 Gateway，然后连接 TUI 或 WebUI。 |
| 手机 / 其他电脑接入 | [远程连接与配对](../operations/remote-access.zh.md)：Gateway 在电脑或服务器上运行。 |
| 开发自己的客户端或适配器 | [开发者扩展总览](../extensions.zh.md)。 |

## 命令行快速开始

若尚未安装 CLI，请先参阅[安装](install.zh.md#一键安装)。

### 1. 创建配置

```bash
qwenaudio config
```

该命令会显示配置文件路径，并生成带有注释的 `config.env` 模板。

### 2. 填写配置

最小配置仅需 DashScope API Key：

```dotenv
DASHSCOPE_API_KEY=your-key
```

如需执行后台任务，请选择已安装并配置好的 Agent（以下以 Qwen Code 为例）；后台模型可留空：

```dotenv
DASHSCOPE_API_KEY=your-key
# 语音前台模型：flash 延迟更低更节省，plus（默认）质量更优
QWEN_AUDIO_REALTIME_MODEL=qwen-audio-3.0-realtime-plus
# 后台 Agent：留空或设为 none 时启动仅前台模式
AGENT_PROTOCOL=qwen
# 后台模型：显式设置时通过 ACP 标准覆盖；留空则沿用 Agent 配置
QWEN_AUDIO_AGENT_BACKEND_MODEL=
```

若没有现成的后台，可选择支持一键托管的 [OpenCode / OpenClaw](../configuration/backend.zh.md#模型选择)。

> 默认使用 DashScope 实时语音前台；也可切换为 [speech-to-speech 前台](../voice-frontends/speech-to-speech.zh.md)，选择全本地模型链路时无需云端 API Key。

### 3. 启动

在一个终端中启动 Gateway：

```bash
qwenaudio
```

另开一个终端，启动 TUI：

```bash
qwenaudio tui
```

也可以使用浏览器界面（默认 `http://127.0.0.1:3101`）：

```bash
qwenaudio webui
```

## 确认运行成功

开启麦克风权限后，说一句“你好”，确认能看到转写并听到回答。
若已配置后台，再尝试“查一下这台电脑的内存容量”，观察工作卡片与结果。
若无声音或显示连接错误，请按照[故障排查](../operations/troubleshooting.zh.md)进行检查。

测试不同客户端时，同一用户在同一个 Gateway 上仅有一个活动连接；新客户端可以在确认后接管，原客户端将断开。结束终端运行时按 `Ctrl-C`。

## 仅前台模式

不设置 `AGENT_PROTOCOL`（或设为 `none`）时，Gateway 不会启动后台 Agent；聊天及已启用的前台工具仍可使用。
需要后台执行的请求会返回明确说明，不会创建任务或猜测执行结果。也可以使用
`qwenaudio --backend none` 显式启动仅前台模式。

后台 Agent 的选择、一键安装、权限模式和常驻服务请参阅
[后台 Agent](../backends/overview.zh.md)，更多配置项请参阅
[配置说明](../configuration.zh.md)，TUI 平台差异请参阅
[TUI 注意](tui.zh.md)，浏览器客户端请参阅 [WebUI](webui.zh.md)。