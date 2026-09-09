# 配置概览

通常你只需要语音前端凭据。当你希望助手执行操作时，选择一个后端代理。桌面版在“设置”页面中提供了常用设置；CLI 用户可以通过以下命令找到配置文件：

```bash
qwenaudio config
```

该命令会显示确切路径，并在文件缺失时创建模板。切勿提交 API 密钥、令牌或本地身份机密。

## 最小配置

对于默认语音前端：

```dotenv
DASHSCOPE_API_KEY=your-key
```

如果你的后端代理已安装并配置好，直接选择即可。对于 Qwen Code：

```dotenv
AGENT_PROTOCOL=qwen
QWEN_AUDIO_AGENT_BACKEND_MODEL=
```

空的模型配置会保留代理自身的设置；显式设置则请求覆盖。如果不需要后端，请保持未设置状态或选择 `AGENT_PROTOCOL=none`。前端聊天和已启用的工具仍然可用。有关 OpenCode / OpenClaw 托管设置和模型覆盖约束，请参阅[后端设置](configuration/backend.md)。

## 配置优先级

```text
CLI 参数 > 进程环境变量 > .env.local > .env > 用户配置文件 > 内置默认值
```

从源码运行时，仓库中的 `.env.local` 或 `.env` 可能会覆盖用户文件。如果更改似乎无效，请检查实际文件、进程环境以及你所连接的网关。

参阅[运行网关](operations/gateway.md#applying-configuration-changes)以应用更改：重启前台运行，对已安装服务使用 `gateway restart`，或在桌面版中点击“应用”。

## 配置与数据目录

产品根目录默认为 `~/.config/qwaudio`。网关和 TUI 在其中管理各自文件；所有权不需要为每个进程单独设置顶层目录：

| 内容 | 默认路径（相对于根目录） | 桌面版和 CLI |
| --- | --- | --- |
| 设置、默认角色、本地身份 | `config.env`、`ASSISTANT.md`、`identity.env` | 共享 |
| 偏好设置、记忆、笔记 | `data/USER.md`、`data/MEMORY.md`、`data/frontend-notes.json` | 共享 |
| 默认后端工作区 | `data/workspace/` | 共享；可单独配置 |
| 导入的文档和索引 | `data/knowledge/` | 共享 |
| 任务、会话、日志、锁、托管后端状态 | `state/` | 每个网关独立 |
| 可重建的网关缓存 | `cache/` | 可丢弃 |
| TUI 连接配置、凭据、实例锁和日志 | `tui/` | 仅终端客户端 |

CLI 托管的网关默认使用 `state/`；桌面版托管的网关使用 `state/desktop/`。它们共享配置、记忆和工作区，但任务、会话和运行时日志保持独立。原生后端会话属于后端，而非工作区的项目文件。

| 环境变量 | 用途 | 默认值 |
| --- | --- | --- |
| `QWAUDIO_CONFIG_DIR` | 产品根目录；在启动前设置 | `$XDG_CONFIG_HOME/qwaudio` 或 `~/.config/qwaudio` |
| `QWAUDIO_DATA_DIR` | 共享用户数据 | `<config-dir>/data` |
| `QWAUDIO_STATE_DIR` | 当前网关的持久状态 | CLI：`<config-dir>/state`；桌面版托管：`<config-dir>/state/desktop` |
| `QWAUDIO_CACHE_DIR` | 可重建缓存 | `<config-dir>/cache` |
| `QWAUDIO_WORKSPACE` | 所有后端的默认工作区 | `<data-dir>/workspace` |

除产品根目录本身外，上述网关目录选项也可以在 `config.env` 中设置。建议使用绝对路径。后端特定的工作区（如 `QODER_WORKSPACE`）优先。独立的网关不得共享状态目录。状态不是缓存：删除它会丢失任务和会话历史。请保持 `identity.env` 私密；备份配置、数据和任何必要的状态。

启动时不会发现、合并或迁移旧布局。要保留现有项目和记忆，请显式配置其位置或在停止状态下整理文件。旧文件永远不会被自动删除。

### 客户端目录

桌面版使用平台应用程序数据目录：

- macOS：`~/Library/Application Support/Qwen Audio Agent`
- Windows：`%APPDATA%/Qwen Audio Agent`
- Linux：`$XDG_CONFIG_HOME/Qwen Audio Agent`，默认为 `~/.config/Qwen Audio Agent`

`settings.env` 存储网关连接地址、语言、外观和唤醒偏好；`ui-state.json` 存储窗口位置和客户端会话标识符。连接凭据、`skins/`、`cache/`（包括唤醒词模型）和 `logs/` 也属于客户端。Electron 管理浏览器存储。来自同一设置页面的语音服务和后端设置仍会写入网关的 `config.env`。

TUI 连接配置和凭据位于 `<config-dir>/tui/`，默认为 `~/.config/qwaudio/tui/`，与实例锁和诊断日志放在一起。CLI 的 `connect`、`disconnect` 和 `tui` 命令管理这些文件；网关从不读取或写入它们。

更改 `QWAUDIO_CONFIG_DIR` 也会移动 TUI 状态。仅更改网关的 `QWAUDIO_DATA_DIR`、`QWAUDIO_STATE_DIR` 或 `QWAUDIO_CACHE_DIR` 则不会。仅在需要单独位置时，在启动前设置 `QWAUDIO_TUI_DIR`。这些变量都不会移动桌面应用程序目录。WebUI 认证、语言和会话标识符使用浏览器 Cookie 和本地存储。

## 按需配置

| 我想配置… | 文档 |
| --- | --- |
| 语音模型、服务地址、凭据 | [语音前端](configuration/frontend.md) |
| 后端选择、安装、模型、权限 | [后端设置](configuration/backend.md) |
| 网络搜索 | [搜索服务](guides/web-search.md) |
| 文档和知识检索 | [知识库](guides/knowledge.md) |
| 角色、偏好、自动记忆 | [个性化](reference/personalization.md)、[记忆](reference/memory.md) |
| 额外前端工具 | [MCP](reference/frontend-mcp.md)、[OpenAPI](reference/frontend-openapi.md) |
| 角色和工具设置的组合包 | [前端配置集](reference/frontend-profile.md) |
| 远程设备、持久服务 | [远程连接](operations/remote-access.md)、[网关](operations/gateway.md) |
| 日志和其他可选参数 | [高级设置](configuration/advanced.md) |

## 继续阅读

如果出现问题，请从[故障排除](operations/troubleshooting.md)开始。