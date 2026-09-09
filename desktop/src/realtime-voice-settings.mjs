import {
  resolveDashScopeRealtimeModelProfile,
} from '../../shared/realtime-model-catalog.mjs'

export function createRealtimeVoiceDrafts({
  audioRealtimeVoice = '',
  omniRealtimeVoice = '',
} = {}) {
  const values = {
    audio: String(audioRealtimeVoice || '').trim(),
    omni: String(omniRealtimeVoice || '').trim(),
  }
  let family = 'audio'

  return {
    selectModel(model) {
      const profile = resolveDashScopeRealtimeModelProfile(model)
      family = profile.family
      return {
        family,
        value: values[family] || '',
        placeholder: profile.sessionDefaults.voice || '模型默认音色',
      }
    },
    update(value) {
      if (family === 'audio' || family === 'omni') {
        values[family] = String(value || '').trim()
      }
    },
    settings() {
      return {
        audioRealtimeVoice: values.audio,
        omniRealtimeVoice: values.omni,
      }
    },
  }
}
