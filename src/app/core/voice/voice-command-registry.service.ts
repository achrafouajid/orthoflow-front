import { Injectable, signal } from '@angular/core';
import { VoiceCommand, VoiceContextSnapshot } from './voice-intent.model';
import { IntentDescriptorDto } from './voice-api.service';

/**
 * Every action reachable by voice, and the only thing an intent can resolve
 * to.
 *
 * Two properties make the rest of the system safe rather than merely tidy:
 *
 * - **Closed set.** A transcript cannot name an action that is not registered
 *   here. Whatever a recogniser mishears, or a model proposes, the worst
 *   outcome is the wrong *registered command* — which the doctor then sees in
 *   a preview and confirms or rejects.
 *
 * - **Context scoping.** Only commands whose module matches the active screen
 *   are offered, so "assign treatment" is not even a candidate on the stock
 *   page (audit XII.4 §7). The same filtered list is what the NLU is shown,
 *   which is why the server can reject an intent that was never offered.
 *
 * Adding a module's voice commands is a matter of calling {@link registerMany}
 * — no change to the grammar, the pipeline, or the server.
 */
@Injectable({ providedIn: 'root' })
export class VoiceCommandRegistryService {
  private commandsSignal = signal<Map<string, VoiceCommand>>(new Map());

  commands = this.commandsSignal.asReadonly();

  register(command: VoiceCommand): void {
    this.commandsSignal.update(map => new Map(map).set(command.id, command));
  }

  registerMany(commands: VoiceCommand[]): void {
    this.commandsSignal.update(map => {
      const next = new Map(map);
      for (const command of commands) next.set(command.id, command);
      return next;
    });
  }

  unregister(id: string): void {
    this.commandsSignal.update(map => {
      const next = new Map(map);
      next.delete(id);
      return next;
    });
  }

  get(id: string): VoiceCommand | undefined {
    return this.commandsSignal().get(id);
  }

  /** Commands available given the active module, route and patient context. */
  availableFor(context: VoiceContextSnapshot): VoiceCommand[] {
    return Array.from(this.commandsSignal().values()).filter(command => {
      if (command.module && command.module !== context.module) return false;
      if (command.routeScope && !context.route.startsWith(command.routeScope)) return false;
      if (command.requiresPatient && !context.patientId) return false;
      return true;
    });
  }

  /**
   * The in-scope command set as the NLU sees it. Sending this with every
   * request — rather than keeping a copy on the server — is what lets a new
   * module add voice commands without a server change, and what lets the
   * server refuse an intent it was never offered.
   */
  describeFor(context: VoiceContextSnapshot): IntentDescriptorDto[] {
    return this.availableFor(context)
      // BLOCKED commands are never executable by voice, so offering them to
      // the NLU would only invite proposals that must then be refused.
      .filter(command => command.risk !== 'BLOCKED')
      .map(command => ({
        id: command.id,
        description: command.description,
        args: command.args,
        examples: command.examples,
      }));
  }

  /** Grouped for the "what can I say here?" help panel. */
  helpFor(context: VoiceContextSnapshot): Array<{ command: VoiceCommand; examples: string[] }> {
    return this.availableFor(context)
      .filter(command => command.examples.length > 0)
      .map(command => ({ command, examples: command.examples }));
  }
}
