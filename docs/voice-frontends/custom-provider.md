# 扩展实时 Provider

产品宿主可以注入自定义的实时 Provider，而无需更改 Gateway 语音会话或后端 Agent 逻辑。

```js
import { createGatewayApplication } from 'qwen-audio-agent/gateway-application'
import {
  createRealtimeProviderRegistry,
} from 'qwen-audio-agent/realtime-provider'
import { privateRealtimeProvider } from './private-realtime-provider.mjs'

const realtimeProviderRegistry = createRealtimeProviderRegistry({
  providers: [privateRealtimeProvider],
  defaultProvider: privateRealtimeProvider.key,
})

createGatewayApplication({
  realtimeProviderRegistry,
  realtimeProvider: privateRealtimeProvider.key,
})
```

扩展边界如下：

- 每个 Provider 都是一个独立的适配器，拥有自己的 URL、认证、模型、会话和错误分类语义。产品差异不应通过改造其他 Provider 来实现。
- `url()`、`headers()` 和 `model()` 可以从宿主拥有的配置闭包中读取服务 URL、令牌和模型。Gateway 不要求产品特定的环境变量。
- `createProtocol()` 在每次实时连接时运行一次，因此连接 ID 和可变状态保持隔离。
- `connectionMessages()` 在 WebSocket 打开后、`session.update` 之前发出原始握手帧。
- 所有后续事件都通过 `encodeOutgoing()` 和 `normalizeIncoming()` 传递，Gateway 工具、任务和客户端协议保持不变。
- `visibility: 'gateway-only'` 允许宿主选择 Provider，而不会在桌面设置或公共 Provider 列表中暴露它。

Provider 必须实现完整的契约——`model()`、`voice()`、`isConfigured()`、`url()`、`headers()`、`classifyError()`、`buildSession()`、`buildSpeakResponse()`、`buildResultInjection()`、`buildPermissionInjection()`——以及数字类型的 `inputSampleRate` 和 `outputSampleRate` 字段；注册时若缺少任何成员将抛出异常。

Provider 和 Protocol 契约在注册和连接建立期间进行验证，因此缺失的方法或无效的值会立即失败。