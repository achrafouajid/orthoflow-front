import { Injectable, signal } from '@angular/core';

/**
 * Spoken confirmation back to the doctor.
 *
 * The point of the whole feature is that the doctor does not look at the
 * screen, so a purely visual confirmation is only half an answer. What is
 * spoken is always the *resolved* values — "Tooth 16, recurrent caries" — and
 * never an echo of the transcript, because reading back what was heard proves
 * nothing about what was understood (audit XII.4 §2).
 *
 * Speech is best-effort. It is never the only confirmation: the HUD shows the
 * same information, and audio can be muted without losing anything.
 */
@Injectable({ providedIn: 'root' })
export class SpeechFeedbackService {
  private enabledSignal = signal(this.readStoredPreference());
  private speakingSignal = signal(false);

  enabled = this.enabledSignal.asReadonly();
  speaking = this.speakingSignal.asReadonly();

  private readStoredPreference(): boolean {
    return localStorage.getItem('orthoflow_voice_audio') !== 'off';
  }

  setEnabled(enabled: boolean): void {
    this.enabledSignal.set(enabled);
    localStorage.setItem('orthoflow_voice_audio', enabled ? 'on' : 'off');
    if (!enabled) this.cancel();
  }

  toggle(): void {
    this.setEnabled(!this.enabledSignal());
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * @param interrupt true for a new confirmation, which should replace
   *   whatever is still being read out — during a fast dictation the doctor
   *   cares about the latest tooth, not a queue of earlier ones.
   */
  speak(text: string, locale = 'en-US', interrupt = true): void {
    if (!this.enabledSignal() || !this.isSupported() || !text.trim()) return;
    try {
      if (interrupt) window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale;
      utterance.rate = 1.05;
      utterance.onstart = () => this.speakingSignal.set(true);
      utterance.onend = () => this.speakingSignal.set(false);
      utterance.onerror = () => this.speakingSignal.set(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio confirmation is an enhancement; the HUD already carries the
      // same information, so a failure here is not worth surfacing.
      this.speakingSignal.set(false);
    }
  }

  cancel(): void {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Nothing to cancel.
    }
    this.speakingSignal.set(false);
  }
}
