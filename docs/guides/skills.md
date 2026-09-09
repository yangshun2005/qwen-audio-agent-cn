# 后端技能

后端代理执行实际任务，因此标准 Agent 技能（开放格式的 `SKILL.md` 文件夹）会安装到后端中。`qwenaudio skill` 是社区标准 [skills.sh](https://skills.sh) 安装器（`npx skills`）的品牌化入口点：每个命令都是 1:1 透传，仅有一处新增——安装目标为本机上实际存在的后端（通过 CLI 检测）以及当前配置的后端，而非依赖 skills.sh 自身的代理检测。

```bash
qwenaudio skill install <source> --skill <name>   # 安装到每个后端
qwenaudio skill install <source> --list           # 列出源中的技能
qwenaudio skill list                              # 列出已安装的技能
qwenaudio skill remove <name>                     # 移除技能
qwenaudio skill update                            # 更新已安装的技能
```

支持的源与 skills.sh 所支持的一致：

| 源格式 | 示例 |
| --- | --- |
| GitHub 简写 | `qwenaudio skill install vercel-labs/agent-skills --skill web-design-guidelines` |
| 仓库 URL（GitHub/GitLab/任意 git） | `qwenaudio skill install https://github.com/alirezarezvani/claude-skills --skill skill-security-auditor` |
| Tree URL（技能子目录） | `qwenaudio skill install https://github.com/o/r/tree/main/skills/x --skill x` |
| Hub 技能页面 URL | `qwenaudio skill install https://clawhub.ai/thcjp/skills/excel-formula-tool-free --skill excel-formula-tool-free` |
| 本地目录 | `qwenaudio skill install ./my-skill --skill my-skill` |

对于多技能仓库，`--skill` 为必填项（可重复使用以安装多个技能）；可先运行 `--list` 查看源中提供的内容。一次性安装整个大型目录是有意不支持的——每个技能描述都会被注入到后端的系统提示中。

当后端声明了 skills.sh 安装器时，技能会安装到后端 CLI 自身的用户级目录中（`~/.claude/skills/`、`~/.qwen/skills/`、`~/.openclaw/skills/`、`~/.agents/skills/` 等），因此直接使用这些 CLI 时技能同样可用，且桌面应用与 CLI 共享相同的技能。MiniMax Code 管理其自身的 Skill/Plugin 存储；`qwenaudio skill` 不会写入该私有存储。

当切换到——或新安装——一个缺少先前已安装技能的后端时，网关会在启动时同步补齐：首先对照 skills.sh 锁文件（`~/.agents/.skill-lock.json`）进行毫秒级的本地检查，仅当确实缺少某些内容时，才会在后端进程启动前执行一次性的 skills.sh 运行（耗时数秒），从而确保后端在首次扫描时始终能看到完整的技能集。失败（例如离线）会被记录日志，且绝不会阻塞语音网关。

固定的 skills.sh 版本可通过 `QWEN_AUDIO_AGENT_SKILLS_CLI_PACKAGE` 覆盖（例如 `skills@latest`）。如果新添加的后端尚未被 skills.sh 支持，请向其 `src/agents.ts` 贡献代理定义——这是官方扩展点。

### 技能何时生效

文件会立即同步，但每个后端按自身节奏发现新技能：

| 后端 | 发现机制 | 新技能可见时间 |
| --- | --- | --- |
| Claude Code、Qwen Code、Hermes、DeepSeek | 热重载（监听器或按需读取） | 立即可见，无需操作 |
| Qoder | 会话启动时；在原生会话中执行 `/skills reload` | 下一个后端会话 |
| OpenCode、OpenClaw、Kimi Code、CodeBuddy、Codex | 进程或会话启动时的快照 | 后端进程重启后 |

如果新安装的技能未被发现，请[针对你的运行模式重启网关](../operations/gateway.md#applying-configuration-changes)，以便后端重新加载其技能。

### 共享后端工作区

所有后端现在共享一个默认工作目录 `<data-dir>/workspace`，因此切换后端可无缝延续相同的文件。按后端单独设置的覆盖项（例如 `OPENCODE_WORKSPACE`）在显式设置时仍可隔离特定后端。