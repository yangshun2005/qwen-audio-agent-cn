# LightRAG 知识库

qwen-audio-agent 可以使用独立运行的 [LightRAG](https://github.com/HKUDS/LightRAG) 实例作为前端知识库。LightRAG 负责文档解析、嵌入、索引和检索；网关仅通过 `KnowledgeProvider` 边界调用它。

## 适用场景

- 您需要比内置关键词库更丰富的语义和图形检索。
- 您已经在使用 LightRAG，并希望语音前端复用其文档和模型配置。
- 您希望知识系统能够独立于 Realtime 和客户端进行演进或替换。

## 准备 LightRAG

LightRAG 需要独立配置 LLM 和嵌入模型。两者都可以在本地运行，或通过兼容 OpenAI 的服务运行。使用 `uv` 安装服务器：

```bash
uv tool install "lightrag-hku[api]"
```

在 LightRAG 工作目录中创建 `.env` 文件，大致结构如下：

```dotenv
LLM_BINDING=openai
LLM_BINDING_HOST=https://your-openai-compatible-service.example/v1
LLM_BINDING_API_KEY=your_llm_key
LLM_MODEL=your_llm_model

EMBEDDING_BINDING=openai
EMBEDDING_BINDING_HOST=https://your-openai-compatible-service.example/v1
EMBEDDING_BINDING_API_KEY=your_embedding_key
EMBEDDING_MODEL=your_embedding_model
EMBEDDING_DIM=1024

LIGHTRAG_API_KEY=your_lightrag_api_key
```

嵌入维度必须与模型匹配。完整的配置请参考 [LightRAG 官方文档](https://github.com/HKUDS/LightRAG/blob/main/docs/LightRAG-API-Server.md)。启动一个仅限本机访问的服务：

```bash
lightrag-server --host 127.0.0.1 --port 9621
```

## 运行集成示例

从 qwen-audio-agent 源码检出目录执行：

```bash
cp examples/lightrag/.env.example examples/lightrag/.env.local
```

设置语音前端和 LightRAG 的连接参数：

```dotenv
DASHSCOPE_API_KEY=your_dashscope_api_key
LIGHTRAG_URL=http://127.0.0.1:9621
LIGHTRAG_API_KEY=your_lightrag_api_key
LIGHTRAG_WORKSPACE=
LIGHTRAG_QUERY_MODE=mix
```

启动示例：

```bash
node --env-file=examples/lightrag/.env.local examples/lightrag/gateway.mjs
```

打开 `http://127.0.0.1:3101`，从知识库面板导入文件，等待索引完成后，即可通过语音或文本进行查询。此独立示例使用仅前端模式，不会启动后端 Agent。

`DASHSCOPE_API_KEY` 仅属于语音前端。LightRAG 在其自身进程中维护其 LLM 和嵌入配置。qwen-audio-agent 不会安装、启动或修改 LightRAG。

## 数据与任务边界

- 网关从 `/query/data` 获取原始文本块；语音前端生成答案。
- LightRAG 的 `track_id` 值、图对象和 HTTP 响应不会到达客户端或模型。
- 上传和删除在 LightRAG 内部是异步的，但网关仅在真正完成后才报告成功。
- 取消网关的摄取任务会停止等待，而不会调用可能影响其他文档的全局流水线取消操作。
- 用户仍需对 LightRAG 的文档、索引、凭据和工作区存储负责。

完整的代码和配置参考请参见 [`examples/lightrag`](https://github.com/QwenAudio/qwen-audio-agent/tree/main/examples/lightrag)。

## 作者与致谢

- 感谢 [LightRAG 项目及其贡献者](https://github.com/HKUDS/LightRAG) 开源了文档处理、知识图谱和检索能力。
- [Li Xu](https://github.com/x-lixu) 设计了可替换的 `KnowledgeProvider` 边界并实现了此集成示例。