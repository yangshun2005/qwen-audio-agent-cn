# Qwen Omni Realtime

多模态语音前端：DashScope 的 Qwen3.5 Omni Realtime 系列。
与 Audio 系列相同的全双工对话，但模型在模型层面理解图像。

## 模型

| 模型 | 说明 |
| --- | --- |
| `qwen3.5-omni-flash-realtime` | 更低延迟 |
| `qwen3.5-omni-plus-realtime` | 更高质量 |

两者均支持函数调用，因此 Gateway 的前端工具（任务委派、记忆、提醒）无需更改即可正常工作。

## 设置

```dotenv
DASHSCOPE_API_KEY=your-key
QWEN_AUDIO_REALTIME_MODEL=qwen3.5-omni-flash-realtime
```

与 [Qwen Audio 3.0 Realtime](qwen-audio-realtime.md) 使用相同的凭据和端点设置——一个 Gateway 仅拥有一个活动模型，无论属于哪个系列；可通过桌面设置或 `qwenaudio config set --realtime-model <id>` 切换，然后重启 Gateway。

## 语音与轮次检测

- 默认语音：`Ethan`——可通过 `QWEN_OMNI_REALTIME_VOICE` 覆盖。
- 轮次检测：`semantic_vad`，由运行时配置。

## 实时视觉

WebUI 可以将摄像头采样为有界 JPEG 帧，并通过协商的 GCP `input.image_buffer` 能力发送。Gateway 每秒最多接受一帧，提供商适配器在音频建立实时时间线后，通过 Qwen Omni 的 `input_image_buffer.append` 发送该帧。图像和音频缓冲区由提供商的正常轮次检测一起提交。

此路径是实时视觉上下文，而非轮次附件：它不会创建用户消息、触发响应、进入历史记录，或成为后端 Agent 附件。普通上传的图片仍使用 `conversation.item.create` 以及现有的附件/委派路径。桌面端和 TUI 在此版本中不捕获实时视觉帧。

## 我应该选择哪个系列？

- **Audio**（`qwen-audio-3.0-realtime-*`）——默认选项；以语音优先的对话，无需其他配置。
- **Omni**（`qwen3.5-omni-*-realtime`）——当你希望前端将实时视觉帧与语音结合时选择。

## 继续阅读

- [Qwen Audio 3.0 Realtime](qwen-audio-realtime.md) — 默认系列
- [前端配置参考](../configuration/frontend.md)