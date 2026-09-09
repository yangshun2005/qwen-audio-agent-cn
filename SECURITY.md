# 安全政策

## 支持范围

安全修复优先提供给最新发布版本。尚未发布的 main 分支问题会在下一个版本中修复。

## 报告安全问题

请不要公开提交包含利用细节、用户数据或密钥的 Issue。优先使用 GitHub 仓库的
**Security → Report a vulnerability** 私密报告功能：

https://github.com/QwenAudio/qwen-audio-agent/security/advisories/new

报告请包含受影响版本、复现条件、潜在影响和可行的缓解方式。维护者确认并准备好
修复前，请避免公开漏洞细节。

## 安全边界

- Gateway 默认仅供本机使用。
- 远程访问必须通过带认证的 HTTPS 反向代理，并显式配置可信 Origin。
- `QWEN_AUDIO_AGENT_AUTH_SECRET` 是身份签名密钥，不是远程访问密码。
- API Key、用户档案、记忆和任务状态必须留在用户配置目录，不得提交到仓库。
- 从不受信任来源获得的 Agent 输出、Markdown、URL 和媒体都应视为不可信数据。

## 临时构建链例外

正式发布检查会同时审计生产依赖和开发/构建依赖。目前
`electron-builder 26.15.7` 的间接依赖仍受
`GHSA-mh99-v99m-4gvg` 影响。该依赖只在维护者使用仓库内受控路径构建桌面安装包时
运行，不会进入 Gateway、TUI 或 WebUI 的用户运行时。项目对这一单一 advisory
设置了截至 2026-08-15 的临时例外；出现兼容的稳定版修复后必须升级并删除例外，
到期后发布检查会自动失败。任何其他 high 或 critical 问题都会立即阻止发布。