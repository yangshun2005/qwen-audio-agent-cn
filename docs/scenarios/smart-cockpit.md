# 智能座舱

智能座舱是一个可运行的 qwen-audio-agent 场景示例。用户可以通过自然语音控制车辆、规划路线、播放音乐、查询天气、下达闪购订单以及运行自定义工作流，同时座舱界面会实时反映车辆与任务状态。

## 演示

通过自然语音启动车辆控制和导航任务，展示前台实时对话、后台 Agent 执行与座舱界面状态如何协同工作。

<video controls preload="metadata" style="width: 100%; border-radius: 12px;">
  <source src="https://github.com/user-attachments/assets/0136b6ec-2ff8-49ba-8f07-55e7006d2e7d" type="video/mp4">
</video>

## 核心特性

- 持续对话、自然打断、多轮上下文，以及运行时语音和角色切换。
- 基于 MCP 的车辆控制、导航、音乐、天气、闪购和自定义工作流工具。
- 前台 Realtime 快速通道用于低延迟操作，后台 Agent 用于闪购和自定义工作流任务。
- 通过 A2A 1.0 连接的可替换后台 Agent，同时提供 ACP 和自定义适配器作为备选方案。
- 场景自有的 HTTP/SSE 通道，用于车辆、路线、音乐和订单状态。

## 架构

![智能座舱框架架构](https://raw.githubusercontent.com/QwenAudio/qwen-audio-agent/main/examples/smart-cockpit/docs/framework-architecture.svg)

qwen-audio-agent 的基础边界是前台对话加后台执行。座舱客户端和 Gateway 构成前台，座舱 Agent 处理后台任务，Service 提供场景状态、业务规则和工具执行环境。

| 组件 | 示例实现 | 主要接口 |
|---|---|---|
| `client/` | React 座舱界面 + Browser Audio | GCP 7.0 / Gateway Client SDK |
| `gateway/` | qwen-audio-agent Gateway + 前台 Realtime Agent | GCP / MCP / BackendPort |
| `agent/` | Qwen3.8-Flash 后台 Agent | A2A 1.0 / MCP |
| `service/` | 座舱状态、规则、工具和外部集成 | HTTP/SSE / MCP |

完整的边界和数据流说明请参阅
[`examples/smart-cockpit/docs/architecture.md`](https://github.com/QwenAudio/qwen-audio-agent/blob/main/examples/smart-cockpit/docs/architecture.md)。

## 工具调用

座舱 Service 提供覆盖六个场景领域的 38 个 MCP 工具：

| 领域 | 数量 | 主要能力 |
|---|---:|---|
| `vehicle` | 11 | 位置与状态、空调、车窗、灯光、充电及其他控制。 |
| `navigation` | 12 | 地点搜索、路线规划、途经点、收藏夹和路线偏好。 |
| `music` | 10 | 搜索、播放、上一首/下一首、音量、媒体源和收藏。 |
| `weather` | 1 | 城市天气查询。 |
| `flashbuy` | 1 | 闪购商品搜索与下单演示。 |
| `custom-skills` | 3 | 列出、创建和加载用户自定义工作流。 |

默认情况下，车辆、导航、音乐和天气使用前台 Realtime 快速通道，而闪购和自定义技能通过后台 Agent 运行。场景开发者可以在 `service/tools/surface-routing.json` 中更改此路由配置。

## 运行示例

```bash
cp examples/smart-cockpit/.env.example examples/smart-cockpit/.env.local
# 在 .env.local 中设置 DASHSCOPE_API_KEY；地图密钥为可选项。
npm run example:smart-cockpit:install
npm run example:smart-cockpit
```

打开 `http://localhost:5173`。该命令会同时启动 service、agent、gateway 和 client。

## 基准测试

座舱基准测试使用相同的工具、提示词、确定性座舱状态和评分器，对比文本模型与 Realtime 模型的工具调用能力。测试衡量工具选择、参数、执行路径路由和最终状态。

- 短套件：覆盖车辆、导航、音乐和天气的 86 个用例。
- 长上下文套件：10 个混合领域对话，共 500 轮，包含 250 次预期工具调用和 250 轮无工具对话。
- 运行器：Gold Replay、文本模型、受控 Realtime 模型以及完整的 Realtime 语音路径。

```bash
node examples/smart-cockpit/bench/runner/run-gold.mjs
node examples/smart-cockpit/bench/runner/run-text.mjs
node examples/smart-cockpit/bench/runner/run-realtime.mjs
node examples/smart-cockpit/bench/runner/run-voice.mjs
```

最新的结果、数据集和评分详情请参阅
[`examples/smart-cockpit/bench/README.md`](https://github.com/QwenAudio/qwen-audio-agent/blob/main/examples/smart-cockpit/bench/README.md)。

## 替换与扩展

| 目标 | 修改位置 |
|---|---|
| 替换座舱界面或音频 I/O | `client/` |
| 替换后台 Agent | 修改 `COCKPIT_AGENT_CARD_URL` 或替换 `agent/` |
| 添加场景工具、状态或外部服务 | `service/` 和 `service/tools/` |
| 更改前台角色或后台任务语义 | `gateway/` |

完整的迁移路径请参阅
[组件替换指南](https://github.com/QwenAudio/qwen-audio-agent/blob/main/examples/smart-cockpit/docs/replacing-components.md)。

## 作者与致谢

- [Zhang Binbin](https://github.com/robin1001)：设计并扩展了座舱领域能力，包括导航、车辆控制和音乐工具、前台/后台路由以及评测用例。
- [Li Xu](https://github.com/x-lixu)：在 qwen-audio-agent 上设计并实现了该场景，包括客户端、Gateway 和后台 Agent 的边界划分、实时语音路径以及 A2A/MCP 集成。
- [Peng Zhendong](https://github.com/pengzhendong)：提供了原始座舱界面和视觉资源，包括整体界面设计、交互模式及相关视觉素材。