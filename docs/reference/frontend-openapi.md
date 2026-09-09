# 前端 OpenAPI 工具适配器

前端 OpenAPI 适配器将选定的 REST 操作连接到聊天机器人，而无需将其与实时提供商或后端 Agent 耦合。它使用与前端 MCP 客户端相同的动态工具来源和执行限制。

OpenAPI 文档描述了 API。独立的 qwen-audio-agent 策略决定哪些 `operationId` 值对模型可见；没有任何操作会自动启用。

## 配置

将 `QWEN_AUDIO_FRONTEND_OPENAPI_CONFIG` 设置为带版本号的 JSON 文件。OpenAPI 文档可以使用 JSON 或 YAML 格式，并相对于此配置文件进行解析：

```dotenv
QWEN_AUDIO_FRONTEND_OPENAPI_CONFIG=/absolute/path/to/frontend-openapi.json
WEATHER_AUTHORIZATION=Bearer replace-me
```

```json
{
  "version": 1,
  "apis": {
    "weather": {
      "enabled": true,
      "document": "./weather.openapi.yaml",
      "baseUrl": "https://weather.example.com/v1",
      "headers": {
        "authorization": "${WEATHER_AUTHORIZATION}"
      },
      "operations": {
        "getWeather": {
          "enabled": true,
          "description": "读取单个城市的当前天气。"
        },
        "createAlert": {
          "enabled": true,
          "description": "创建天气警报。"
        }
      }
    }
  }
}
```

模型可见的名称是稳定的：`openapi__<api>__<operationId>`。设置 `baseUrl` 后，将覆盖文档中的第一个 `servers` URL。

## 支持的边界

- 存储在本地 JSON 或 YAML 文件中的 OpenAPI 3.0 和 3.1 文档。
- 明确启用且带有 `operationId` 的操作。
- 路径和查询参数，以及 `application/json` 请求体。
- 本地 `$ref` 值。外部和递归引用将安全失败。
- 固定的请求头，使用精确的 `${VARIABLE}` 环境变量引用来表示机密值。
- `operations` 是显式的允许列表。启用的操作在当前对话轮次中内联执行。
- API 服务必须自行执行任何所需的确认、授权或业务安全检查。
- 远程 API 要求使用 HTTPS。仅在不带请求头的情况下允许回环 HTTP。不跟随重定向。
- Schema、调用、时间和结果均受限制。API 响应是不可信数据，不能覆盖系统或用户指令。

请求头和 Cookie 参数、非 JSON 请求体、远程 OpenAPI 文档以及未记录操作的自动暴露，在首个版本中均有意不支持。更改配置或文档后，请重启 Gateway。