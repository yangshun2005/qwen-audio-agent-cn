# TUI 使用注意

## 平台差异

| 平台 | 默认模式 | 打断方式 |
| --- | --- | --- |
| macOS | 带回声消除的全双工 | 直接说话 |
| Linux / Windows | 半双工 | 输入 `/interrupt` |

## 终端布局

TUI 使用全屏双区布局：上方显示可滚动的对话、语音转写、任务状态与连接日志，
下方固定显示 Gateway / 麦克风状态和文本输入栏。异步消息和断线重连不会打断
正在编辑的文本。使用 `PageUp` / `PageDown` 浏览对话记录，按 `Ctrl-C` 可随时退出。

## 文本与附件输入

TUI 在语音之外也支持文本、图片和普通文件：

- 直接在底部输入栏输入文字并按回车发送。
- 直接粘贴本地文件路径，TUI 会立即将图片显示为 `[Image N]`，将普通文件显示为
  `@完整路径`，并暂存为下一轮附件。
- 文字中的 `@文件路径` 会作为附件随本轮请求发送。
- 输入 `/mute` 可静音或恢复麦克风，输入 `/help` 可查看全部命令。

暂存附件既可以随底部输入栏的文本发送，也可以随下一轮语音输入发送；删除输入栏
中的附件锚点会同步取消该附件。

附件内容由 TUI 读取后发送给 Gateway。实时语音前台只接收附件摘要；当前台通过
`spawn_thinking` 委托任务时，Gateway 会把原始附件转换为 ACP ContentBlock，交给
后台 Agent。`[Image 1]` 或 `@文件路径` 会作为文本引用与附件 part 一起保留，便于
多附件指代、历史重放和后台解析。单个附件上限为 8 MB，单轮附件总量上限为 12 MB。
Gateway 会为附件分配会话内稳定的输入 ID；因此先发送图片、下一轮再用文字或语音
提出处理要求时，前台可以引用该 ID 委托后台，无需把文件内容重复注入实时语音模型。

## macOS

macOS 始终使用 CoreAudio AEC 全双工：播报期间持续收音，支持直接说话打断，
无需额外配置。CoreAudio 辅助程序默认编译到
`~/Library/Caches/qwaudio/tui/macos-voice-io`，首次启动时自动构建。

## Linux / Windows

默认通过随包提供的 Python 音频桥接使用 `sounddevice` / PortAudio 半双工：
播放回复时麦克风会暂停，可输入 `/interrupt` 手动打断，播放结束或打断后恢复。
首次使用前需安装 `sounddevice` 和系统 PortAudio。

也可以开启无回声消除的全双工模式：

```bash
qwenaudio tui --audio-mode full
```

此模式没有回声消除，请佩戴耳机，避免扬声器声音造成误识别或误打断。
不同声卡和蓝牙耳机对同时使用不同采样率的输入、输出流支持程度不同；如果持续
报告输入溢出、输出欠载或设备错误，请退出并改用 `--audio-mode half` 兜底。

## 配置

默认音频模式也可通过环境变量持久设置：

```dotenv
QWEN_AUDIO_AGENT_TUI_AUDIO_MODE=half
```

设为 `full` 等效于 `--audio-mode full`。完整参数见
[配置说明](../configuration.zh.md)。