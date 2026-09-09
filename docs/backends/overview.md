# 后端代理

后端代理负责处理需要工具、文件操作或持续处理的任务。当前端语音大模型判断某个请求需要执行时，它会将目标委托给后端代理进行异步执行；一旦结果就绪，便会自然地返回到当前对话中。

## 支持的代理

| 后端代理 | 集成方式 | 设置要求 | 技能 | 推荐度 |
| --- | --- | --- | --- | --- |
| 无 | 不适用 | 仅前端模式，无需配置 | — | ★★★★★ |
| Qwen Code | 原生 ACP | 支持一键安装，需要用户配置 | `~/.qwen/skills/` | ★★★★★ |
| OpenCode | 原生 ACP | 支持一键安装和百炼配置 | `~/.config/opencode/skills/` | ★★★★★ |
| OpenClaw | 内置 ACP 桥接 | 支持一键安装和百炼配置 | `~/.openclaw/skills/` | ★★★★★ |
| Qoder | 原生 ACP | 支持一键安装，需要用户配置 | `~/.qoder/skills/` | ★★★★★ |
| MiniMax Code | 原生 ACP | 支持一键安装，需要用户配置 | 由 MiniMax Code 管理 | ★★★★☆ |
| Kimi Code | 原生 ACP | 支持一键安装，需要用户配置 | `~/.agents/skills/` | ★★★★★ |
| Hermes | 原生 ACP | 支持一键安装，需要用户配置 | `~/.hermes/skills/` | ★★★★☆ |
| CodeBuddy | 原生 ACP | 支持一键安装，需要用户配置 | `~/.codebuddy/skills/` | ★★★★☆ |
| Codex | 外部 ACP 适配器 | 支持一键安装核心和适配器，需要用户配置 | `~/.codex/skills/` | ★★★★☆ |
| Claude Code | 外部 ACP 适配器 | 支持一键安装核心和适配器，需要用户配置 | `~/.claude/skills/` | ★★★★☆ |
| DeepSeek | 原生 ACP | 支持一键安装，需要 DeepSeek API 密钥 | `~/.agents/skills/` | ★★★★☆ |
| Pi | 外部 ACP 适配器 | 支持一键安装核心和适配器，需要用户配置 | `~/.pi/agent/skills/` | ★★★★☆ |

技能通过 `qwenaudio skill install`（标准 skills.sh 安装器的品牌化入口）一次性安装，并自动落入上述声明了 skills.sh 安装器的后端的用户级目录中。MiniMax Code 管理自己的技能和插件。参见[技能管理](../configuration/backend.md#skill-management)。

推荐度评级反映了当前集成的完整度、兼容性以及实际验证程度：五星表示经过全面测试并推荐的集成，四星表示仍在开发中或相同范围内的验证尚不完整。

## 一键安装

未安装的后端代理可以通过统一命令在本地安装：

```bash
qwenaudio install codex
qwenaudio install deepseek
qwenaudio install minimax
```

安装前会执行检测步骤，**仅填充缺失的组件**：如果核心缺失则安装核心，如果核心已存在则仅安装 ACP 适配器。现有组件不会被重新安装。安装并不意味着后端已配置完成：请完成所选后端所需的登录和配置。在桌面设置页面的“后端代理”列表中，对于支持一键安装的未安装后端，其行末会显示“安装”按钮，使用与 CLI 相同的安装逻辑。

DeepSeek Harness 目前为开发者预览版。此初始集成支持语音触发的任务、权限决策、取消当前运行以及最终结果交付。其 ACP 端点尚未暴露历史会话恢复、Gateway MCP 注入或细粒度工具进度。安装后，运行 `dsh web` 并在 DeepSeek 的模型设置中配置 API 密钥；`DEEPSEEK_API_KEY` 仍可作为每次运行的覆盖值使用。可选地，将 `DEEPSEEK_HARNESS_MODEL` 设置为 `deepseek-v4-pro`（默认）或 `deepseek-v4-flash`。

查看当前可用的后端代理：

```bash
qwenaudio setup
```

此命令仅检查——不会安装、下载或验证凭据。要仅检查特定后端或获取机器可读的结果：

```bash
qwenaudio setup --backend codex
qwenaudio setup --json
```

## 选择后端

`AGENT_PROTOCOL` 是一个可选配置。当留空时，Gateway 以仅前端模式运行，实时语音聊天仍然可用；需要后端执行的请求将返回明确的说明，而不会创建任务或猜测结果。你也可以在命令行中使用 `qwenaudio --backend none` 显式以仅前端模式启动。

```dotenv
AGENT_PROTOCOL=openclaw
```

OpenCode 和 OpenClaw 支持自动下载和安装；配置 `DASHSCOPE_API_KEY` 和 `QWEN_AUDIO_AGENT_BACKEND_MODEL` 后，它们可以自动连接到百炼模型。其他后端需要预先安装和原生配置；qwen-audio-agent 将复用它们的用户级模型、工具、MCP、技能和认证。MiniMax Code 将其模型、Provider、认证以及技能/插件配置置于自身控制之下。

要使用其他支持 ACP stdio 的代理：

```dotenv
AGENT_PROTOCOL=acp
ACP_COMMAND=your-agent
ACP_ARGS=["--acp"]
```

命令、参数、显示名称和工作目录可以分别通过 `ACP_COMMAND`、`ACP_ARGS`、`ACP_LABEL` 和 `ACP_WORKSPACE` 配置。通用 ACP 入口不提供一键安装；请自行安装。

## 权限模式

`QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE` 可以设置为：

- `native`（默认）：权限由后端代理自行决定和提示；Gateway 仅按原样转发请求。
- `full`：启动时授予最高权限，允许后端直接执行命令、读写文件，无需逐操作确认。

`full` 目前支持 OpenCode、Qoder、Qwen Code、MiniMax Code、Kimi Code、Hermes、CodeBuddy、Codex 和 Claude Code；Gateway 将自动批准这些后端的权限请求。OpenClaw 的执行授权受 exec 审批、提权和其他配置设置的限制，无法通过单一开关来表达——当选择 `full` 时，Gateway 将明确拒绝启动。最高权限会放大意外操作的风险，应仅在受信任的项目中启用。

Pi 是一个特殊情况：它没有内置的沙箱或权限审批机制，其适配器 pi-acp 也未实现 ACP 的 `session/request_permission`。因此，无论配置何种模式，Pi 始终以等同于 `full` 的权限运行——完全没有审批步骤，语音会话中也不会出现权限确认。请仅在受信任的项目和受信任的提示环境中使用它。

当前的社区适配器未将 ACP `mcpServers` 接入 Pi，因此该后端无法使用 Gateway 会话工具和独立的第三层委托。Pi 使用自己的工具在当前会话中处理工作。

## 后端服务

要使 Gateway 保持运行，请参见[运行 Gateway](../operations/gateway.md)。有关配置和权限，请参见[通用设置](../configuration/backend.md)；有关模型、命令和目录，请参见[后端特定设置](configuration.md)。