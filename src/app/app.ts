import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LanguageService } from './core/services/language.service';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { CommandPaletteComponent } from './shared/components/command-palette/command-palette.component';
import { VoiceHudComponent } from './shared/components/voice/voice-hud.component';
import { VoiceSessionSummaryComponent } from './shared/components/voice/voice-session-summary.component';
import { CommandRegistryService } from './core/services/command-registry.service';
import { registerAppCommands } from './core/services/register-app-commands';
import { VoiceCommandsService } from './core/voice/register-voice-commands';
import { VoiceOrchestratorService } from './core/voice/voice-orchestrator.service';
import { VoiceApiService } from './core/voice/voice-api.service';
import { assertLexiconMatches } from './core/voice/clinical-lexicon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ToastContainerComponent,
    ConfirmDialogComponent,
    CommandPaletteComponent,
    VoiceHudComponent,
    VoiceSessionSummaryComponent,
  ],
  template: `<router-outlet />
    <app-toast-container />
    <app-confirm-dialog />
    <app-command-palette />
    <app-voice-hud />
    <app-voice-session-summary />`,
})
export class App {
  private voiceCommands = inject(VoiceCommandsService);
  private voice = inject(VoiceOrchestratorService);
  private voiceApi = inject(VoiceApiService);

  constructor(
    private languageService: LanguageService,
    private commandRegistry: CommandRegistryService,
    private router: Router,
  ) {
    registerAppCommands(this.commandRegistry, this.router);
    this.voiceCommands.registerAll();
    this.verifyLexicon();
  }

  /**
   * The browser's spoken-finding vocabulary and the server's finding catalog
   * have to agree, or a doctor dictates a finding that fails validation
   * mid-examination. Checking at boot turns that into a console warning a
   * developer sees, rather than a failure a clinician does.
   */
  private verifyLexicon(): void {
    this.voiceApi.lexicon().subscribe({
      next: response => {
        const result = assertLexiconMatches(response.codes ?? []);
        if (!result.ok) console.warn(result.message);
      },
      // Pre-auth or offline: not worth surfacing, the server still validates
      // every code it is sent.
      error: () => undefined,
    });
  }

  /**
   * ⌘K opens the command palette; ⌘⇧V is the voice equivalent — a keyboard
   * chord rather than a wake word, which is the push-to-talk trigger audit
   * XII.4 §1 asks for. Enter and Escape answer a pending confirmation so a
   * clinical write can be resolved without reaching for the mouse.
   */
  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const mod = event.metaKey || event.ctrlKey;

    if (mod && event.shiftKey && event.key.toLowerCase() === 'v') {
      event.preventDefault();
      this.voice.toggleListening();
      return;
    }

    if (mod && !event.shiftKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.commandRegistry.toggle();
      return;
    }

    if (this.voice.confirmation()) {
      // Only when focus isn't in a text field, so typing a note that happens
      // to end with Enter cannot confirm a clinical write by accident.
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (typing) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        void this.voice.confirmPending();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        void this.voice.rejectPending();
      }
    }
  }
}
