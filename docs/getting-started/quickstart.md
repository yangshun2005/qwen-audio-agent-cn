# 快速入门

选择您希望使用助手的方式。桌面版不需要执行 CLI 安装步骤。

| 我想…… | 从这里开始 |
| --- | --- |
| 打开应用并进行对话 | [桌面版](../desktop/overview.md#首次运行)：安装、配置并开始对话。 |
| 使用终端或浏览器 | 按照下面的命令行步骤操作，然后连接 TUI 或 WebUI。 |
| 从手机或其他电脑连接 | [远程连接](../operations/remote-access.md)：Gateway 运行在电脑或服务器上。 |
| 构建客户端或适配器 | [开发者扩展概述](../extensions.md)。 |

## 命令行快速入门

如果尚未安装 CLI，请从[安装](install.md#一行安装)开始。

### 1. 创建配置

```bash
qwenaudio config
```

该命令将显示配置文件路径，并创建一个带注释的 `config.env` 模板。

### 2. 填写配置

最小配置仅需一个 DashScope API Key：

```dotenv
DASHSCOPE_API_KEY=your-key
```

如需后端工作，请选择您已安装并配置好的 Agent（下方为 Qwen Code）。后端模型为可选：

```dotenv
DASHSCOPE_API_KEY=your-key
# 语音前端模型：flash 可降低延迟和成本，plus（默认）可获得更佳质量
QWEN_AUDIO_REALTIME_MODEL=qwen-audio-3.0-realtime-plus
# 后端 Agent：留空或设置为 none 以仅启动前端模式
AGENT_PROTOCOL=qwen
# 后端模型：显式值使用标准 ACP；留空则复用 Agent 配置
QWEN_AUDIO_AGENT_BACKEND_MODEL=
```

如果没有现成的后端，请参阅 [OpenCode / OpenClaw 托管设置](../configuration/backend.md#模型选择)。

> 默认使用 DashScope 实时语音前端；您也可以切换到[语音到语音](../voice-frontends/speech-to-speech.md)。全本地模型流水线不需要云 API Key。

### 3. 启动

在一个终端中启动 Gateway：

```bash
qwenaudio
```

打开另一个终端并启动 TUI：

```bash
qwenaudio tui
```

您也可以使用浏览器界面（默认 `http://127.0.0.1:3101`）：

```bash
qwenaudio webui
```

## 验证设置

允许麦克风访问并说“你好”。确认出现转录文本并且您能听到回复。
如果已配置后端，请尝试“检查这台电脑的内存容量”并关注其工作卡片
和结果。如果没有音频或出现连接错误，请参阅[故障排除](../operations/troubleshooting.md)。

一个用户在一个 Gateway 上只能有一个活动客户端。另一个客户端可以在
确认后接管，断开前一个客户端。按 `Ctrl-C` 可结束前台终端运行。

## 仅前端模式

当 `AGENT_PROTOCOL` 未设置（或设置为 `none`）时，Gateway 不会启动后端 Agent；聊天和已启用的前端工具仍然可用。
需要后端执行的请求将返回明确的说明，不会创建任务或猜测执行结果。您也可以
使用 `qwenaudio --backend none` 显式启动仅前端模式。

有关后端 Agent 的选择、一键安装、权限模式和持久服务，请参阅
[后端 Agent](../backends/overview.md)。更多配置选项，请参阅
[配置](../configuration.md)。有关 TUI 平台差异，请参阅
[TUI 说明](tui.md)；有关浏览器客户端，请参阅 [WebUI](webui.md)。