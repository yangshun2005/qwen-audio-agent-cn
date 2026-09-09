# VoiceMem

qwen-audio-agent 提供了一个用于 [VoiceMem](https://github.com/xzf-thu/VoiceMem) 的 Node.js 连接器。此示例在核心框架之外安装 VoiceMem 及其 Python 伴生服务，然后配置 Gateway 使用它们。语音前端保持相同的 `memory` 工具和上下文语义，而 VoiceMem 负责存储、自动学习、整合和语义检索。

`PROMPT.md` 和 `ASSISTANT.md` 仍然是助手定义的一部分，不会被替换。

## 核心特性

- 替换两个逻辑记忆层：用户偏好和持久事实。
- 通过现有的 `memory` 工具保留显式的读取、追加、替换和删除操作。
- 观察已完成的语音会话，并在后台整合转录文本或原生音频。
- 增加语义回忆，同时将 VoiceMem 特有的代码保留在其提供者内部，而不是通用记忆运行时中。
- 将每个 Gateway 所有者隔离在单独哈希的 VoiceMem 空间中。
- 禁用内置的提取器和偏好学习器，防止重复学习。

## 架构

| 组件 | 职责 |
|---|---|
| qwen-audio-agent Gateway | 实时对话、记忆工具和提供者生命周期 |
| Node.js 连接器 | 框架拥有的 `MemoryProvider` 接口、有界同步快照、所有者隔离和进程监督 |
| 示例 Python 伴生服务 | 通往 VoiceMem 公共 Python API 的 JSONL 桥接 |
| VoiceMem | 提取、整合、结构化存储和语义检索 |
| 模型提供者 | VoiceMem 使用的聊天模型和嵌入模型 |

Gateway 连接器按需启动配置的外部 Python 伴生服务，并通过标准输入输出以换行符分隔的 JSON 进行通信。核心 npm 包中不包含任何 VoiceMem Python 代码或依赖。

`VOICEMEM_INPUT_MODE` 选择输入路径。`text`（默认）复用实时转录。`audio` 模式分割接受的 PCM16 语音轮次，并通过 `ingest(audio=...)` 调用 VoiceMem，启用其自身的 ASR、情感、环境感知和可选的声纹识别。
两种模式下，类型化消息均使用文本。

## 安装与运行

要求：仓库支持的 Node.js 版本和 Python 3.10 或更高版本。

```bash
npm ci
```

首先按照 VoiceMem 的[官方说明](https://github.com/xzf-thu/VoiceMem)安装 VoiceMem。如需使用经过测试的依赖版本进行隔离设置，请使用：

```bash
python3.12 -m venv examples/voicemem/.venv
examples/voicemem/.venv/bin/pip install \
  --index-url https://mirrors.aliyun.com/pypi/simple/ \
  -r examples/voicemem/sidecar/requirements.txt
cp examples/voicemem/.env.example \
  examples/voicemem/.env.local
```

在 `.env.local` 中设置 `DASHSCOPE_API_KEY`，然后运行：

```dotenv
QWEN_AUDIO_MEMORY_PROVIDER=voicemem
VOICEMEM_SIDECAR=/absolute/path/to/examples/voicemem/sidecar/server.py
VOICEMEM_INPUT_MODE=text
```

```bash
cd examples/voicemem
node --env-file=.env.local gateway.mjs
```

打开 `http://127.0.0.1:3101`。如果该端口已被占用，请使用 `PORT=3102`。示例启动器优先使用其 `.venv`，否则使用 `PATH` 中的 `python3`，并自动发现其伴生服务。要在常规 Gateway 中启用 VoiceMem，请将其绝对路径复制到 `config.env` 中，分别作为 `VOICEMEM_PYTHON` 和 `VOICEMEM_SIDECAR`。

要尝试原生音频记忆，请在 `.env.local` 中设置：

```dotenv
VOICEMEM_INPUT_MODE=audio
VOICE_ENABLE_VOICEPRINT=false
```

第一次调用会下载并加载 VoiceMem 的本地音频模型，速度会比后续调用慢得多。临时 WAV 文件在伴生服务处理后被删除。VoiceMem 默认不保留原始音频，但可以持久化派生的声纹数据；生产部署应根据隐私要求配置 `VOICE_SCENE` 和保留策略。声纹识别需要 VoiceMem 单独分发的说话人模型；当该模型不存在时，请保持禁用状态。

推荐的 Model Studio 配置使用 `qwen3.8-flash` 进行提取和整合，使用维度为 `1024` 的 `text-embedding-v4` 进行语义检索。有关所有环境变量覆盖，请参阅示例的[完整设置指南](https://github.com/QwenAudio/qwen-audio-agent/tree/main/examples/voicemem)。

## 尝试一下

1. 说：“我住在杭州，喜欢打羽毛球，希望你叫我船长。”
2. 关闭或刷新 WebUI，以便整合已完成的会话。
3. 开始新会话并问：“我住在哪里，喜欢什么，你应该怎么称呼我？”

显式更新会立即进入同步快照。会话观察在后台运行，不会阻塞前台语音对话。

## 存储

隔离示例将状态存储在 `.qwen-audio/runtime/memory/voicemem/` 下：

| 路径 | 内容 |
|---|---|
| `profiles/<owner-hash>.json` | 用于显式偏好和事实的有界同步快照 |
| `memory-spaces/<owner-hash>/` | VoiceMem SQLite 数据、元数据和本地 Qdrant 向量 |
| `observed-messages.json` | 有界指纹，防止重连后重复摄取 |
| `audio-staging/` | 原生音频模式使用的临时 WAV 文件，处理后删除 |

生产主机应将此目录放在持久化存储上，并定义自己的凭据、保留、删除和租户映射策略。

## 替换与扩展

要集成另一个记忆系统，请实现相同版本的 `MemoryProvider` 契约，并将其注入 `createGatewayApplication`。Gateway 和 Realtime 工具接口不需要任何特定于供应商的更改。有关完整契约，请参阅[长期记忆](../reference/memory.md)。

## 作者与致谢

- [谢志飞](https://github.com/xzf-thu) 创建并开源了 VoiceMem。
- [李旭](https://github.com/x-lixu) 设计了可替换的 `MemoryProvider` 边界，并实现了内置的 Node.js/Python 集成。