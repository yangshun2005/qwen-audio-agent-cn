# 轻量级前端配置文件

前端配置文件（Frontend Profile）是一种本地的、带版本管理的组合清单，通过单一入口选择前端助手角色和外部工具配置。它可以将前端设置作为目录保存或共享，而无需引入新的技能或插件协议。

## 配置

创建一个目录：

```text
research-profile/
├── frontend-profile.json
├── ASSISTANT.md
└── tools/
    ├── mcp.json
    └── openapi.json
```

`frontend-profile.json`：

```json
{
  "version": 1,
  "name": "research",
  "description": "用于研究和源码审查的语音前端",
  "assistant": "./ASSISTANT.md",
  "toolSources": {
    "mcp": "./tools/mcp.json",
    "openapi": "./tools/openapi.json"
  }
}
```

启用它：

```dotenv
QWEN_AUDIO_FRONTEND_PROFILE=/绝对/路径/到/research-profile/frontend-profile.json
```

`assistant`、`toolSources.mcp` 和 `toolSources.openapi` 均为可选字段，但至少需要提供其中一项。引用必须是配置文件目录内现有文件的相对路径。MCP 和 OpenAPI 文件保留其各自的版本化格式和授权策略；配置文件不会复制这些协议。

## 优先级

现有的专项设置具有更高优先级，可以临时覆盖配置文件：

1. `QWEN_AUDIO_AGENT_ASSISTANT_PROFILE_PATH`、`QWEN_AUDIO_FRONTEND_MCP_CONFIG` 和 `QWEN_AUDIO_FRONTEND_OPENAPI_CONFIG`；
2. 前端配置文件中的引用；
3. qwen-audio-agent 默认值。

`/api/health` 中的 `frontendProfile` 仅报告启用状态、名称和描述。它绝不会暴露本地路径。

## 边界

前端配置文件不能更改核心提示词，也不包含用户记忆、实时提供商（Realtime Provider）、后端代理（Agent）、密钥、脚本或可执行代码。密钥仍作为环境引用保留在 MCP/OpenAPI 配置中。未知字段、配置文件目录之外的路径以及缺失文件都会在 Gateway 启动时明确失败。

Web 搜索保持其独立的提供商（Provider）配置。如果没有用户配置，则仅使用简单的内置搜索回退；配置文件不会添加搜索引擎回退链。