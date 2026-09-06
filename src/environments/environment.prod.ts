export const environment = {
  production: true,
  apiUrl: 'https://apiortho.crmbento.com',
  // Default speech-to-text engine: 'browser' uses the built-in
  // SpeechRecognition API; 'groq' records audio and sends it to the backend's
  // /voice/transcribe proxy (Groq Whisper). A per-browser choice in the voice
  // HUD overrides this. Server-side STT must also be enabled on the backend
  // (orthoflow.voice.stt.enabled) for 'groq' to do anything.
  voiceSttEngine: 'browser' as 'browser' | 'groq',
};
