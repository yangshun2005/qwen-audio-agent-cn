# 使用 MiniCPM-o 实时前端

qwen-audio-agent 通过 ModelBest 的公共 Realtime 协议连接
[MiniCPM-o 4.5](https://github.com/OpenBMB/MiniCPM-o-Demo)。
端点可以是用户管理的本地部署，也可以是兼容的托管服务；
Gateway 不安装模型，也不管理推理过程。

该集成针对官方音频全双工 WebSocket 协议：

```text
ws://127.0.0.1:8006/v1/realtime?mode=audio
```

服务就绪后，设置提供方和端点：

```bash
QWEN_AUDIO_REALTIME_PROVIDER=minicpm-o
MINICPM_O_REALTIME_URL=ws://127.0.0.1:8006/v1/realtime?mode=audio
```

默认假设上游 Gateway 是通过回环接口上的 `--http` 启动的。
对于 ModelBest 云或其他 TLS 部署，请改为设置对应的 `wss://` 端点。
当端点需要认证时，`MINICPM_O_AUTH_TOKEN` 会作为 Bearer 令牌发送。
相同的字段也可以在桌面设置的 **语音前端 → ModelBest** 中找到，
其中模型显示为固定的 `MiniCPM-o 4.5`。

适配器将客户端的 16 位 PCM 流转换为协议要求的 16 kHz 单声道 float32 输入，
将其 24 kHz 单声道 float32 输出转换回 16 位 PCM，
并将 MiniCPM-o 会话和响应事件映射到共享的实时运行时中。

## 实时视觉

使用 MiniCPM-o 的视频全双工端点来启用协商的 WebUI 视觉帧流：

```bash
MINICPM_O_REALTIME_URL=ws://127.0.0.1:8006/v1/realtime?mode=video
```

公共 GCP 形态保持为 `input_image_buffer.append`。MiniCPM-o 适配器
仅保留最新的 JPEG 帧，并将其作为 `video_frames` 添加到下一个一秒的音频
`input.append` 中。使用默认的 `mode=audio` URL 时，Gateway
不会协商 `input.image_buffer`，因此客户端无法意外呈现
不支持的摄像头控制。

MiniCPM-o 的公共 Realtime 协议目前未定义会话条目、结构化
函数调用事件、客户端触发的响应或输入转写事件。因此，此集成
专注于实时语音对话。使用此提供方时，文本输入、恢复的
转写历史、主动播报、记忆写入和后端 Agent 工具均不可用。
在客户端有内容可显示的情况下，UI 聊天历史仍会保留在本地。