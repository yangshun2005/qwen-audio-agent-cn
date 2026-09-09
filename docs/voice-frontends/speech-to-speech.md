# 使用 Hugging Face 语音到语音前端

qwen-audio-agent 也可以连接自托管的
[Hugging Face 语音到语音](https://github.com/huggingface/speech-to-speech)。
它将 VAD、STT、LLM 和 TTS 整合为一个兼容 OpenAI Realtime 的服务。整个
语音流水线可以完全在本地运行，或者您可以根据需要替换个别模型或服务。
Gateway 仅连接到 Realtime 接口，不会修改语音到语音的
STT、LLM、TTS 或语音配置。

## 安装语音到语音

```bash
pip install "speech-to-speech[paraformer]"
```

以下中文配置依赖于 v0.2.12 之后合并的 CJK 标点符号和 Qwen3-TTS 长语句预算
修复。在包含这些修复的版本发布之前，请直接安装已合并的
修订版本：

```bash
pip install "speech-to-speech[paraformer] @ git+https://github.com/huggingface/speech-to-speech.git@f75d6b435d89b8dff911f639672c172166595409"
```

## 启动服务

Linux / Windows（NVIDIA GPU）：

```bash
speech-to-speech \
  --stt paraformer \
  --llm_backend transformers \
  --device cuda
```

对于经过测试的中文 Qwen3-TTS 配置，请使用显式的模型、语言、说话人和交付
设置，同时保持后端采样默认值：

```bash
speech-to-speech \
  --stt paraformer \
  --llm_backend transformers \
  --model_name Qwen/Qwen3-4B-Instruct-2507 \
  --tts qwen3 \
  --qwen3_tts_backend torch \
  --qwen3_tts_model_name Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice \
  --qwen3_tts_speaker Vivian \
  --qwen3_tts_language chinese \
  --qwen3_tts_instruct "请用平稳、自然、克制的语气说话，保持均匀语速，避免夸张的音高变化，句末自然收束。" \
  --device cuda
```

已合并的语音到语音修复会保留中文标点符号，并自动调整 Qwen3-TTS 编解码器
令牌预算以适配 CJK 文本。无需覆盖采样设置或设置更大的固定令牌限制。

Apple Silicon：

```bash
speech-to-speech \
  --stt paraformer \
  --llm_backend mlx-lm \
  --device mps
```

服务默认运行在 `ws://127.0.0.1:8765/v1/realtime`。如果没有 NVIDIA GPU，
您也可以选择较小的、对 CPU 友好的本地模型；LLM 可以指向本地
运行的 vLLM / llama.cpp，或通过兼容 OpenAI 的端点指向云端模型（如百炼）。
有关具体参数，请参阅官方语音到语音文档。

## 连接 qwen-audio-agent

在 `config.env` 中设置以下内容：

```dotenv
QWEN_AUDIO_REALTIME_PROVIDER=speech-to-speech
SPEECH_TO_SPEECH_REALTIME_URL=ws://127.0.0.1:8765/v1/realtime
```

在完全本地模式下，无需云端 API 密钥。如果 Realtime 接口位于需要 Bearer 认证的
代理之后，您可以设置：

```dotenv
SPEECH_TO_SPEECH_AUTH_TOKEN=your-token
```

`SPEECH_TO_SPEECH_AUTH_TOKEN` 仅用于代理认证，不是
本地服务的访问密码。