# 网络搜索

如需获取最新新闻、天气或网络来源信息，可让助手“搜索……”。它能使用可用的搜索工具并根据结果作答。聊天、搜索和后台工作是相互独立的功能；搜索本身不需要后台代理。

## 默认搜索与自定义服务

前端 `web_search` 工具会返回可验证的来源链接，不会产生后台代理工作，也不会调用其他文本模型。在未进行显式配置的情况下，它使用一个无需密钥的小型 360 搜索适配器，该适配器解析一个公开的搜索结果页面，且在中国大陆可访问。此基础回退方案为实验性质：可能被屏蔽、返回较弱的结果，或因上游变更而失效。如需可靠的搜索，请配置自己的服务提供商。

启用 Model Studio 的 Web Search MCP 服务后，需显式选择其内置预设；随后它将复用 `DASHSCOPE_API_KEY`：

```dotenv
QWEN_AUDIO_WEB_SEARCH_PROVIDER=bailian
```

同一提供商无关的适配器可连接至其他兼容的 MCP 搜索服务。自定义端点必须显式提供自己的凭据：

```dotenv
QWEN_AUDIO_WEB_SEARCH_PROVIDER=mcp
QWEN_AUDIO_WEB_SEARCH_MCP_URL=https://example.com/mcp
QWEN_AUDIO_WEB_SEARCH_MCP_TOKEN=your-token
QWEN_AUDIO_WEB_SEARCH_MCP_TOOL=web_search
```

设置 `QWEN_AUDIO_WEB_SEARCH_PROVIDER=none` 可禁用前端网络搜索。

## 结果与引用

WebUI 和 TUI 会在答案下方显示来源链接。来源可支持答案，但不保证准确性或时效性；重要信息请查看原始页面。打开搜索结果时也可能使用 `fetch_url`。

聚焦式研究和问答可结合搜索、页面读取和知识检索；多次工具调用本身并不需要后台工作。对用户环境的操作、持续执行和交付物创建将根据后台声明的能力进行路由。

如需更换搜索服务，建议配置 Web Search Provider，使模型保持单一的 `web_search` 入口点。避免通过通用 MCP 配置再次启用相同的搜索能力；Gateway 不会根据名称或描述猜测重叠或合并工具。

有关搜索之外的工具，请参阅 [前端 MCP 配置](../reference/frontend-mcp.md)。
更改设置后，请[针对你的运行模式重启 Gateway](../operations/gateway.md#applying-configuration-changes)。