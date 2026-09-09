#!/usr/bin/env node

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadRuntimeEnvironment } from '../shared/runtime-environment.mjs'
import { ensureRuntime } from '../cli/src/runtime.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
loadRuntimeEnvironment({ root })
const listenHost = process.env.HOST || '127.0.0.1'
const port = process.env.PORT || '3101'
const probeHost = ['0.0.0.0', '::', '[::]'].includes(listenHost)
  ? '127.0.0.1'
  : listenHost
const url = process.env.QWEN_AUDIO_AGENT_URL
  || `http://${probeHost}:${port}`

try {
  const runtime = await ensureRuntime({
    url,
    listenHost,
    listenPort: port,
  }, { root })
  if (!runtime.ownsProcesses) {
    process.stdout.write(`qwen-audio-agent 已在运行：${url}\n`)
  } else {
    process.stdout.write(`qwen-audio-agent 已就绪：${url}\n`)
    const onSigint = () => runtime.close('SIGINT')
    const onSigterm = () => runtime.close('SIGTERM')
    process.once('SIGINT', onSigint)
    process.once('SIGTERM', onSigterm)
    try {
      process.exitCode = await runtime.wait()
    } finally {
      process.off('SIGINT', onSigint)
      process.off('SIGTERM', onSigterm)
      runtime.close()
    }
  }
} catch (error) {
  process.stderr.write(`qwen-audio-agent 启动失败：${error.message}\n`)
  process.exitCode = 1
}
