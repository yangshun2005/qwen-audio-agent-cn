# 各后端详细配置

只需找到你选择的后端，无需填写所有配置。安装命令、标准模型覆盖和权限模式请参阅
[后端通用设置](../configuration/backend.zh.md)，支持范围请参阅[后端列表](overview.zh.md)。

## OpenClaw

OpenClaw 默认地址为 `http://127.0.0.1:18789`。当显式设置
`OPENCLAW_BASE_URL` 时，qwen-audio-agent 会将该 Gateway 视为外部黑盒直接连接，
不会另行启动 OpenClaw Gateway，也不会读取、复制或修改其模型认证数据：

```dotenv
AGENT_PROTOCOL=openclaw
OPENCLAW_BASE_URL=http://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=
```

远程部署可以使用 `https://` 或 `wss://` 地址；跨机器连接建议使用 `wss://`，并且不要把
Token 写入 URL：

```dotenv
AGENT_PROTOCOL=openclaw
OPENCLAW_BASE_URL=wss://openclaw.example.com
OPENCLAW_GATEWAY_TOKEN=replace-with-your-token
```

外部模式仍会在 qwen-audio-agent 本机启动轻量级的官方 `openclaw acp` bridge，并通过
stdio ACP 与之通信；该 bridge 再连接用户管理的远程 Gateway。qwen-audio-agent 不会
启动、停止、更改端口或修改远程 Gateway。远程模式不进行 300ms 本地端口预判，而是由官方
bridge 返回实际的网络、TLS 和认证错误。如果本机安全软件终止了 bridge，本轮操作会明确失败，
但远程 Gateway 不受影响。

如果本机安全策略仅拦截 qwen-audio-agent 的 OpenClaw 启动包装层，可以显式指定一个
受信任的 OpenClaw 可执行文件，Gateway 将直接使用它启动轻量级 bridge：

```dotenv
OPENCLAW_ACP_BIN=/absolute/path/to/openclaw
```

这不会改变远程 Gateway 的所有权；该进程仍只是一个本地 ACP bridge，并会随
qwen-audio-agent Gateway 关闭而结束。

当未设置 `OPENCLAW_BASE_URL` 时，默认优先启动用户环境中的 `openclaw`。如果同时提供
`DASHSCOPE_API_KEY` 和
`QWEN_AUDIO_AGENT_BACKEND_MODEL`，会为 qwen-audio-agent 进程生成独立的
百炼配置和状态目录，不会修改用户原生配置。若未指定后端模型，则继承用户的原生
配置、模型和认证，但不会在独立实例中启用钉钉等外部消息渠道。在自管模式下，若原配置
启用了 Gateway Token，会自动读取并用于本地 ACP 连接；也可以通过
`OPENCLAW_GATEWAY_TOKEN` 覆盖，或设置 `OPENCLAW_CONFIG_PATH` 明确指定另一份
OpenClaw 配置。连接外部 Gateway 时，应同时设置 `OPENCLAW_GATEWAY_TOKEN`（或
`OPENCLAW_GATEWAY_TOKEN_FILE`）。

上述模型值仅用于本机托管实例的启动前初始化。连接外部 OpenClaw 时，Session
模型覆盖必须由其 ACP bridge 通过标准 `configOptions` 声明；Gateway 不再调用
OpenClaw 私有的 `sessions.patch` 接口来修改模型。

## OpenCode

Gateway 通过 `opencode acp` 与它交互，并管理用于打开原生 Session
界面的本地服务。如果没有兼容的安装，会自动使用固定的 npm 包，用户无需另行安装或
启动服务。`OPENCODE_BASE_URL` 是该本地 Session UI 服务的地址，并非可供
qwen-audio-agent 连接的远程 ACP 执行地址：

```dotenv
AGENT_PROTOCOL=opencode
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

## Qoder

Qoder 使用本机的 `qodercli --acp`，没有 HTTP 后端地址：

```dotenv
AGENT_PROTOCOL=qoder
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

统一的 ACP Adapter 为每个用户维护一个固定的原生协调 Session，并通过 ACP 的
Session list/resume/new 能力和动态 MCP 工具提供列出、新建、继续、查询和取消
项目 Session 的能力。继续已有项目时，使用目标 Session 的原始 `session_id` 和
工作目录执行 `session/resume`，交互会追加到原生 CLI Session 历史中。

认证复用 `qodercli` 当前的登录状态或它所支持的环境变量。高级配置：

```dotenv
QODERCLI_PATH=
QODER_CONFIG_DIR=
```

Gateway 管理 Qoder ACP 子进程；Qoder 不接受 `--backend-url`。

## Qwen Code

Qwen Code 通过官方本地 stdio ACP 入口 `qwen --acp` 接入。Gateway 只负责启动
这个 ACP 进程，认证、Provider、模型、MCP、Skill 和 Session 配置均复用 Qwen
Code 自身的配置。

```dotenv
AGENT_PROTOCOL=qwen
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

首次认证请直接运行 `qwen`，然后使用 `/auth`；已经移除的 `qwen auth` 不会被调用。
可选覆盖项：

```dotenv
QWEN_CODE_BIN=
QWEN_CODE_WORKSPACE=
```

当前仅支持本地 ACP 进程，暂不将 Qwen Code 的实验性网络服务作为远程后端。

## MiniMax Code

MiniMax Code（[官方 CLI 文档](https://agent.minimax.io/docs/cli/features)）通过官方
`mcode acp` 以 ACP v1/stdio 接入。Gateway 仅启动这个本地 ACP 进程；认证、Provider、
模型、Session 和 Skill/Plugin 配置均由 MiniMax Code 自行管理。当前集成要求 MiniMax
Code 版本为 `0.3.7` 或更高。

可以使用统一安装命令安装官方 CLI：

```bash
qwenaudio install minimax
```

首次认证：

```bash
mcode login
```

Global 账号可使用 `mcode login --region global`；自定义 Provider 或 API Key 请运行
`mcode provider` 进行配置。完成 MiniMax Code 自身配置后，只需选择后端：

```dotenv
AGENT_PROTOCOL=minimax
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

高级配置：

```dotenv
MINIMAX_CODE_BIN=
MINIMAX_CODE_WORKSPACE=
```

建议不要使用 `QWEN_AUDIO_AGENT_BACKEND_MODEL` 覆盖 MiniMax Code 的模型；如果显式设置，
Gateway 只会在 MiniMax ACP 声明兼容的标准 `configOptions` 时尝试覆盖，否则会明确报错。
由于 MiniMax Code 的公开文档未声明兼容 skills.sh 的用户目录，`qwenaudio skill` 不会
将技能复制到其私有 Skill/Plugin 存储，请使用 MiniMax Code 自己的管理流程。

## Kimi Code

Kimi Code（[MoonshotAI/kimi-code](https://github.com/MoonshotAI/kimi-code)）
通过官方原生 ACP 入口 `kimi acp` 接入。当前集成验证并要求 Kimi Code 版本为 `0.31.0`
或更高；`qwenaudio setup --backend kimi` 会同时检查可执行文件和版本，并拒绝
低于兼容基线的旧实现。

可以使用官方安装脚本安装经过验证的版本：

```bash
curl -fsSL https://code.kimi.com/kimi-code/install.sh | \
  KIMI_VERSION=0.31.0 KIMI_INSTALL_DIR="$HOME/.local" \
  KIMI_NO_MODIFY_PATH=1 bash
```

如果已经通过 Kimi Code 自身完成登录，只需选择后端：

```dotenv
AGENT_PROTOCOL=kimi
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

也可以使用 Kimi Code 官方的临时模型环境变量，在不改写
`~/.kimi-code/config.toml` 的情况下提供 Kimi Code API Key：

```dotenv
AGENT_PROTOCOL=kimi
KIMI_MODEL_NAME=kimi-for-coding
KIMI_MODEL_API_KEY=your-kimi-code-key
KIMI_MODEL_BASE_URL=https://api.kimi.com/coding/v1
```

`config.env` 由 qwen-audio-agent 创建为仅当前用户可读写的 `0600` 权限文件，禁止将
实际 API Key 写入仓库。Kimi Code 的原生配置、OAuth 凭据和 Session 存储默认仍
由 Kimi 自己管理；qwen-audio-agent 不会修改这些文件。设置 `KIMI_CODE_HOME` 可以
显式选择另一套 Kimi 数据目录，设置 `KIMI_WORKSPACE` 可以覆盖协调工作区。

当显式设置 `QWEN_AUDIO_AGENT_BACKEND_MODEL` 时，Gateway 会通过 ACP
`session/set_config_option` 覆盖 Kimi Session 模型并确认生效；留空则由 Kimi
选择自身的默认模型。高级配置：

```dotenv
KIMI_CODE_BIN=
KIMI_WORKSPACE=
KIMI_CODE_HOME=
```

其他支持 ACP stdio 的 Agent 可以使用通用入口：

```dotenv
AGENT_PROTOCOL=acp
ACP_COMMAND=your-agent
ACP_ARGS=["--acp"]
ACP_LABEL=Your Agent
ACP_WORKSPACE=
```

通用入口由 Gateway 直接管理 ACP 子进程。`ACP_ARGS` 推荐写成
JSON 字符串数组，以便参数中包含空格时仍能准确解析。它使用标准 ACP Session 和
Gateway 提供的 Session MCP 工具，不假设某个 Agent 私有的启动、权限或 UI 能力。

不提供 ACP 的办事系统可以在自定义 Node 启动器中实现 `BackendPort`，详见
[Backend Adapter SDK](../reference/backend-adapter-sdk.zh.md)。SDK 接入不会新增
`AGENT_PROTOCOL` 名称，也不会让配置文件动态加载任意代码。

## Hermes

Hermes Agent（[nousresearch/hermes-agent](https://github.com/nousresearch/hermes-agent)）
自带 ACP 模式，Gateway 使用 `hermes acp` 启动：

```dotenv
AGENT_PROTOCOL=hermes
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

Hermes 默认使用自身配置的模型与 provider。仅当显式设置
`QWEN_AUDIO_AGENT_BACKEND_MODEL` 时，Gateway 才会通过 ACP 覆盖其 Session
模型。首次使用前可运行 `hermes acp --check` 检查依赖。高级配置：

```dotenv
HERMES_BIN=
HERMES_WORKSPACE=
```

如果 `session/new` 因 provider 模型目录不可达而长时间等待，可以在
`~/.hermes/config.yaml` 中通过 `model_catalog.excluded_providers` 排除未使用的
provider。

## CodeBuddy

CodeBuddy Code（腾讯 `@tencent-ai/codebuddy-code`）使用
`codebuddy --acp`。其 ACP 模式需要账号认证；首次使用前应交互式运行
`codebuddy`，并通过 `/login` 完成一次登录。

```dotenv
AGENT_PROTOCOL=codebuddy
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

默认直接使用 CodeBuddy 已有的模型配置。当显式设置
`QWEN_AUDIO_AGENT_BACKEND_MODEL` 时，只会在 CodeBuddy ACP 声明标准模型选项后
通过 `session/set_config_option` 覆盖；Gateway 不会传递 `--model`，也不会生成项目级
`.codebuddy/models.json`。高级配置：

```dotenv
CODEBUDDY_BIN=
CODEBUDDY_WORKSPACE=
CODEBUDDY_MODEL_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
```

`CODEBUDDY_MODEL_URL` 是 CodeBuddy 自身的 Provider 地址，不代表 Session 模型已经
切换；模型是否生效仍以 ACP 返回的 `configOptions` 为准。

## Codex

Codex（[openai/codex](https://github.com/openai/codex)）通过 ACP 项目维护的
[codex-acp](https://github.com/agentclientprotocol/codex-acp) 接入。启动脚本优先
绑定用户环境中已安装的 `codex`，并优先使用已安装的 `codex-acp`；若缺少 Adapter，
则通过 `npx` 使用固定版本。

```dotenv
AGENT_PROTOCOL=codex
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

默认复用用户的 `~/.codex`、登录状态和模型。当显式设置
`QWEN_AUDIO_AGENT_BACKEND_MODEL` 时，仅通过 ACP 标准模型选项覆盖 Session；
`CODEX_BASE_URL` 仅用于配置自定义 Provider 地址，不再向 `CODEX_CONFIG` 写入模型。
这两者都不会修改用户配置文件。高级配置：

```dotenv
CODEX_ACP_BIN=
CODEX_ACP_PACKAGE=@agentclientprotocol/codex-acp@1.1.7
CODEX_ACP_RUNTIME=auto
CODEX_PATH=
CODEX_WORKSPACE=
CODEX_BASE_URL=
```

## Claude Code

Claude Code 通过 Zed 维护的
[@zed-industries/claude-code-acp](https://github.com/zed-industries/claude-code-acp)
接入。启动脚本优先使用已安装的 `claude-code-acp`，否则通过 `npx` 使用固定
版本；无需单独安装 ACP 适配器，但需要先安装并认证 Claude Code。

```dotenv
AGENT_PROTOCOL=claude
QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE=native
```

模型和凭据默认由 Claude Code 自己管理，并复用 `~/.claude` 中已有的登录状态；
也可以设置 `ANTHROPIC_API_KEY`。仅当显式设置 `QWEN_AUDIO_AGENT_BACKEND_MODEL`
时，Gateway 才会通过 ACP 覆盖其 Session 模型。高级配置：

```dotenv
CLAUDE_CODE_ACP_BIN=
CLAUDE_CODE_ACP_PACKAGE=@zed-industries/claude-code-acp@0.16.2
CLAUDE_CODE_ACP_RUNTIME=auto
CLAUDE_WORKSPACE=
CLAUDE_CODE_EXECUTABLE=
CLAUDE_CONFIG_DIR=
```

设置 `CLAUDE_CONFIG_DIR` 会改用独立配置目录，需要在该目录中单独完成认证。
`CLAUDE_CODE_EXECUTABLE` 仅用于覆盖适配器默认使用的 Claude Code 可执行文件。

## Pi

Pi（earendil-works 的 [pi coding agent](https://pi.dev)，npm 包
`@earendil-works/pi-coding-agent`）没有原生 ACP 入口，通过社区适配器
[pi-acp](https://github.com/svkozak/pi-acp) 接入。Gateway 会启动 `pi-acp`，
由它在内部拉起 `pi --mode rpc`；pi-acp 要求 pi 版本为 `0.80.4` 或更高。

一键安装会同时安装本体与适配器：

```bash
qwenaudio install pi
```

也可以手动安装这两个包：

```bash
npm install -g @earendil-works/pi-coding-agent pi-acp
```

认证：交互式运行 `pi` 并通过 `/login` 完成登录（支持 Claude Pro/Max、
ChatGPT、GitHub Copilot 订阅 OAuth），或设置官方 API Key 环境变量
（`ANTHROPIC_API_KEY`、`OPENAI_API_KEY`、`GEMINI_API_KEY` 等 30+ provider）；
Gateway 会将环境变量透传给后台进程。然后选择后端：

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

- `PI_BIN` / `PI_ACP_BIN` 分别覆盖 pi 本体与 pi-acp 适配器的可执行文件路径。
- `PI_WORKSPACE` 覆盖工作目录（默认 `~/.config/qwaudio/data/workspace`，与其他托管后端共享）。
- `PI_ACP_RUNTIME`（`auto` / `binary` / `package`）控制适配器是使用本地二进制
  还是通过 `npx` 按需启动。

> **警告：Pi 没有任何权限审批机制。** Pi 官方明确表示 "No Built-in Sandbox"——
> read、write、bash 直接以当前用户权限执行；pi-acp 也未实现 ACP
> `session/request_permission`。因此，无论
> `QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE` 如何配置，Pi 都**始终等效于
> `full` 权限**，语音会话中不会出现任何权限确认环节。请仅在可信项目和可信
> 提示词环境中使用。

当前的社区适配器虽然接收 ACP `mcpServers`，但尚未将它们接入 Pi。因此该后端
暂不提供 Gateway Session 工具和第三层独立任务委派；Pi 会使用自身工具在当前
Session 内完成工作。

MiniMax Code、Kimi Code、Hermes、CodeBuddy、Codex、Claude Code 和 Pi 均由 Gateway 直接管理 ACP
子进程，不接受 `--backend-url`。