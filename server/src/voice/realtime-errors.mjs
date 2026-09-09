export function isRecoverableRealtimeInactivityError(message) {
  const text = String(message || '').trim()
  return /session was closed because no response was generated for \d+ seconds/i.test(
    text,
  )
}
