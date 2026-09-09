# 后端特定设置

找到你使用的后端即可；你不需要配置每一个集成。有关安装、标准模型覆盖和权限，请参阅[常见后端设置](../configuration/backend.md)，或参阅[支持的后端](overview.md)获取概述。

## OpenClaw

默认的 OpenClaw 地址是 `http://127.0.0.1:18789`。当显式设置 `OPENCLAW_BASE_URL` 时，qwen-audio-agent 会将该 Gateway 作为外部黑盒进行连接。它不会启动另一个 OpenClaw Gateway，也不会读取、复制或修改该 Gateway 的模型凭据：

```dotenv
AGENT_PROTOCOL=openclaw
OPENCLAW_BASE_URL=http://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=
```

对于远程部署，请使用 `https://` 或 `wss://` 地址。跨机器时优先使用 `wss://`，切勿将令牌嵌入 URL 中：

```dotenv
AGENT_PROTOCOL=openclaw
OPENCLAW_BASE_URL=wss://openclaw.example.com
OPENCLAW_GATEWAY_TOKEN=replace-with-your-token
```

外部模式仍然会在 qwen-audio-agent 主机上启动轻量级的官方 `openclaw acp` 桥接器，并通过 stdio 与其进行 ACP 通信。然后该桥接器连接到用户管理的远程 Gateway。qwen-audio-agent 永远不会启动、停止、重新配置或移动该远程 Gateway。官方桥接器会报告真实的网络、TLS 和认证错误，而不是使用 300 毫秒的本地启动探测。如果本地安全软件终止了桥接器，则该轮对话会显式失败，而远程 Gateway 不受影响。

如果本地安全策略仅阻止 qwen-audio-agent 的 OpenClaw 启动器，可以指向一个受信任的 OpenClaw 可执行文件，Gateway 将直接运行轻量级桥接器：

```dotenv
OPENCLAW_ACP_BIN=/absolute/path/to/openclaw
```

这不会改变远程 Gateway 的所有权。本地进程仍然是一个 ACP 桥接器，并会随 qwen-audio-agent Gateway 一起停止。

当未设置 `OPENCLAW_BASE_URL` 时，它会优先启动用户环境中的 `openclaw`。当同时提供 `DASHSCOPE_API_KEY` 和 `QWEN_AUDIO_AGENT_BACKEND_MODEL` 时，会为 qwen-audio-agent 进程生成一个独立的百炼配置和状态目录，而不会修改用户的原生配置。当未指定后端模型时，它会继承用户的原生配置、模型和认证，但不会在独立实例中启用钉钉等外部消息通道。在托管模式下，如果原始配置已启用 Gateway Token，则会自动读取并使用该 Token 进行本地 ACP 连接；也可以通过 `OPENCLAW_GATEWAY_TOKEN` 进行覆盖，或设置 `OPENCLAW_CONFIG_PATH` 来显式指定不同的 OpenClaw 配置。当连接到外部 Gateway 时，还需设置 `OPENCLAW_GATEWAY_TOKEN`（或 `OPENCLAW_GATEWAY_TOKEN_FILE`）。

该模型值仅用于在启动前配置本地托管实例。对于外部 OpenClaw Gateway，Session 模型覆盖要求其 ACP 桥接器公布标准的 `configOptions`；Gateway 不再调用私有的 OpenClaw `sessions.patch` RPC。

## OpenCode

Gateway 通过 `opencode acp` 与其交互，并管理用于打开原生 Session 界面的本地服务。当没有兼容的安装时，它会自动使用固定的 npm 包；用户无需单独安装或启动该服务。`OPENCODE_BASE_URL` 指定该本地 Session UI 服务；它不是一个 qwen-audio-agent 可以连接的远程 ACP 执行端点：

```dotenv
AGENT_PROTOCOL=opencode
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

## Qoder

Qoder 使用本地 `qodercli --acp`，没有 HTTP 后端地址：

```dotenv
AGENT_PROTOCOL=qoder
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

统一的 ACP 适配器为每个用户维护一个固定的原生协调 Session，并通过 ACP 的 Session 列表/恢复/新建能力和动态 MCP 工具提供列出、创建、继续、查询和取消项目 Session 的能力。当继续现有项目时，它会使用目标 Session 的原始 `session_id` 和工作目录执行 `session/resume`；交互会追加到原生 CLI Session 历史中。

认证复用 `qodercli` 当前的登录状态或其支持的环境变量。高级配置：

```dotenv
QODERCLI_PATH=
QODER_CONFIG_DIR=
```

Gateway 管理 Qoder ACP 子进程；Qoder 不接受 `--backend-url`。

## Qwen Code

Qwen Code 通过其原生 stdio ACP 入口点 `qwen --acp` 连接。Gateway 仅启动此本地 ACP 进程，并保留 Qwen Code 自身的认证、提供商、模型、MCP、Skill 和 Session 配置。

```dotenv
AGENT_PROTOCOL=qwen
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

交互式运行 `qwen` 并使用 `/auth` 进行首次认证。已移除的 `qwen auth` 命令不再使用。可选覆盖项：

```dotenv
QWEN_CODE_BIN=
QWEN_CODE_WORKSPACE=
```

当前集成有意仅支持本地 ACP 进程；Qwen Code 的实验性网络服务不被视为远程后端。

## MiniMax Code

MiniMax Code（[官方 CLI 文档](https://agent.minimax.io/docs/cli/features)）通过官方 `mcode acp` ACP v1/stdio 入口点连接。Gateway 仅启动此本地 ACP 进程；MiniMax Code 拥有其认证、提供商、模型、Session 和 Skill/插件配置。当前集成要求 MiniMax Code `0.3.7` 或更高版本。

使用统一命令安装官方 CLI：

```bash
qwenaudio install minimax
```

首次认证：

```bash
mcode login
```

对于 Global 账户，请使用 `mcode login --region global`；使用 `mcode provider` 配置自定义提供商或 API 密钥。配置好 MiniMax Code 本身后，将其选为后端：

```dotenv
AGENT_PROTOCOL=minimax
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

高级选项：

```dotenv
MINIMAX_CODE_BIN=
MINIMAX_CODE_WORKSPACE=
```

避免为 MiniMax Code 设置 `QWEN_AUDIO_AGENT_BACKEND_MODEL`。如果显式设置了该值，Gateway 仅在 MiniMax 公布兼容的标准 ACP `configOptions` 条目时尝试覆盖；否则会显式失败。MiniMax Code 的公开文档未声明兼容 skills.sh 的用户目录，因此 `qwenaudio skill` 不会将 skills 复制到其私有 Skill/插件存储中；请使用 MiniMax Code 自身的管理流程。

## Kimi Code

Kimi Code（[MoonshotAI/kimi-code](https://github.com/MoonshotAI/kimi-code)）通过官方原生 ACP 入口点 `kimi acp` 连接。当前集成验证并要求 Kimi Code `0.31.0` 或更高版本；`qwenaudio setup --backend kimi` 会同时检查可执行文件和版本，并拒绝低于兼容基线的旧版本实现。

你可以使用官方安装脚本安装已验证的版本：

```bash
curl -fsSL https://code.kimi.com/kimi-code/install.sh | \
  KIMI_VERSION=0.31.0 KIMI_INSTALL_DIR="$HOME/.local" \
  KIMI_NO_MODIFY_PATH=1 bash
```

当你已经通过 Kimi Code 本身完成登录时，只需选择后端：

```dotenv
AGENT_PROTOCOL=kimi
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

你也可以使用 Kimi Code 官方的临时模型环境变量来提供 Kimi Code API 密钥，而无需修改 `~/.kimi-code/config.toml`：

```dotenv
AGENT_PROTOCOL=kimi
KIMI_MODEL_NAME=kimi-for-coding
KIMI_MODEL_API_KEY=your-kimi-code-key
KIMI_MODEL_BASE_URL=https://api.kimi.com/coding/v1
```

`config.env` 由 qwen-audio-agent 创建为 `0600` 文件，仅当前用户可读写；禁止将实际 API 密钥写入仓库。Kimi Code 的原生配置、OAuth 凭据和 Session 存储默认仍由 Kimi 管理；qwen-audio-agent 不会修改这些文件。设置 `KIMI_CODE_HOME` 可以显式选择不同的 Kimi 数据目录，设置 `KIMI_WORKSPACE` 可以覆盖协调工作区。

当显式设置 `QWEN_AUDIO_AGENT_BACKEND_MODEL` 时，Gateway 通过 ACP `session/set_config_option` 覆盖 Kimi Session 模型并确认其生效；如果留空，Kimi 会选择自己的默认模型。高级配置：

```dotenv
KIMI_CODE_BIN=
KIMI_WORKSPACE=
KIMI_CODE_HOME=
```

其他支持 ACP stdio 的 Agent 可以使用通用入口点：

```dotenv
AGENT_PROTOCOL=acp
ACP_COMMAND=your-agent
ACP_ARGS=["--acp"]
ACP_LABEL=Your Agent
ACP_WORKSPACE=
```

通用入口点由 Gateway 直接管理 ACP 子进程。建议将 `ACP_ARGS` 写为 JSON 字符串数组，以便包含空格的参数仍能被准确解析。它使用标准 ACP Session 和 Gateway 提供的 Session MCP 工具，不假设任何 Agent 的私有启动、权限或 UI 能力。

没有 ACP 的操作系统可以通过自定义 Node 启动器实现 `BackendPort`；请参阅[后端适配器 SDK](../reference/backend-adapter-sdk.md)。SDK 组合不会添加 `AGENT_PROTOCOL` 名称，也不会让配置文件动态加载任意代码。

## Hermes

Hermes Agent（[nousresearch/hermes-agent](https://github.com/nousresearch/hermes-agent)）自带 ACP 模式；Gateway 使用 `hermes acp` 启动它：

```dotenv
AGENT_PROTOCOL=hermes
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

Hermes 默认使用自己配置的模型和提供商。仅当显式设置 `QWEN_AUDIO_AGENT_BACKEND_MODEL` 时，Gateway 才会通过 ACP 覆盖其 Session 模型。首次使用前，你可以运行 `hermes acp --check` 检查依赖。高级配置：

```dotenv
HERMES_BIN=
HERMES_WORKSPACE=
```

如果由于提供商模型目录不可达而导致 `session/new` 长时间等待，你可以通过 `~/.hermes/config.yaml` 中的 `model_catalog.excluded_providers` 排除未使用的提供商。

## CodeBuddy

CodeBuddy Code（腾讯的 `@tencent-ai/codebuddy-code`）使用 `codebuddy --acp`。其 ACP 模式需要账户认证；首次使用前，你应该交互式运行 `codebuddy` 并通过 `/login` 完成登录。

```dotenv
AGENT_PROTOCOL=codebuddy
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

默认情况下，它直接使用 CodeBuddy 现有的模型配置。当 `QWEN_AUDIO_AGENT_BACKEND_MODEL` 为显式设置时，Gateway 仅在 CodeBuddy ACP 公布标准模型选项后通过 `session/set_config_option` 进行覆盖；它不会传递 `--model` 或生成项目级的 `.codebuddy/models.json`。高级配置：

```dotenv
CODEBUDDY_BIN=
CODEBUDDY_WORKSPACE=
CODEBUDDY_MODEL_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
```

`CODEBUDDY_MODEL_URL` 是 CodeBuddy 自己的提供商端点，并不证明 Session 模型已更改；返回的 ACP `configOptions` 仍然具有权威性。

## Codex

Codex（[openai/codex](https://github.com/openai/codex)）通过 ACP 项目维护的 [codex-acp](https://github.com/agentclientprotocol/codex-acp) 连接。启动脚本优先绑定用户环境中已安装的 `codex`，并优先使用已安装的 `codex-acp`；当适配器缺失时，通过 `npx` 使用固定版本。

```dotenv
AGENT_PROTOCOL=codex
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

默认情况下，它复用用户的 `~/.codex`、登录状态和模型。显式的 `QWEN_AUDIO_AGENT_BACKEND_MODEL` 仅通过标准 ACP 模型选项覆盖 Session；`CODEX_BASE_URL` 配置自定义提供商端点，不再将模型写入 `CODEX_CONFIG`。这两个设置都不会修改用户的配置文件。高级配置：

```dotenv
CODEX_ACP_BIN=
CODEX_ACP_PACKAGE=@agentclientprotocol/codex-acp@1.1.7
CODEX_ACP_RUNTIME=auto
CODEX_PATH=
CODEX_WORKSPACE=
CODEX_BASE_URL=
```

## Claude Code

Claude Code 通过 Zed 维护的 [@zed-industries/claude-code-acp](https://github.com/zed-industries/claude-code-acp) 连接。启动脚本优先使用已安装的 `claude-code-acp`，否则通过 `npx` 使用固定版本；无需单独安装 ACP 适配器，但必须先安装并认证 Claude Code。

```dotenv
AGENT_PROTOCOL=claude
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

模型和凭据默认由 Claude Code 自身管理，复用 `~/.claude` 中现有的登录状态；你也可以设置 `ANTHROPIC_API_KEY`。仅当显式设置 `QWEN_AUDIO_AGENT_BACKEND_MODEL` 时，Gateway 才会通过 ACP 覆盖其 Session 模型。高级配置：

```dotenv
CLAUDE_CODE_ACP_BIN=
CLAUDE_CODE_ACP_PACKAGE=@zed-industries/claude-code-acp@0.16.2
CLAUDE_CODE_ACP_RUNTIME=auto
CLAUDE_WORKSPACE=
CLAUDE_CODE_EXECUTABLE=
CLAUDE_CONFIG_DIR=
```

设置 `CLAUDE_CONFIG_DIR` 会切换到独立的配置目录，需要在该目录中进行单独认证。`CLAUDE_CODE_EXECUTABLE` 仅用于覆盖适配器默认使用的 Claude Code 可执行文件。

## Pi

Pi（earendil-works 的 [pi coding agent](https://pi.dev)，npm 包 `@earendil-works/pi-coding-agent`）没有原生 ACP 入口点；它通过社区适配器 [pi-acp](https://github.com/svkozak/pi-acp) 连接。Gateway 启动 `pi-acp`，后者在内部启动 `pi --mode rpc`；pi-acp 要求 pi `0.80.4` 或更高版本。

一键安装会同时安装核心和适配器：

```bash
qwenaudio install pi
```

或者手动安装两个包：

```bash
npm install -g @earendil-works/pi-coding-agent pi-acp
```

对于认证，请交互式运行 `pi` 并通过 `/login` 完成登录（使用 Claude Pro/Max、ChatGPT 或 GitHub Copilot 订阅进行 OAuth），或设置官方 API 密钥环境变量（`ANTHROPIC_API_KEY`、`OPENAI_API_KEY`、`GEMINI_API_KEY` 以及 30 多个其他提供商）；Gateway 会将环境变量传递给后端进程。然后选择后端：

```dotenv
AGENT_PROTOCOL=pi
```

pi-acp 支持通过 `session/load` 恢复历史 pi Session。高级配置：

```dotenv
PI_BIN=
PI_ACP_BIN=
PI_WORKSPACE=
PI_ACP_RUNTIME=auto
```

- `PI_BIN` / `PI_ACP_BIN` 覆盖 pi 核心和 pi-acp 适配器可执行文件。
- `PI_WORKSPACE` 覆盖工作目录（默认为 `~/.config/qwaudio/data/workspace`，与其他托管后端共享）。
- `PI_ACP_RUNTIME`（`auto` / `binary` / `package`）控制适配器是使用本地二进制文件还是通过 `npx` 按需启动。

> **警告：Pi 没有权限批准机制。** Pi 官方文档说明“无内置沙箱”——读写和 bash 执行直接使用当前用户的权限——且 pi-acp 未实现 ACP `session/request_permission`。因此 Pi **始终等同于 `full` 权限**，无论 `QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE` 如何设置，语音会话中永远不会出现权限确认。请仅在受信任的项目和受信任的提示环境中使用它。

当前的社区适配器接受 ACP `mcpServers`，但不会将其接入 Pi。因此，Gateway Session 工具和独立的第三方层委派对此后端不可用；Pi 使用自己的工具在当前 Session 中完成工作。

MiniMax Code、Kimi Code、Hermes、CodeBuddy、Codex、Claude Code 和 Pi 的 ACP 子进程均由 Gateway 直接管理，且不接受 `--backend-url`。