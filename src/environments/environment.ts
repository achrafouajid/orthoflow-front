export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  // Default speech-to-text engine: 'browser' uses the built-in
  // SpeechRecognition API; 'groq' records audio and sends it to the backend's
  // /voice/transcribe proxy (Groq Whisper). A per-browser choice in the voice
  // HUD overrides this. See SpeechRecognitionService.
  voiceSttEngine: 'browser' as 'browser' | 'groq',
};
