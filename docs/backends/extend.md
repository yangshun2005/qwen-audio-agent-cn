# 添加新后端

集成理念：**基于协议，绝不针对特定产品**。Gateway 通过协议无关的 `BackendPort` 进行通信；它从不接触后端的内部实现。有四种方式可以将后端置于该端口之后，从零代码到一级支持不等。

## 路径 1：通用 ACP（零代码）

在编写任何代码之前，请先检查代理是否已支持 ACP 协议。如果支持，用户只需通过配置即可接入：

```dotenv
AGENT_PROTOCOL=acp
ACP_COMMAND=your-agent --acp
# 可选：转发到代理进程的环境变量名称（逗号分隔）
QWEN_AUDIO_AGENT_ACP_FORWARD_ENV=MY_AGENT_API_KEY
```

对于许多代理来说，这就是完整的集成方式。

## 路径 2：远程 A2A 代理

如果代理支持 Google 的 A2A 协议而非 ACP，可选的 A2A 后端适配器可将其连接到同一个 `BackendPort` —— Agent Card 发现、协议协商、任务、取消和 Artifacts 均由适配器内部的官方 A2A SDK 处理。这是针对自定义 Gateway 启动器的编程扩展；它不会添加 `AGENT_PROTOCOL` 值。

→ [A2A 后端适配器](../reference/a2a-backend-adapter.md)

## 路径 3：自定义 BackendPort 适配器

电话代理、硬件代理、HTTP 服务或任何非 ACP 任务运行时，都可以使用后端适配器 SDK（`qwen-audio-agent/backend-adapter-sdk`）直接实现 `BackendPort`。该 SDK 附带一套共享的一致性测试套件——与内置适配器运行的套件相同——并且 [`examples/backend-adapter/`](https://github.com/QwenAudio/qwen-audio-agent/tree/main/examples/backend-adapter) 是一个最小可用的实现示例。

→ [后端适配器 SDK](../reference/backend-adapter-sdk.md)

## 路径 4：一级 ACP 后端

一级支持意味着：一键安装、能力声明和桌面端引导。它由三个组成部分构成，其中两个由注册表在启动时和测试中强制执行。

### 组成部分 1：目录条目（必需）

`shared/backend/catalog.mjs` 保存静态元数据——身份、存储和引导信息。一个条目描述：

- `id` / `label` —— `AGENT_PROTOCOL` 值和显示名称。
- `setup` —— CLI 的查找方式（`command`、`executableEnvironment`）以及集成形态：`native`（自身支持 ACP）、`bridge`（内置桥接）、`adapter`（外部 ACP 适配器进程）或 `generic`。
- `lifecycle.installation` —— 一键安装步骤（npm 包或平台脚本）；当安装由用户管理时为 `null`。
- `onboarding` —— 用户用于身份验证的命令，以及桌面应用用于检测就绪状态的探测命令。
- `skills` —— **强制声明**：skills.sh 安装器 ID、显式的 `installer: null`（由共享的 `~/.agents/skills/` 约定被动覆盖），或 `skills: null`（无技能约定）。缺少声明将导致注册失败——每个后端都必须做出明确的技能支持决策。
- `supportsFullPermission`、`baseUrlEnvironment`、`supportsExternalService`、`environment` 透传名称/前缀。

### 组成部分 2：代理驱动程序（必需）

`server/src/agent/acp/drivers/<id>.mjs`，以及 `registry.mjs` 中的一行导入语句。驱动程序声明能力契约并构建运行时配置文件：

```js
export const myBackendDriver = {
  id: 'myagent',
  label: 'My Agent',
  capabilities: {
    delegation: true,          // 可以接收委派的异步任务
    permissions: true,         // 显示权限提示
    backendUi: false,          // 拥有自己的 UI 界面
    nativeSessionHistory: true,// 保留自己的会话历史
    externalMcp: true,         // 从自身配置加载 MCP 服务器
    nativeDelegation: false,   // 具有原生子代理机制
    sessionMcp: false,         // 接受按会话的 MCP 注入
    coordinatorMcpInstructions: false, // 将 MCP 指令转发给协调器
  },
  createProfile({ root, directory, model, modelUrl, permissionMode }) {
    return {
      label: this.label,
      acpConnection: processAcpConnection({
        command, args, cwd: directory, env: { /* 后端特定环境变量 */ },
      }),
    }
  },
}
```

全部八个能力标志都是必需的布尔值——注册表会验证该契约，并且 `acp-driver-registry.test.mjs` 会断言每个已声明的后端都具有完整的驱动程序。注册不完整的后端会在启动时明确失败，绝不会在运行时静默出错。

### 组成部分 3：运行时驱动程序（仅在需要时）

`server/src/process/backend-drivers/` 负责进程级行为——托管服务的启动和监管方式。大多数后端在此无需任何配置：注册表会回退到根据目录条目派生的托管进程驱动程序。OpenCode 和 OpenClaw 是仅有的两个具有自定义运行时驱动程序的（外部服务支持、自定义启动规则）。

## 检查清单

1. 选择路径：ACP 代理 → 路径 1 或 4；A2A 代理 → 路径 2；其他情况 → 路径 3。
2. 对于一级后端：在 `shared/backend/catalog.mjs` 中添加目录条目，添加代理驱动程序并注册它，并可选择添加运行时驱动程序以实现自定义进程管理。
3. 运行契约测试——这是准入标准：ACP 驱动程序运行 `node --test server/test/acp-driver-registry.test.mjs`，自定义适配器运行 `node --test server/test/backend-adapter-sdk.test.mjs`。

## 继续阅读

- [后端支持矩阵](overview.md) —— 当前已提供的功能
- [后端配置参考](../configuration/backend.md)