import { Injectable, signal } from '@angular/core';

/**
 * Continuous microphone capture, segmented into utterances by silence.
 *
 * ── Why this exists alongside SpeechRecognitionService ──────────────────
 *
 * `SpeechRecognitionService` wraps the browser's own recogniser. That was the
 * only capture path, and it is the reason dictation was unreliable: on Chrome
 * it is a general-purpose recogniser with no notion of dental vocabulary, and
 * it loses clinical terms in French-with-Darija speech. It stays as an offline
 * fallback; this is the primary path, and it does something different — it
 * records audio and hands the clip to the server, which transcribes it with a
 * model that can be told what kind of speech to expect.
 *
 * ── Segmentation, and why not push-to-talk ──────────────────────────────
 *
 * A dentist mid-examination cannot press anything. So the microphone stays
 * open for the whole session and this decides where one utterance ends: an
 * {@link AnalyserNode} watches the input level, and a stretch of quiet closes
 * the clip and ships it. Everything captured is gated by the wake word
 * downstream, so an open microphone is not the same as an acting one.
 *
 * ── What is not kept ────────────────────────────────────────────────────
 *
 * Audio is held only until its clip has been posted, then dropped. Nothing is
 * written to disk, and the session buffer stores transcripts rather than
 * recordings — a browser profile should not accumulate consultation audio.
 */

export type CaptureStatus = 'idle' | 'starting' | 'capturing' | 'error';

/** Below this RMS the input counts as silence. */
const SILENCE_THRESHOLD = 0.012;

/** Quiet for this long closes the current utterance. */
const SILENCE_HANG_MS = 800;

/** A clip shorter than this is a cough or a door, not speech. */
const MIN_UTTERANCE_MS = 350;

/**
 * A clip is closed at this length regardless of silence. Long dictation is
 * normal; a single unbounded clip is not — it would delay transcription until
 * the dentist stopped talking, and risk the server's size ceiling.
 */
const MAX_UTTERANCE_MS = 20_000;

/** How often the level is sampled. */
const POLL_MS = 50;

@Injectable({ providedIn: 'root' })
export class AudioCaptureService {
  private statusSignal = signal<CaptureStatus>('idle');
  private levelSignal = signal(0);
  private errorSignal = signal<string | null>(null);

  status = this.statusSignal.asReadonly();
  /** 0–1 input level, so the HUD can show the microphone is live. */
  level = this.levelSignal.asReadonly();
  lastError = this.errorSignal.asReadonly();

  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  private chunks: Blob[] = [];
  private speaking = false;
  private silenceSince: number | null = null;
  private utteranceStartedAt = 0;
  private stopping = false;

  private onUtterance: ((clip: Blob) => void) | null = null;

  /** Called with each closed utterance. Set before {@link start}. */
  setUtteranceHandler(handler: (clip: Blob) => void): void {
    this.onUtterance = handler;
  }

  isSupported(): boolean {
    return typeof navigator !== 'undefined'
      && !!navigator.mediaDevices?.getUserMedia
      && typeof MediaRecorder !== 'undefined';
  }

  /**
   * Opens the microphone and begins segmenting.
   *
   * @returns false when capture could not start — the caller falls back to
   *   browser recognition rather than leaving the dentist with a dead
   *   microphone and no explanation.
   */
  async start(): Promise<boolean> {
    if (this.statusSignal() === 'capturing') return true;
    if (!this.isSupported()) {
      this.errorSignal.set('This browser cannot record audio. Falling back to browser recognition.');
      this.statusSignal.set('error');
      return false;
    }

    this.statusSignal.set('starting');
    this.errorSignal.set(null);

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // A consultation room has suction, handpieces and a second person
          // in it. These are the browser's own DSP and cost nothing.
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (error) {
      this.errorSignal.set(this.describeGetUserMediaError(error));
      this.statusSignal.set('error');
      return false;
    }

    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      source.connect(this.analyser);

      this.stopping = false;
      this.statusSignal.set('capturing');
      this.pollTimer = setInterval(() => this.poll(), POLL_MS);
      return true;
    } catch (error) {
      this.errorSignal.set('Could not open the audio pipeline.');
      this.statusSignal.set('error');
      this.releaseStream();
      return false;
    }
  }

  stop(): void {
    this.stopping = true;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    // Ship whatever is mid-utterance rather than discarding a finding the
    // dentist has already said.
    this.closeUtterance();
    this.releaseStream();
    this.levelSignal.set(0);
    if (this.statusSignal() !== 'error') this.statusSignal.set('idle');
  }

  private poll(): void {
    if (!this.analyser) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);

    let sum = 0;
    for (const sample of buffer) sum += sample * sample;
    const rms = Math.sqrt(sum / buffer.length);
    this.levelSignal.set(Math.min(1, rms * 12));

    const now = Date.now();

    if (rms >= SILENCE_THRESHOLD) {
      this.silenceSince = null;
      if (!this.speaking) this.openUtterance(now);
      // A dentist dictating a long finding should not have it cut mid-clause,
      // but an unbounded clip delays everything behind it.
      if (now - this.utteranceStartedAt >= MAX_UTTERANCE_MS) this.closeUtterance();
      return;
    }

    if (!this.speaking) return;

    if (this.silenceSince === null) {
      this.silenceSince = now;
    } else if (now - this.silenceSince >= SILENCE_HANG_MS) {
      this.closeUtterance();
    }
  }

  private openUtterance(now: number): void {
    if (!this.stream || this.stopping) return;

    this.chunks = [];
    this.speaking = true;
    this.utteranceStartedAt = now;

    try {
      this.recorder = new MediaRecorder(this.stream, { mimeType: this.pickMimeType() });
      this.recorder.ondataavailable = event => {
        if (event.data.size > 0) this.chunks.push(event.data);
      };
      this.recorder.onstop = () => this.emitClip();
      this.recorder.start();
    } catch {
      // A recorder that will not start is not recoverable per-utterance; the
      // caller's fallback handles it.
      this.speaking = false;
    }
  }

  private closeUtterance(): void {
    if (!this.speaking || !this.recorder) {
      this.speaking = false;
      return;
    }
    this.speaking = false;
    this.silenceSince = null;
    const tooShort = Date.now() - this.utteranceStartedAt < MIN_UTTERANCE_MS;

    try {
      if (this.recorder.state !== 'inactive') this.recorder.stop();
    } catch {
      // Already stopped.
    }

    if (tooShort) {
      // Drop it without emitting: a door closing is not an utterance, and
      // transcribing it costs a round trip and risks a spurious command.
      this.chunks = [];
    }
  }

  private emitClip(): void {
    const chunks = this.chunks;
    this.chunks = [];
    this.recorder = null;
    if (chunks.length === 0) return;

    const clip = new Blob(chunks, { type: chunks[0].type || 'audio/webm' });
    this.onUtterance?.(clip);
  }

  /**
   * The first container this browser will actually record. Chrome and Firefox
   * produce webm/opus; Safari only records mp4. All are accepted upstream.
   */
  private pickMimeType(): string {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    for (const candidate of candidates) {
      if (MediaRecorder.isTypeSupported(candidate)) return candidate;
    }
    return '';
  }

  private releaseStream(): void {
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.analyser = null;
    void this.audioContext?.close().catch(() => undefined);
    this.audioContext = null;
    this.recorder = null;
    this.chunks = [];
    this.speaking = false;
    this.silenceSince = null;
  }

  private describeGetUserMediaError(error: unknown): string {
    const name = (error as { name?: string } | null)?.name ?? '';
    switch (name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return 'Microphone access was blocked. Allow it in the browser\'s site settings, then try again.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No microphone was found.';
      case 'NotReadableError':
        return 'The microphone is in use by another application.';
      default:
        return 'Could not open the microphone.';
    }
  }
}
