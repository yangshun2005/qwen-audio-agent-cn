import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

// Append-only JSONL audit trail for automatic memory operations. There is no
// confirmation UI in the voice-only product, so this file records whether an
// automatic Markdown patch ran, was skipped, or failed. It deliberately keeps
// full memory text out of diagnostics. Errors must never break memory writes.
export class MemoryAudit {
  constructor({
    filePath = null,
    now = () => Date.now(),
    onWarning = warning => console.warn(warning.message),
  } = {}) {
    this.filePath = filePath
    this.now = now
    this.onWarning = onWarning
    this.disabled = false
    this.warning = null
  }

  record(event) {
    if (!this.filePath || this.disabled) return false
    try {
      mkdirSync(dirname(this.filePath), { recursive: true, mode: 0o700 })
      appendFileSync(
        this.filePath,
        `${JSON.stringify({ at: new Date(this.now()).toISOString(), ...event })}\n`,
        { encoding: 'utf8', mode: 0o600 },
      )
      return true
    } catch (error) {
      this.disabled = true
      this.warning = {
        message: `无法写入记忆审计日志：${error.message}；已停用审计，记忆功能不受影响。`,
        at: this.now(),
      }
      try {
        this.onWarning?.(this.warning)
      } catch {
        // Diagnostics must not prevent memory operations.
      }
      return false
    }
  }

  health() {
    return {
      ok: !this.warning,
      configured: Boolean(this.filePath),
      enabled: Boolean(this.filePath) && !this.disabled,
      warning: this.warning,
    }
  }
}
