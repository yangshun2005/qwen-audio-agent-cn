# 移动端

移动端是 WebUI 的原生呈现形式。网关和后端代理持续在您的计算机上运行；手机则负责麦克风、扬声器、文本/图像输入以及界面显示。它使用与桌面端、WebUI 和 TUI 相同的网关客户端协议，不引入实时提供商或后端协议内部实现。

> 目前提供 iOS 和 Android 开发构建版本。应用商店分发暂不可用。

## 获取开发构建版本

打开 [GitHub Actions → Mobile](https://github.com/QwenAudio/qwen-audio-agent/actions/workflows/mobile.yml?query=branch%3Amain)，选择一个成功的 `main` 分支构建，然后在 Artifacts 下下载 `mobile-android-debug-apk`。解压后，将 APK 传输到 Android 手机并安装；如果系统提示，请允许此安装源。Actions 下载通常需要登录 GitHub。过期的构建产物需要新的构建或使用下面的源码构建步骤。

`mobile-ios-simulator-app` 适用于 **iOS 模拟器**，不能直接安装到 iPhone 上。在实体 iPhone 上测试需要 Xcode 和开发签名。目前尚无应用商店发布版本。配对步骤针对开发构建版本；建议使用同一修订版本的 App 和网关构建。

## 连接

1. 在计算机和手机上安装官方 Tailscale，登录到同一个 tailnet，然后在计算机上启动网关：

   ```bash
   qwenaudio gateway --tailnet
   ```

   服务器也可以使用受信任的 HTTPS 反向代理。当该代理运行在另一台机器上时，使用 `--lan` 启动网关。
2. 在计算机的另一个终端中生成连接码：

   ```bash
   qwenaudio gateway pair
   ```

   如果使用反向代理，请运行 `qwenaudio gateway pair --endpoint https://voice.example.com`。

   在移动端扫描二维码或粘贴连接码。桌面端接受相同的连接码。
3. 首次通话时授予麦克风访问权限。后续启动会自动重新连接。如果另一个客户端处于活动状态，移动端会在接管前进行询问。

连接码包含一个独立的、可撤销的设备凭据，仅在网关主机上显示一次。移动端导入该凭据，并使用相同的 WSS 通道进行身份验证和业务流量传输，无需 HTTPS 配对请求。使用 `qwenaudio gateway devices` 查看设备，使用 `qwenaudio gateway revoke <device-id>` 撤销设备。私有 Tailnet 端点仅在同一个 tailnet 内可访问。对于外部 HTTPS 端点，运维人员负责管理证书、反向代理和防火墙。所有连接方法使用相同的配对和客户端协议。有关实现细节、授权要求和故障排除，请参阅[远程访问安全](../operations/remote-access.md)。

## 开发构建

```bash
npm ci
npm run mobile:sync
npm run mobile:ios
# 或
npm run mobile:android
```

iOS 需要完整的 Xcode。Android 需要 JDK 21 和 Android SDK。`mobile:sync` 在同步 Capacitor 项目之前构建本地 Web 资源。网关端点必须使用 HTTPS；移动端绝不会将设备凭据降级为明文 WebSocket。

GitHub `Mobile` 工作流会保留一个 Android 调试 APK 和一个 iOS 模拟器 App，方便在没有本地原生工具链的情况下进行测试。在实体 iOS 设备上安装仍然需要 Apple 开发签名。