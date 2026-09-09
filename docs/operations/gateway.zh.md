# Gateway 运行与常驻

Gateway 连接语音前台与后台 Agent，并向客户端提供对话接口。您可以选择以下运行方式之一：

| 方式 | 启动 | 退出或停止 |
| --- | --- | --- |
| 终端前台运行 | `qwenaudio` 或 `qwenaudio gateway` | 在原始终端中按 `Ctrl-C`。 |
| 用户后台服务 | `qwenaudio gateway install` 安装并立即启动 | `qwenaudio gateway stop`；如需卸载，请使用 `gateway uninstall`。 |
| 桌面内置 Gateway | 打开桌面应用，由应用负责启动和管理 | 退出应用会停止其自行启动的 Gateway，但不会关闭借用或远程服务。 |

## 修改配置后生效

- **终端运行**：在运行 Gateway 的终端中按 `Ctrl-C`，然后重新执行原始启动命令。
- **后台服务**：执行 `qwenaudio gateway restart`。如果服务尚未安装，此命令将提示“后台服务尚未安装”。
- **桌面版**：在设置页面修改后点击“应用”；如果直接编辑文件，请退出并重新打开应用。
  皮肤、唤醒等客户端设置不应要求重启 Gateway。
- **远程连接**：请修改并重启实际运行的 Gateway；本机配置不会改变远程服务器。

后台服务不会保留仅在某个终端中临时 `export` 的凭据。持久性设置应写入
`qwenaudio config` 所显示的 `config.env`。

## 后台服务命令

```bash
qwenaudio gateway install
qwenaudio gateway status
qwenaudio gateway restart
qwenaudio gateway stop
qwenaudio gateway start
qwenaudio gateway uninstall
```

服务启动时会重新读取配置。`install`、`start` 和 `restart` 会刷新用户命令搜索路径缓存，
以确保通过 Homebrew、npm、uv 或版本管理器安装的 Agent / stdio MCP 命令能够被发现。

## 实例与客户端

同一运行时目录仅允许运行一个 Gateway。默认情况下，CLI、TUI、WebUI 使用 CLI 的实例；
桌面版拥有独立的运行时目录，可以同时启动另一个实例。两者共享配置、记忆和工作区，
但不共享任务、运行锁和日志。具体路径请参阅[配置总览](../configuration.zh.md#配置与数据目录)。

在同一 Gateway 中，每个用户仅允许一个活动客户端；接管连接会断开原有连接。请勿混淆
“多个 Gateway 实例”与“同一 Gateway 的多个客户端”。

## 后台进程的所有权

Gateway 负责关闭由其自行启动的后台进程。复用 Agent 的用户配置，并不等同于连接或关闭用户
已运行的进程。当 OpenClaw 显式配置外部 Gateway 时，仅连接该服务，不负责其生命周期；
详细信息请参阅[OpenClaw 配置](../backends/configuration.zh.md#openclaw)。

## 检查运行情况

- 使用 `qwenaudio gateway status` 查看用户后台服务的状态。
- 使用 `qwenaudio doctor` 检查当前配置和连接；诊断过程不会启动模型或麦克风。
- 日志路径及轮转策略请参阅[本地日志](../configuration/advanced.zh.md#本地日志)。
- 手机或其他电脑的连接方式请参阅[远程连接与配对](remote-access.zh.md)。