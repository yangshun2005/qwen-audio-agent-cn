# Qwen Audio 3.0 Realtime

默认语音前端：DashScope 的 Qwen Audio 3.0 Realtime 系列，专为语音到语音对话而构建。当您安装 qwen-audio-agent 并仅设置 API 密钥时，即可获得此功能。

## 模型

| 模型 | 说明 |
| --- | --- |
| `qwen-audio-3.0-realtime-plus` | **默认。** 更高质量 |
| `qwen-audio-3.0-realtime-flash` | 更低延迟，更低成本 |

两者均接受文本和音频输入，生成文本和音频输出，并支持函数调用（这是网关前端工具——任务委派、记忆、提醒——与模型交互的方式）。

## 设置

```dotenv
DASHSCOPE_API_KEY=your-key
QWEN_AUDIO_REALTIME_MODEL=qwen-audio-3.0-realtime-plus
```

当实时前端需要自己的凭据时，`DASHSCOPE_API_KEY` 可以被更高优先级的别名 `QWEN_AUDIO_REALTIME_API_KEY` 替换。

一个网关拥有一个活动模型。通过桌面设置页面或 CLI 切换模型，然后重启网关：

```bash
qwenaudio config set --realtime-model qwen-audio-3.0-realtime-flash
# 仅适用于已安装的用户后台服务：
qwenaudio gateway restart
```

WebUI 和 TUI 仅显示活动模型；它们从不覆盖它。

## 语音与轮次检测

- 默认语音：`longanqian` — 使用 `QWEN_AUDIO_REALTIME_VOICE` 覆盖。
- GCP 客户端可以在其初始 `session.hello` 的 `connection.output_voice` 中提供会话级语音。它优先于环境默认值。在运行时，调用 `GatewayClient.updateOutputVoice(voice)`；网关在保留客户端连接和网关会话的同时重建上游 Realtime Session。
- 轮次检测：`smart_turn`（语义性结束轮次），由运行时配置；不提供手动 VAD 调优。

## 端点覆盖

适用于私有部署或代理：

| 设置 | 效果 |
| --- | --- |
| `QWEN_AUDIO_REALTIME_BASE_URL` / `QWEN_AUDIO_REALTIME_URL` | 替换 DashScope Realtime 端点 |
| `DASHSCOPE_WORKSPACE_ID` | 切换到百炼专用工作区端点（`wss://<workspace-id>.cn-beijing.maas.aliyuncs.com/...`） |

传输层通过单个 WebSocket 运行 16 kHz PCM 输入和 24 kHz PCM 输出。

## 能力边界

| | 模型 | 当前客户端传输 |
| --- | --- | --- |
| 输入 | 文本、音频 | 文本、音频 |
| 输出 | 文本、音频 | 文本、音频 |

模型能力和已实现的传输层被有意分开跟踪；该系列没有图像模态的缺口。有关模型级别的图像输入，请参阅 [Qwen Omni Realtime](qwen-omni-realtime.md)。

## 继续阅读

- [语音到语音](speech-to-speech.md) — 完全本地前端，无需云密钥
- [MiniCPM-o 4.5](minicpm-o.md) — 本地端到端实时语音
- [自定义提供商](custom-provider.md) — 接入其他实时服务
- [前端配置参考](../configuration/frontend.md)