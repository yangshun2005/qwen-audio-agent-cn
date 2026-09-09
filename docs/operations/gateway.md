# 运行 Gateway

Gateway 连接语音前端与后端 Agent，并为客户端提供对话界面。选择一种运行模式：

| 模式 | 启动 | 停止 |
| --- | --- | --- |
| 前台终端 | `qwenaudio` 或 `qwenaudio gateway` | 在该终端中按 `Ctrl-C`。 |
| 用户后台服务 | `qwenaudio gateway install` 安装并启动 | `qwenaudio gateway stop`；使用 `gateway uninstall` 移除。 |
| 嵌入式桌面 Gateway | 打开桌面应用；由应用启动并管理 Gateway | 退出应用会停止其自身的 Gateway，不会停止借用或远程服务。 |

## 应用配置更改

- **前台运行**：在 Gateway 终端中按 `Ctrl-C`，然后重新运行原始命令。
- **后台服务**：运行 `qwenaudio gateway restart`。如果未安装服务，则会报告服务未安装。
- **桌面应用**：更改设置并点击“应用”。直接编辑文件后，请退出并重新打开应用。
  仅客户端相关的设置（如皮肤和唤醒偏好）不应要求重启 Gateway。
- **远程连接**：在 Gateway 实际所在主机上更改并重启。本地设置不会重新配置远程服务器。

后台服务不会保留在终端中临时导出的凭据。请将持久化设置放入 `qwenaudio config` 显示的 `config.env` 文件中。

## 后台服务命令

```bash
qwenaudio gateway install
qwenaudio gateway status
qwenaudio gateway restart
qwenaudio gateway stop
qwenaudio gateway start
qwenaudio gateway uninstall
```

服务在启动时读取配置。`install`、`start` 和 `restart` 会刷新用户命令路径缓存，以便能够找到通过 Homebrew、npm、uv 或版本管理器安装的 Agent 和 stdio MCP 命令。

## 实例与客户端

一个运行时目录只能由一个 Gateway 使用。默认情况下，CLI、TUI 和 WebUI 使用 CLI 实例；桌面应用有独立的运行时目录，可以同时运行另一个实例。它们共享配置、记忆和工作区，但不共享任务状态、锁或日志。参见[配置与数据目录](../configuration.md#configuration-and-data-directories)。

每个用户在每台 Gateway 上有一个活动客户端。接管会断开之前的客户端。多个 Gateway 实例不同于单台 Gateway 上的多个客户端。

## 后端进程所有权

Gateway 会关闭由其启动的后端进程。复用 Agent 的用户配置并不意味着附加到或终止已在运行的用户进程。当显式配置为外部 OpenClaw Gateway 时，Gateway 仅连接而不拥有该服务的生命周期。参见 [OpenClaw 设置](../backends/configuration.md#openclaw)。

## 检查运行时

- `qwenaudio gateway status` 检查用户后台服务。
- `qwenaudio doctor` 在不启动模型或麦克风的情况下检查配置和连接。
- 参见[本地日志](../configuration/advanced.md#local-logs)了解日志位置和轮转。
- 参见[远程连接](remote-access.md)了解手机和其他计算机的连接方式。