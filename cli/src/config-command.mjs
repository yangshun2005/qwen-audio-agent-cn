import { closeSync, fsyncSync, mkdirSync, openSync, chmodSync, readFileSync, writeSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  replaceFileSync,
  withFileTransaction,
} from '../../shared/file-transaction-lock.mjs'
import {
  DEFAULT_DASHSCOPE_REALTIME_MODEL,
  listDashScopeRealtimeModelProfiles,
  resolveDashScopeRealtimeModelProfile,
} from '../../shared/realtime-provider-catalog.mjs'

export const GATEWAY_RESTART_FOLLOW_UP = '配置已更新；请执行 qwenaudio gateway restart 使 Gateway 使用新模型'

function configText(path) {
  try { return readFileSync(path, 'utf8') } catch (error) {
    if (error.code === 'ENOENT') return ''
    throw error
  }
}

export function resolveConfigModel(env = {}, content = '') {
  const match = content.match(/^\s*QWEN_AUDIO_REALTIME_MODEL\s*=\s*(.*?)\s*$/m)
  return String(env.QWEN_AUDIO_REALTIME_MODEL || match?.[1] || DEFAULT_DASHSCOPE_REALTIME_MODEL).trim()
}

export function assertKnownRealtimeModel(model) {
  const profile = resolveDashScopeRealtimeModelProfile(model)
  if (!listDashScopeRealtimeModelProfiles().some(item => item.id === model)) {
    throw new Error(`不支持的 Realtime 模型：${model}`)
  }
  return profile
}

export function updateRealtimeModelConfig(configPath, model, {
  fsyncDirectory = true,
} = {}) {
  assertKnownRealtimeModel(model)
  return withFileTransaction(configPath, () => updateRealtimeModelConfigUnlocked(
    configPath,
    model,
    { fsyncDirectory },
  ))
}

function updateRealtimeModelConfigUnlocked(configPath, model, {
  fsyncDirectory,
}) {
  const existing = configText(configPath)
  const assignments = new Map([
    ['QWEN_AUDIO_REALTIME_MODEL', model],
  ])
  const newline = existing.includes('\r\n') ? '\r\n' : '\n'
  const lines = existing ? existing.split(/\r?\n/) : []
  if (lines.at(-1) === '') lines.pop()
  const replaced = new Set()
  const normalized = []
  for (const current of lines) {
    const match = current.match(/^\s*(QWEN_AUDIO_REALTIME_MODEL)\s*=.*$/)
    const key = match?.[1]
    if (!key) {
      normalized.push(current)
      continue
    }
    if (!replaced.has(key)) normalized.push(`${key}=${assignments.get(key)}`)
    replaced.add(key)
  }
  for (const [key, value] of assignments) {
    if (!replaced.has(key)) normalized.push(`${key}=${value}`)
  }
  const updated = `${normalized.join(newline)}${newline}`
  const directory = dirname(configPath)
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  const tempPath = resolve(directory, `.config.env.${process.pid}.${randomUUID()}.tmp`)
  const fd = openSync(tempPath, 'wx', 0o600)
  try {
    chmodSync(tempPath, 0o600)
    writeSync(fd, updated, 0, 'utf8')
    fsyncSync(fd)
  } finally {
    closeSync(fd)
  }
  replaceFileSync(tempPath, configPath)
  if (fsyncDirectory) {
    try {
      const directoryFd = openSync(directory, 'r')
      try { fsyncSync(directoryFd) } finally { closeSync(directoryFd) }
    } catch {}
  }
  return {
    model,
    profile: resolveDashScopeRealtimeModelProfile(model),
    configPath,
  }
}

export function showConfig({ configPath, env = {}, content = configText(configPath) }) {
  const model = resolveConfigModel(env, content)
  return [
    `Realtime 模型：${model}`,
    '可用 Realtime 模型：',
    ...listDashScopeRealtimeModelProfiles().map(profile => `- ${profile.id}（${profile.label}）`),
  ].join('\n')
}
