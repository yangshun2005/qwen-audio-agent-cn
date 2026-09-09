# 个性化与记忆

在对话中设置长期称呼和沟通偏好，无需编辑源代码：

- “从现在起叫我船长。”
- “从现在起回复更简洁些。”
- “记住我目前住在杭州。”
- “忘记你刚才记录的地址。”

称呼和沟通风格属于偏好；地址和项目事实应归入长期记忆。临时请求仅适用于当前轮次，不应自动成为持久设置。编辑 `ASSISTANT.md` 可修改默认角色；对话中的变更会更新用户偏好或记忆，而非应用程序的默认角色。

## 默认实现

在默认配置下，Gateway 使用其内置的 Markdown 提供程序。其默认文件如下所列；有关覆盖配置，请参阅[目录设置](../configuration.md#configuration-and-data-directories)：

| 文件 | 描述 |
| --- | --- |
| `ASSISTANT.md` | 实例级默认角色：身份、个性、关系立场和表达风格 |
| `data/USER.md` | 当前用户的长期个性化覆盖层 |
| `data/MEMORY.md` | 关于用户的持久事实和决策 |
| `<state-dir>/memory-audit.jsonl` | 自动记忆补丁、跳过和失败的诊断日志 |

这些文件保留在本地，绝不会提交到源代码仓库。`USER.md` 和 `MEMORY.md` 是默认提供程序的物理表示，而非对其他提供程序的强制要求。

## 助手档案

首次启动时，打包的 `config/frontend-agent/ASSISTANT.md` 模板会被复制到本地 `ASSISTANT.md`；升级时绝不会覆盖它。编辑本地文件可更改整个助手实例的默认名称、个性、关系立场和表达风格。更改将在下一次语音会话中生效。你也可以将 `QWEN_AUDIO_AGENT_ASSISTANT_PROFILE_PATH` 指向另一个文件。

`ASSISTANT.md` 既不是对话记忆，也不是运行时策略。助手绝不会通过 `memory` 工具更改它。关于工具、权限、安全、记忆、任务路由或能力的声明不能覆盖 `PROMPT.md`。

## 用户偏好

`USER.md` 是当前用户在默认角色上的长期个性化覆盖层，而非第二个助手角色或通用事实存储。它可以包含助手如何称呼用户、该用户如何称呼助手，以及明确要求的语言、回复风格和默认行为。它仅在用户明确设置或纠正时才会更改。会话结束时的对账可能恢复此类明确指令，但绝不会推断出指令。

按范围分类，而非按语法主语分类。“助手的默认名称是 Qwen Audio”属于 `ASSISTANT.md`；当当前用户说“从现在起叫你自己 Skiff”时，Skiff 是该用户的覆盖项，属于 `USER.md`。同样，“默认继续项目 A”属于 `USER.md`，而“项目 A 使用 React”是应归入 `MEMORY.md` 的事实。它是普通 Markdown。工具写入会立即生效；直接编辑将在下一次语音会话中生效。若要存储在其他位置，请设置 `QWEN_AUDIO_AGENT_USER_MODEL_PATH`（旧名称 `QWEN_AUDIO_AGENT_USER_PROFILE_PATH` 仍然可用）。

请勿在此文件中存储密码、API 密钥、验证码或令牌。

来自 `frontend-memory.json` 的旧版 `profile`、`rules` 和 `user` 记录会在首次启动时迁移到 `USER.md` 中。

## 偏好自动更新（仅限默认提供程序，默认关闭）

设置 `QWEN_AUDIO_PREFERENCE_LEARNING=on` 可在会话后观察少量特征，并仅在跨会话确认后将其写入 `USER.md` 的已观察部分。该功能默认关闭，并会增加文本模型调用。显式偏好始终覆盖推断结果；你可以检查或删除已观察部分。

### 提升门控

有关计数和过期时间，请参阅[偏好学习](preference-learning.md#promotion-gate)。

### 四项结构保护

有关证据检查和诊断信息，请参阅[偏好学习](preference-learning.md#four-structural-guards)。

## 替换记忆实现

Markdown 记忆是默认实现；[VoiceMem](../scenarios/voicemem.md) 是可选的替代方案。开发者接口和四层上下文在[记忆提供程序](memory-provider.md)中有文档说明。

## 数据与隐私

文件存储在 Gateway 主机上。使用云端模型时，相关偏好和记忆仍会作为上下文提供；处理并非完全离线。请勿存储密码、密钥或验证码。有关自动对账、可选模型设置和删除，请参阅[记忆](memory.md)。

## 继续阅读

- [记忆](memory.md)：自动对账、会话回忆和可选连接器。