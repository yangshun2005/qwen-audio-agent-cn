# 安装与更新

## 选择版本

- **日常使用**：从[最新 GitHub Release](https://github.com/QwenAudio/qwen-audio-agent/releases/latest) 选择桌面安装程序，或使用最新的稳定版 npm 包。
- **测试新功能**：使用 GitHub `main` 分支。本手册以 `main` 分支为准；并非所有记录的功能都已包含在稳定版包中。
- 移动端目前使用[开发构建版本](mobile.md#get-development-builds)。如需测试，建议使用同一修订版本中的 Gateway 和客户端构建。

## 桌面安装

桌面安装程序包含 Gateway 及其运行时。**仅运行桌面版时，无需安装 Node.js 或 npm。** 后端 Agent 的安装、认证和配置是独立的；请参阅[后端 Agents](../backends/overview.md)。

从[发布页面](https://github.com/QwenAudio/qwen-audio-agent/releases/latest)下载：

| 平台 | 安装方式 |
| --- | --- |
| macOS | 打开 `.dmg` 文件，将 Qwen Audio Agent 拖入“应用程序”文件夹，然后打开应用。 |
| Windows | 运行 `.exe` 安装程序并按照安装向导操作。 |

继续参阅[桌面版指南](../desktop/overview.md)。Linux 用户可以通过[源码构建](../desktop/overview.md#installation)进行安装。

## 一行命令安装

以下要求适用于 **CLI / 源码安装**：Node.js ^22.22.2、^24.15.0 或 >=26.0.0，以及 npm 10+。源码仓库包含 `.nvmrc` 和 `.node-version` 文件；如果使用 nvm，请运行 `nvm use`。

安装稳定版：

```bash
npm install -g qwen-audio-agent
```

从 GitHub 安装最新开发代码：

```bash
npm install -g git+https://github.com/QwenAudio/qwen-audio-agent.git
```

## 从源码安装

```bash
git clone https://github.com/QwenAudio/qwen-audio-agent.git
cd qwen-audio-agent
npm install
npm run install:global
```

## 升级

桌面版可以在“设置”中检查更新，也可以下载新的安装程序。更新稳定版 CLI：

```bash
npm install -g qwen-audio-agent@latest
```

对于 GitHub 开发版安装，请重新运行上述 GitHub 安装命令。更新后请重启你实际使用的 Gateway：
[前台运行、后台服务和桌面版的差异](../operations/gateway.md#applying-configuration-changes)。

## 验证安装

```bash
qwenaudio --version
qwenaudio config
```

第一条命令显示已安装的版本；第二条命令显示配置路径，并在配置缺失时创建模板。这两条命令均不验证 API 凭据或模型连接。请配置应用并使用[快速入门](quickstart.md)完成一次对话。

开发构建版本提供 `qwenaudio doctor` 命令用于只读诊断。`qwenaudio setup` 检查后端安装和集成组件，但不检查认证或配额。请参阅[故障排查](../operations/troubleshooting.md)。

## 配置文件位置

CLI 和桌面版默认共享 `~/.config/qwaudio/config.env`，但各自维护独立的运行时状态。有关覆盖和存储详情，请参阅[配置与数据目录](../configuration.md#configuration-and-data-directories)。

## 获取 DashScope API 密钥

阿里云百炼（Model Studio）会自动为符合条件的新用户提供[新用户免费额度](https://help.aliyun.com/zh/model-studio/new-free-quota)，通常无需单独领取。请参阅官方[免费额度指南](https://help.aliyun.com/zh/model-studio/new-free-quota)了解当前的资格条件、地域、有效期和用尽即停规则。你也可以打开[模型用量页面](https://help.aliyun.com/zh/model-studio/model-usage-statistics)查看剩余额度。额度和计费规则可能因地域、模型和账户状态而异；请以百炼官方页面为准获取当前规则。

1. 在百炼控制台打开 [API Key 页面](https://bailian.console.aliyun.com/?tab=model#/api-key)，登录你的账户，然后点击 **创建 API Key**。
2. 复制生成的 Key，稍后填入 `config.env` 中。请勿公开分享或提交你的 API Key。

有关详细说明，请参阅[获取并配置 API Key](https://help.aliyun.com/zh/model-studio/get-api-key)。当免费额度用尽后，已认证账户可以继续使用按量付费计费方式，因此请在适当时启用官方的用尽即停选项。