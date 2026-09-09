# 后端配置

## 后端设置检查

配置后端 Agent 后，您可以运行统一的只读检查：

```bash
qwenaudio setup
```

该命令会检查后端可执行文件、ACP 集成方式以及所需的适配器，并清晰地显示当前的选择。检查命令本身不会安装或下载后端 Agent，不会触发登录，不会输出或验证凭据，也不会修改模型配置。它会指示 OpenCode/OpenClaw 是否可以在正式启动时自动下载和配置自身；其他后端的配置状态由 Agent 自身管理。

仅检查指定后端或获取机器可读的结果：

```bash
qwenaudio setup --backend codex
qwenaudio setup --json
```

JSON 输出使用与 CLI 相同的共享检测模块，桌面版和其他工具可以直接复用。

## 一键安装后端 Agent

未安装的后端 Agent 可以使用统一命令在本地机器上安装：

```bash
qwenaudio install codex
qwenaudio install deepseek
qwenaudio install minimax
```

- 安装前会进行检测，仅补全缺失的组件：原生 ACP 后端安装后即可使用；如果主程序缺失，则安装主程序；如果主程序已安装但仅缺少 ACP 适配器，则仅安装适配器；如果一切就绪，则直接提示可用。
- 安装规范（锁定版本的官方 npm 包、官方安装脚本）在 CLI 和桌面版之间共享，来自同一份定义；版本与 `scripts/` 下受管理的启动脚本保持一致；可以通过相应的环境变量进行覆盖，例如 `OPENCODE_PACKAGE`、`CODEX_ACP_PACKAGE`、`CLAUDE_CODE_ACP_PACKAGE`。
- Codex 和 Claude Code 的 ACP 适配器与主程序一同提供；Hermes 使用官方安装脚本。脚本类型的步骤会在执行前显示完整命令并等待确认；`--yes` 可跳过确认（请谨慎使用）。
- 安装后会自动重新检测后端可用性；需要初始化、登录或凭据的后端会显示一致的**配置**操作。
- 通用 `acp` 后端不提供一键安装；请自行安装并通过 `ACP_COMMAND` 进行配置。
- 在桌面版设置页面的“后端 Agent”列表中，未安装且支持一键安装的后端会在行末显示“安装”按钮，使用与 CLI 相同的安装逻辑；脚本类型的安装会弹出原生确认对话框。

桌面版为安装、配置和连接状态提供共享外壳，不对任何 Agent 特定的登录流程进行硬编码。每个后端的入门适配器声明其可信配置入口和状态探测方式。适配器目前可以打开终端，未来可以提供浏览器、表单或指令操作，而无需更改设置中产品特定的逻辑。渲染进程仅提交后端 ID，无法组装或执行配置命令。

安装 DeepSeek Harness 后，运行 `dsh web` 并在其模型设置中配置官方 API 密钥。ACP 集成会复用该凭据。其模型设置有意与其他后端分开，这样 Qwen 或其他提供商的模型名称就不会被转发到 DeepSeek：

```dotenv
AGENT_PROTOCOL=deepseek
# 可选：deepseek-v4-pro（默认）或 deepseek-v4-flash
DEEPSEEK_HARNESS_MODEL=deepseek-v4-pro
```

`DEEPSEEK_API_KEY` 仍然可以设置为每次运行的显式覆盖值。

## 选择后端

`AGENT_PROTOCOL` 没有默认值，也是一个可选配置。留空时，网关不会启动后端 Agent；前端聊天和已启用的工具仍然可用；需要后端执行的请求将返回明确的错误，而不会创建任务或猜测执行结果。您也可以使用 `qwenaudio --backend none` 显式启动仅前端模式。

## 模型选择

将后端模型留空以使用原生默认值。只有显式设置值时才请求覆盖：

```dotenv
AGENT_PROTOCOL=qwen
QWEN_AUDIO_AGENT_BACKEND_MODEL=
```

未设置时，网关不会发送或猜测模型，也永远不会调用设置接口。后端为新会话选择模型；恢复的会话保留其原始模型。显式值适用于协调器以及新的或恢复的项目会话。

覆盖仅使用标准 ACP `configOptions` 和 `session/set_config_option` 中的 `category: model` 选项。不支持的设置、不可用的值、失败的调用或未验证的结果会使请求明确失败。不使用私有 RPC 和启动参数来模拟覆盖。请使用后端公布的模型 ID。

OpenCode / OpenClaw 也支持托管设置：`DASHSCOPE_API_KEY` 和后端模型可以在启动前为自有实例初始化百炼配置。此部署步骤并不意味着每个 ACP 后端都支持模型覆盖。对于其他已安装和配置的 Agent，只需选择后端并通常将模型留空即可。

## 后端特定设置

<a id="openclaw"></a>
<a id="opencode"></a>
<a id="qoder"></a>
<a id="qwen-code"></a>
<a id="minimax-code"></a>
<a id="kimi-code"></a>
<a id="hermes"></a>
<a id="codebuddy"></a>
<a id="codex"></a>
<a id="claude-code"></a>
<a id="pi"></a>

[OpenClaw](../backends/configuration.md#openclaw) · [OpenCode](../backends/configuration.md#opencode) · [Qoder](../backends/configuration.md#qoder) · [Qwen Code](../backends/configuration.md#qwen-code) · [MiniMax Code](../backends/configuration.md#minimax-code) · [Kimi Code](../backends/configuration.md#kimi-code) · [Hermes](../backends/configuration.md#hermes) · [CodeBuddy](../backends/configuration.md#codebuddy) · [Codex](../backends/configuration.md#codex) · [Claude Code](../backends/configuration.md#claude-code) · [Pi](../backends/configuration.md#pi)

## 技能管理

技能仅安装到后端。有关命令和位置，请参阅[后端技能](../guides/skills.md)。

### 技能何时生效

请参阅[技能发现与加载](../guides/skills.md#when-skills-take-effect)。

### 共享后端工作区

请参阅[共享后端工作区](../guides/skills.md#shared-backend-workspace)。

## 后端权限模式

`QWEN_AUDIO_AGENT_BACKEND_PERMISSION_MODE` 可以设置为：

- `native`（默认）：权限由后端 Agent 自身决定和请求；网关仅按原样转发。
- `full`：在启动时显式授予最高权限；后端可以直接执行命令、读写文件，无需每次请求时确认。

`full` 目前支持 OpenCode、Qoder、Qwen Code、MiniMax Code、Kimi Code、Hermes、CodeBuddy、Codex 和 Claude Code。网关会自动批准这些 ACP 后端发起的权限请求；此外，Kimi Code 会切换到通过 ACP 会话配置不再询问的自动模式，Qoder 和 CodeBuddy CLI 使用 `--dangerously-skip-permissions`，OpenCode 在托管进程的内联配置中为协调 Agent 和任务 Agent 设置 `permission: "allow"`，Codex 使用 `agent-full-access` 模式。Kimi Code 的 YOLO 模式仍可能询问用户，因此此处不使用它来映射 `full`。

Pi 是一个特例：它没有内置的沙箱或权限审批机制，其适配器 pi-acp 也不实现 ACP `session/request_permission`。因此，无论配置了哪种权限模式，Pi 始终以等同于 `full` 的权限运行——这不是“支持 `full`”，而是没有任何审批步骤。Pi 通过 `alwaysFullPermission` 后端能力声明这一点：配置解析和网关健康检查都会规范化并显示有效的 `full` 模式（绝不会显示误导性的 `native`）。仅在受信任的项目和受信任的提示环境中使用它。

OpenClaw 的执行授权同时受执行审批、提权和执行主机配置的约束，无法通过一个统一的开关安全且完整地表达；当选择 `full` 时，网关会明确拒绝启动，需要通过 OpenClaw 自身的方法进行单独配置。最高权限会放大误操作的风险，应仅在受信任的项目和受信任的提示环境中启用。