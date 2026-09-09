# 扩展 qwen-audio-agent

本节面向希望通过现有扩展接口集成客户端、语音服务、后端 Agent 或知识系统的开发者。
若要配置内置功能，请从[配置](configuration.md)和[快速入门](getting-started/quickstart.md)开始。

## 前端工具：MCP、OpenAPI、配置文件

无需改动语音路径即可添加聊天机器人工具：通过前端 MCP 客户端连接 MCP 服务器，从 OpenAPI 3.x 文档中暴露选定的 REST 操作，或将角色设定与工具配置打包为带版本的前端配置文件。

→ [前端 MCP 客户端](reference/frontend-mcp.md) ·
[前端 OpenAPI 适配器](reference/frontend-openapi.md) ·
[前端配置文件](reference/frontend-profile.md)

## 语音前端：自定义实时提供商

通过实现提供商契约并在提供商注册表中注册，将实时语音模型替换为其他云服务或自建技术栈。

→ [自定义提供商](voice-frontends/custom-provider.md)

## 知识：检索提供商

Gateway 在一个小型 Provider 接口背后提供了基础知识库。可直接使用，或连接您已在运行的知识系统。

→ [知识检索提供商](reference/knowledge.md)

[LightRAG 集成示例](scenarios/lightrag.md)展示了如何连接一个完整的、独立部署的知识系统，同时将其模型、索引和数据保留在 LightRAG 的控制之下。

## 后端：连接新 Agent

四条路径可将后端置于协议无关的 `BackendPort` 之后：零代码通用 ACP 入口、远程 A2A Agent、通过 Backend Adapter SDK 实现的自定义适配器，或支持一键安装的一等后端。

→ [连接新后端](backends/extend.md) ·
[Backend Adapter SDK](reference/backend-adapter-sdk.md) ·
[A2A 后端适配器](reference/a2a-backend-adapter.md)

## 角色设定与记忆

默认助手名称、个性及表达风格位于 `ASSISTANT.md` 中；输出语音需单独配置。
默认 Markdown Provider 将用户偏好和持久化事实存储在 `USER.md` / `MEMORY.md` 中；可配置可选的 VoiceMem 连接器，或将 Provider 替换为其他记忆引擎，而无需更改语音运行时。

→ [助手配置与用户偏好](reference/personalization.md) ·
[记忆 Provider](reference/memory-provider.md)

VoiceMem 安装与配置示例：
[`examples/voicemem`](https://github.com/QwenAudio/qwen-audio-agent/tree/main/examples/voicemem)。

## 客户端：自行构建

Gateway 通过单一 WebSocket 传输类型化事件。可基于客户端协议构建自定义客户端，或通过稳定性契约将助手嵌入宿主页面——桌面 orb、TUI 和 WebUI 使用的正是同一通道。
[`examples/custom-conversation-client/`](https://github.com/QwenAudio/qwen-audio-agent/tree/main/examples/custom-conversation-client)
是一个极简的起点。

→ [Gateway 客户端协议](gateway-protocol.md) ·
[Gateway 契约](contract.md)

## 桌面外观

桌面 orb 可渲染可替换的宠物皮肤：一个 `pet.json` 清单文件加一张精灵表。

→ [宠物皮肤规范](desktop/pet-skin-spec.md)