import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VoiceApiService } from './voice-api.service';

/**
 * Microphone capture and speech-to-text.
 *
 * ── Two engines ────────────────────────────────────────────────────────
 *
 * `browser` (default) wraps the browser's `SpeechRecognition` API. `groq`
 * records the microphone with `MediaRecorder` and posts each clip to the
 * backend's `/voice/transcribe` proxy, which runs Whisper (Groq-hosted by
 * default) and hands the text back. The engine is chosen per browser and
 * persisted; {@link environment.voiceSttEngine} sets the initial value.
 *
 * Either way the output is the same {@link RecognitionResult} fed to the same
 * pipeline — nothing downstream knows or cares which engine produced it.
 *
 * ── Two modes, and why ─────────────────────────────────────────────────
 *
 * Audit XII.4 §1 argues against always-listening: a hot microphone in a
 * consultation room continuously processes a conversation containing other
 * people's health information. **Push-to-talk is the default here.**
 *
 * The requirements also ask for a continuous examination mode, and that is a
 * real clinical need — a doctor with both hands in a patient's mouth cannot
 * press a key between findings. It is provided, but on terms that answer the
 * same concern: it is never the default, it is entered by an explicit action,
 * the HUD shows an unmissable "listening" state the whole time, and it stops
 * itself after a period of silence rather than running until someone
 * remembers to end it. With the `groq` engine, continuous mode segments the
 * audio on silence and transcribes one utterance at a time.
 *
 * ── The provider caveat, stated plainly ────────────────────────────────
 *
 * Neither engine is guaranteed on-device. `browser`: Chrome and Edge stream
 * audio to a cloud service, Safari recognises locally in most configurations.
 * `groq`: audio leaves the browser for this app's backend and then for the
 * configured Whisper endpoint. {@link recognitionIsLocal} reports whether the
 * room stays on this machine so the UI can say so; for `groq` it is always
 * false unless the backend points at a self-hosted Whisper.
 */

export type RecognitionStatus = 'unsupported' | 'consent-required' | 'idle' | 'listening' | 'error';

export type RecognitionEngine = 'browser' | 'groq';

export interface RecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

/** Minimal structural types — the DOM lib does not ship SpeechRecognition. */
interface SpeechRecognitionAlternativeLike { transcript: string; confidence: number }
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionErrorEventLike { error: string; message?: string }
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

/** Silence after which continuous mode stops on its own. */
const CONTINUOUS_IDLE_TIMEOUT_MS = 90_000;

const CONSENT_KEY = 'orthoflow_voice_consent';
const ENGINE_KEY = 'orthoflow_voice_stt_engine';

// ── groq engine tuning ────────────────────────────────────────────────
/** MediaRecorder container preferences, best first. */
const GROQ_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
];
/** Clips smaller than this are almost certainly silence — not worth a round trip. */
const GROQ_MIN_CLIP_BYTES = 1_800;
/** Continuous mode: a segment ends after this much trailing quiet. */
const GROQ_SILENCE_MS = 900;
/** Continuous mode: never let one segment grow past this (bounds clip size / latency). */
const GROQ_MAX_SEGMENT_MS = 15_000;
/** Continuous mode: ignore a "segment" shorter than this — it is a click, not speech. */
const GROQ_MIN_SEGMENT_MS = 600;
/** RMS (0–1) above which the current frame counts as speech. */
const GROQ_SPEECH_RMS = 0.012;

@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService {
  private api = inject(VoiceApiService);

  // ── shared state ────────────────────────────────────────────────────
  private engineSignal = signal<RecognitionEngine>(this.readEngine());
  private statusSignal = signal<RecognitionStatus>('idle');
  private interimSignal = signal('');
  private errorSignal = signal<string | null>(null);

  /** Which speech-to-text engine is active. */
  engine = this.engineSignal.asReadonly();
  status = this.statusSignal.asReadonly();
  /** Live partial transcript (browser) or a transient status (groq). */
  interimTranscript = this.interimSignal.asReadonly();
  lastError = this.errorSignal.asReadonly();

  /** Emitted for each final utterance. */
  private onFinal: ((result: RecognitionResult) => void) | null = null;
  /** Emitted for an asynchronous capture failure the caller should surface. */
  private onError: ((message: string) => void) | null = null;

  // ── browser engine state ───────────────────────────────────────────
  private recognition: SpeechRecognitionLike | null = null;
  private continuous = false;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private manualStop = false;

  // ── groq engine state ──────────────────────────────────────────────
  private mediaStream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private recorderMime = '';
  private chunks: Blob[] = [];
  private groqContinuous = false;
  private groqStopping = false;
  private groqLocale = 'en-US';
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private levelTimer: ReturnType<typeof setInterval> | null = null;
  private segmentStartedAt = 0;
  private segmentHadSpeech = false;
  private lastLoudAt = 0;
  private restarting = false;

  constructor() {
    this.refreshAvailability();
  }

  // ── engine selection ───────────────────────────────────────────────

  private readEngine(): RecognitionEngine {
    try {
      const saved = localStorage.getItem(ENGINE_KEY);
      if (saved === 'browser' || saved === 'groq') return saved;
    } catch {
      // Private mode / storage disabled — fall through to the build default.
    }
    return environment.voiceSttEngine === 'groq' ? 'groq' : 'browser';
  }

  setEngine(engine: RecognitionEngine): void {
    if (engine === this.engineSignal()) return;
    this.stop();
    this.engineSignal.set(engine);
    try {
      localStorage.setItem(ENGINE_KEY, engine);
    } catch {
      // Non-fatal: the choice just won't persist across reloads.
    }
    this.errorSignal.set(null);
    this.refreshAvailability();
  }

  /** Recompute the resting status for the current engine after a change. */
  private refreshAvailability(): void {
    if (!this.isSupported()) {
      this.statusSignal.set('unsupported');
    } else if (!this.hasConsent()) {
      this.statusSignal.set('consent-required');
    } else if (this.statusSignal() === 'unsupported' || this.statusSignal() === 'consent-required') {
      this.statusSignal.set('idle');
    }
  }

  // ── consent (engine-agnostic: it is about opening the microphone) ───

  hasConsent(): boolean {
    try {
      return localStorage.getItem(CONSENT_KEY) === 'true';
    } catch {
      return false;
    }
  }

  grantConsent(): void {
    try {
      localStorage.setItem(CONSENT_KEY, 'true');
    } catch {
      // Consent still applies for this session even if it can't be stored.
    }
    if (this.statusSignal() === 'consent-required') this.statusSignal.set('idle');
  }

  revokeConsent(): void {
    try {
      localStorage.removeItem(CONSENT_KEY);
    } catch {
      // ignore
    }
    this.stop();
    if (this.isSupported()) this.statusSignal.set('consent-required');
  }

  // ── capability reporting ───────────────────────────────────────────

  private constructorRef(): SpeechRecognitionCtor | null {
    const w = window as unknown as Record<string, unknown>;
    return (w['SpeechRecognition'] ?? w['webkitSpeechRecognition']) as SpeechRecognitionCtor ?? null;
  }

  isSupported(): boolean {
    if (this.engineSignal() === 'groq') {
      return typeof MediaRecorder !== 'undefined'
        && typeof navigator !== 'undefined'
        && !!navigator.mediaDevices?.getUserMedia;
    }
    return this.constructorRef() !== null;
  }

  /**
   * Whether recognition stays on this machine. For `groq` the audio always
   * leaves the browser (to this app's backend, then to the Whisper endpoint),
   * so this is false unless the backend has been pointed at a self-hosted
   * model — which the browser cannot know, so it reports the cautious answer.
   * For `browser`, Safari (WebKit, not Chrome-on-macOS) recognises locally in
   * most configurations; Chrome and Edge stream to a cloud service.
   */
  recognitionIsLocal(): boolean {
    if (this.engineSignal() === 'groq') return false;
    const ua = navigator.userAgent;
    const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua);
    return isSafari;
  }

  setResultHandler(handler: (result: RecognitionResult) => void): void {
    this.onFinal = handler;
  }

  setErrorHandler(handler: (message: string) => void): void {
    this.onError = handler;
  }

  // ── start / stop ───────────────────────────────────────────────────

  /**
   * @param locale BCP-47 tag. Moroccan clinicians code-switch, so `fr-MA`
   *   generally out-performs `fr-FR`. For `groq` the language part is passed
   *   as an ISO-639-1 hint; blank lets Whisper detect per utterance.
   * @param continuous true only for the explicit examination mode.
   */
  start(locale: string, continuous = false): boolean {
    if (this.engineSignal() === 'groq') {
      return this.startGroq(locale, continuous);
    }
    return this.startBrowser(locale, continuous);
  }

  stop(): void {
    this.clearIdleTimer();
    this.manualStop = true;
    this.continuous = false;
    this.interimSignal.set('');

    // browser
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Already stopped.
      }
      this.recognition = null;
    }

    // groq
    if (this.recorder || this.mediaStream) {
      this.stopGroq();
    }

    const status = this.statusSignal();
    if (status !== 'error' && status !== 'unsupported' && status !== 'consent-required') {
      this.statusSignal.set('idle');
    }
  }

  // ── browser engine ─────────────────────────────────────────────────

  private startBrowser(locale: string, continuous: boolean): boolean {
    const Ctor = this.constructorRef();
    if (!Ctor) {
      this.statusSignal.set('unsupported');
      return false;
    }
    if (!this.hasConsent()) {
      this.statusSignal.set('consent-required');
      return false;
    }
    this.stop();

    const recognition = new Ctor();
    recognition.lang = locale;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    // One alternative: a second-best guess is not something to act on in a
    // clinical record, and the confidence score is what gates the write.
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.statusSignal.set('listening');
      this.errorSignal.set(null);
    };

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternative = result[0];
        if (!alternative) continue;
        if (result.isFinal) {
          const transcript = alternative.transcript.trim();
          if (transcript) {
            this.onFinal?.({
              transcript,
              isFinal: true,
              // Some engines report 0 for confidence rather than omitting it;
              // treating that as "no signal" avoids failing every utterance
              // against the confidence floor on those browsers.
              confidence: alternative.confidence > 0 ? alternative.confidence : 0.85,
            });
          }
        } else {
          interim += alternative.transcript;
        }
      }
      this.interimSignal.set(interim);
      this.armIdleTimer();
    };

    recognition.onerror = (event) => {
      // 'no-speech' and 'aborted' are ordinary in continuous use and must not
      // present to the doctor as failures.
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      const message = this.describeError(event.error);
      this.errorSignal.set(message);
      this.statusSignal.set('error');
      this.onError?.(message);
    };

    recognition.onend = () => {
      this.interimSignal.set('');
      // Continuous recognition ends on its own every so often; restart unless
      // the user asked to stop or an error already surfaced.
      if (this.continuous && !this.manualStop && this.statusSignal() === 'listening') {
        try {
          recognition.start();
          return;
        } catch {
          // Restart can throw if the engine has not fully released; fall
          // through to idle rather than looping.
        }
      }
      if (this.statusSignal() !== 'error') this.statusSignal.set('idle');
      this.clearIdleTimer();
    };

    this.recognition = recognition;
    this.continuous = continuous;
    this.manualStop = false;

    try {
      recognition.start();
      if (continuous) this.armIdleTimer();
      return true;
    } catch {
      this.errorSignal.set('Could not start the microphone. Is another tab using it?');
      this.statusSignal.set('error');
      return false;
    }
  }

  // ── groq engine ────────────────────────────────────────────────────

  private startGroq(locale: string, continuous: boolean): boolean {
    if (!this.isSupported()) {
      this.statusSignal.set('unsupported');
      return false;
    }
    if (!this.hasConsent()) {
      this.statusSignal.set('consent-required');
      return false;
    }
    this.stop();

    this.manualStop = false;
    this.groqStopping = false;
    this.groqContinuous = continuous;
    this.groqLocale = locale;
    this.errorSignal.set(null);

    // getUserMedia is async; report the attempt as started and transition to
    // 'error' via the error handler if permission is refused or the device is
    // unavailable — same end state as a synchronous browser-engine failure.
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        if (this.manualStop) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        this.mediaStream = stream;
        this.recorderMime = this.pickMimeType();
        this.beginRecorder();
        if (continuous) {
          this.startLevelMonitor(stream);
          this.armIdleTimer();
        }
        this.statusSignal.set('listening');
      })
      .catch((err: unknown) => {
        const message = this.describeGetUserMediaError(err);
        this.errorSignal.set(message);
        this.statusSignal.set('error');
        this.onError?.(message);
      });

    return true;
  }

  private pickMimeType(): string {
    if (typeof MediaRecorder.isTypeSupported === 'function') {
      for (const candidate of GROQ_MIME_CANDIDATES) {
        if (MediaRecorder.isTypeSupported(candidate)) return candidate;
      }
    }
    return '';
  }

  private beginRecorder(): void {
    if (!this.mediaStream) return;
    const recorder = this.recorderMime
      ? new MediaRecorder(this.mediaStream, { mimeType: this.recorderMime })
      : new MediaRecorder(this.mediaStream);
    this.chunks = [];
    this.segmentStartedAt = Date.now();
    this.segmentHadSpeech = false;
    this.lastLoudAt = Date.now();

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) this.chunks.push(event.data);
    };

    recorder.onerror = () => {
      if (this.manualStop) return;
      const message = 'The recording stopped unexpectedly.';
      this.errorSignal.set(message);
      this.statusSignal.set('error');
      this.onError?.(message);
      this.stop();
    };

    recorder.onstop = () => {
      const clip = this.chunks.length ? new Blob(this.chunks, { type: this.recorderMime || 'audio/webm' }) : null;
      this.chunks = [];

      if (this.restarting) {
        // A silence boundary in continuous mode: transcribe what we have and
        // immediately open the next segment.
        this.restarting = false;
        void this.uploadClip(clip);
        if (!this.manualStop && this.groqContinuous && this.mediaStream) {
          this.beginRecorder();
        }
        return;
      }

      // A real stop (push-to-talk release, idle timeout, or user action).
      void this.uploadClip(clip);
      this.teardownGroqCapture();
      if (this.statusSignal() === 'listening') this.statusSignal.set('idle');
    };

    // Push-to-talk: one blob delivered on stop. Continuous: flush every
    // second so a segment cut has data to work with without a gap.
    recorder.start(this.groqContinuous ? 1000 : undefined);
    this.recorder = recorder;
  }

  /** Continuous mode only: end the current segment and start the next. */
  private flushSegment(): void {
    if (!this.recorder || this.recorder.state !== 'recording') return;
    this.restarting = true;
    try {
      this.recorder.stop();
    } catch {
      this.restarting = false;
    }
  }

  private startLevelMonitor(stream: MediaStream): void {
    try {
      const Ctx: typeof AudioContext =
        (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .AudioContext
        || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new Ctx();
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);
    } catch {
      // No Web Audio: fall back to fixed-length segments so continuous mode
      // still produces utterances, just cut on time rather than on silence.
      this.analyser = null;
    }

    const buffer = this.analyser ? new Uint8Array(this.analyser.fftSize) : null;
    this.levelTimer = setInterval(() => {
      if (this.manualStop || !this.recorder) return;
      const now = Date.now();
      const segmentAge = now - this.segmentStartedAt;

      if (this.analyser && buffer) {
        this.analyser.getByteTimeDomainData(buffer);
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i++) {
          const v = (buffer[i] - 128) / 128;
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / buffer.length);
        if (rms >= GROQ_SPEECH_RMS) {
          this.segmentHadSpeech = true;
          this.lastLoudAt = now;
          this.armIdleTimer();
        }
        const trailingQuiet = now - this.lastLoudAt;
        if (this.segmentHadSpeech && trailingQuiet >= GROQ_SILENCE_MS && segmentAge >= GROQ_MIN_SEGMENT_MS) {
          this.flushSegment();
          return;
        }
      }

      if (segmentAge >= GROQ_MAX_SEGMENT_MS && (this.segmentHadSpeech || !this.analyser)) {
        this.flushSegment();
      }
    }, 150);
  }

  private async uploadClip(clip: Blob | null): Promise<void> {
    if (!clip || clip.size < GROQ_MIN_CLIP_BYTES) return;
    this.interimSignal.set('Transcribing…');
    try {
      const ext = this.extensionFor(clip.type);
      const language = this.iso639(this.groqLocale);
      const response = await firstValueFrom(
        this.api.transcribe(clip, `utterance.${ext}`, language || undefined),
      );
      if (this.interimSignal() === 'Transcribing…') this.interimSignal.set('');

      if (response.error) {
        // The server did not transcribe (STT off, misconfigured, or upstream
        // failure). Say so once, audibly, and let the doctor switch back to
        // the browser engine — do not silently drop the utterance.
        const disabled = response.error === 'stt-disabled' || response.error === 'stt-not-configured';
        const message = disabled
          ? 'Server transcription is not enabled. Switch the speech engine back to “Browser”.'
          : 'That didn\'t come through. Try again, or switch the speech engine to “Browser”.';
        this.errorSignal.set(message);
        this.onError?.(message);
        // A configuration error will fail every segment — do not keep an
        // examination running against it.
        if (disabled && this.groqContinuous) this.stop();
        return;
      }

      const transcript = (response.text || '').trim();
      if (transcript) {
        this.onFinal?.({ transcript, isFinal: true, confidence: 0.92 });
      }
    } catch (err) {
      if (this.interimSignal() === 'Transcribing…') this.interimSignal.set('');
      const status = (err as { status?: number })?.status;
      const message = status === 413
        ? 'That recording was too long. Use shorter push-to-talk phrases.'
        : 'Could not reach the transcription service. Check the connection, or switch to the “Browser” engine.';
      this.errorSignal.set(message);
      this.onError?.(message);
    }
  }

  private stopGroq(): void {
    this.groqStopping = true;
    this.restarting = false;
    this.groqContinuous = false;
    if (this.recorder && this.recorder.state !== 'inactive') {
      try {
        this.recorder.stop(); // onstop uploads the final clip and tears down
        return;
      } catch {
        // fall through to a hard teardown
      }
    }
    this.teardownGroqCapture();
  }

  private teardownGroqCapture(): void {
    if (this.levelTimer) {
      clearInterval(this.levelTimer);
      this.levelTimer = null;
    }
    this.analyser = null;
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => undefined);
      this.audioCtx = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    this.recorder = null;
    this.chunks = [];
  }

  private iso639(locale: string): string {
    const code = (locale || '').toLowerCase().split(/[-_]/)[0];
    return /^[a-z]{2}$/.test(code) ? code : '';
  }

  private extensionFor(mime: string): string {
    if (mime.includes('ogg')) return 'ogg';
    if (mime.includes('mp4')) return 'mp4';
    if (mime.includes('mpeg')) return 'mp3';
    if (mime.includes('wav')) return 'wav';
    return 'webm';
  }

  private describeGetUserMediaError(err: unknown): string {
    const name = (err as { name?: string })?.name;
    switch (name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return 'Microphone access was blocked. Allow it in the browser\'s site settings, then try again.';
      case 'NotFoundError':
      case 'OverconstrainedError':
        return 'No microphone was found.';
      case 'NotReadableError':
        return 'The microphone is in use by another application.';
      default:
        return 'Could not open the microphone.';
    }
  }

  // ── shared: idle timer + error text ────────────────────────────────

  /** Continuous mode stops itself after a stretch of silence. */
  private armIdleTimer(): void {
    if (!this.continuous && !this.groqContinuous) return;
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      this.errorSignal.set('Examination mode paused after a period of silence. Tap the microphone to resume.');
      this.stop();
    }, CONTINUOUS_IDLE_TIMEOUT_MS);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private describeError(code: string): string {
    switch (code) {
      case 'not-allowed':
      case 'service-not-allowed':
        return 'Microphone access was blocked. Allow it in the browser\'s site settings, then try again.';
      case 'audio-capture':
        return 'No microphone was found.';
      case 'network':
        return 'Speech recognition could not reach its service. Check the network connection.';
      case 'language-not-supported':
        return 'This browser does not support speech recognition in the selected language.';
      default:
        return `Speech recognition failed (${code}).`;
    }
  }
}
