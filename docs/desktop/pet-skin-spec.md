# 桌面宠物皮肤协议

本文档定义了 qwen-audio-agent 所使用的桌面宠物包。它以 Codex Pet 图集作为兼容性基线，并为生成皮肤添加了可选的 `animations.frames/fps` 元数据，这些皮肤的动作使用可变数量的帧。

`animations` 是 qwen-audio-agent 的扩展，并非官方 Codex Pet 清单字段。未包含该字段的社区 Codex Pet 包将继续使用固定图集规则。

## 包结构

```text
<皮肤-id>/
├── pet.json
└── spritesheet.webp
```

- v1：1536×1872，8 列 × 9 行，每格 192×208。
- v2：1536×2288，8 列 × 11 行。其前 9 行与 v1 一致；最后 2 行包含 16 个朝向。
- 帧索引按行优先顺序从零开始：`行 × 8 + 列`。

## 九个标准动作

生产者应仅使用这些动作名称。一个动作按播放顺序列出其帧——通常为其分配行中的 1–8 帧（工作表总数上限为 256 帧）。

| 行 | 动作 | 含义 | 默认帧 |
| ---: | --- | --- | --- |
| 0 | `idle` | 待机 | 0–5 |
| 1 | `running-right` | 向右跑 | 8–15 |
| 2 | `running-left` | 向左跑 | 16–23 |
| 3 | `waving` | 挥手 | 24–27 |
| 4 | `jumping` | 跳跃 | 32–36 |
| 5 | `failed` | 失败 | 40–47 |
| 6 | `waiting` | 等待 | 48–53 |
| 7 | `running` | 跑步 | 56–61 |
| 8 | `review` | 审查 | 64–69 |

## pet.json

```json
{
  "id": "example-pet",
  "displayName": "Example Pet",
  "description": "可选描述",
  "spriteVersionNumber": 1,
  "spritesheetPath": "spritesheet.webp",
  "animations": {
    "idle": {
      "frames": [0, 1, 2, 3],
      "fps": 3
    },
    "waving": {
      "frames": [24, 25, 26, 27],
      "fps": 8
    }
  }
}
```

基础字段：

- `id`：必填的唯一皮肤标识符。
- `displayName`：推荐的 UI 标签。
- `description`：可选。
- `spriteVersionNumber`：可选，默认为 v1；v2 必须设置为 `2`。
- `spritesheetPath`：可选，默认为 `spritesheet.webp`。
- `animations`：可选的 qwen-audio-agent 动画扩展。

每个 `animations` 条目仅包含：

- `frames`：必填的全局帧索引非空数组。索引必须在边界内，并应保持在动作的标准行内。
- `fps`：可选的播放速率，大于 0 且不大于 60；默认为 8。

皮肤不拥有动画生命周期。`loop` 和 `fallback` 不属于本协议的一部分。包含这些字段的旧版包仍可导入，但 qwen-audio-agent 会忽略其含义。皮肤消费者决定动作运行多长时间以及后续跟随哪个动作。

## 默认值与兼容性

- 无 `animations` 时，使用 Codex Pet 固定行、有效帧数和默认时序。
- 有 `animations` 时，声明的动作使用 `frames/fps`；未声明的动作保留其默认值。
- 原生 Codex 客户端可能忽略 `animations`，因此该扩展仅保证在 qwen-audio-agent 中精确播放。

## 生产者检查清单

- 图集大小、网格和透明度正确。
- 仅使用九个标准动作名称。
- 每个 `frames` 条目都保持在其分配的动作行内。
- `fps` 与预期动作匹配。
- 不要输出 `loop` 或 `fallback`。
- `idle` 描绘自然的待机动作而非睡眠；`running` 描绘跑步而非编码。

参见完整的 [Firefly pet.json 示例](https://github.com/QwenAudio/qwen-audio-agent/blob/main/docs/desktop/examples/firefly.pet.json)。