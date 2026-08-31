import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { VoiceApiService, VoiceSessionDto } from './voice-api.service';
import { VoiceContextService } from './voice-context.service';
import { PatientClinicalRecord } from '../models/clinical-record.model';
import { findingLabel } from './clinical-lexicon';
import { describeFdi } from './tooth-lexicon';

/**
 * A dictated examination, from "start examination" to "end examination".
 *
 * Sessions are what make hands-free documentation practical. Confirming forty
 * individual writes is not something a doctor with gloves on will do, so
 * findings accumulate under a session id and the whole consultation is
 * reviewed and confirmed once at the end — while each individual write is
 * still separately audited underneath, so the session summary is a review
 * step rather than the only record.
 *
 * The summary is read back from the server, not assembled from what the
 * browser thinks it sent: the doctor signs off on what was actually
 * persisted.
 */

export interface ToothSummaryRow {
  fdi: string;
  description: string;
  findings: Array<{ code: string; label: string; kind: string; note?: string | null }>;
}

export interface SessionSummary {
  teeth: ToothSummaryRow[];
  diagnoses: string[];
  treatments: string[];
  notes: Array<{ category: string; content: string; fdi?: string | null }>;
  allergies: string[];
  medicalHistory: Array<{ category: string; label: string }>;
  followUps: string[];
  totalFindings: number;
}

@Injectable({ providedIn: 'root' })
export class VoiceSessionService {
  private api = inject(VoiceApiService);
  private context = inject(VoiceContextService);

  private sessionSignal = signal<VoiceSessionDto | null>(null);
  private summarySignal = signal<SessionSummary | null>(null);
  private summaryOpenSignal = signal(false);
  private busySignal = signal(false);

  session = this.sessionSignal.asReadonly();
  summary = this.summarySignal.asReadonly();
  summaryOpen = this.summaryOpenSignal.asReadonly();
  busy = this.busySignal.asReadonly();

  isActive = computed(() => this.sessionSignal()?.status === 'ACTIVE');

  async start(): Promise<VoiceSessionDto> {
    const snapshot = this.context.snapshot();
    const session = await firstValueFrom(this.api.startSession(snapshot.patientId, snapshot.locale));
    this.sessionSignal.set(session);
    this.summarySignal.set(null);
    this.context.setSessionId(session.id);
    return session;
  }

  /**
   * Ends the session and loads its summary for review. The session is not
   * marked confirmed here — that needs the doctor's explicit sign-off, which
   * is a separate call.
   */
  async end(): Promise<SessionSummary | null> {
    const session = this.sessionSignal();
    if (!session) return null;

    this.busySignal.set(true);
    try {
      const summary = await this.loadSummary(session.id);
      const completed = await firstValueFrom(this.api.completeSession(session.id, {
        status: 'COMPLETED',
        summary: JSON.stringify(summary),
        confirmed: false,
      }));
      this.sessionSignal.set(completed);
      this.context.setSessionId(null);
      this.context.clearConversation();
      this.summaryOpenSignal.set(true);
      return summary;
    } finally {
      this.busySignal.set(false);
    }
  }

  /** Sign-off. Freezes the summary as reviewed. */
  async confirm(): Promise<void> {
    const session = this.sessionSignal();
    const summary = this.summarySignal();
    if (!session) return;
    await firstValueFrom(this.api.completeSession(session.id, {
      status: 'COMPLETED',
      summary: summary ? JSON.stringify(summary) : undefined,
      confirmed: true,
    }));
    this.summaryOpenSignal.set(false);
  }

  async abandon(): Promise<void> {
    const session = this.sessionSignal();
    if (!session) return;
    // ABANDONED marks the dictation as not reviewed. It does not remove
    // anything already written — those are clinical records with their own
    // audit trail, and a session ending untidily is not grounds to delete them.
    await firstValueFrom(this.api.completeSession(session.id, { status: 'ABANDONED', confirmed: false }));
    this.sessionSignal.set(null);
    this.context.setSessionId(null);
    this.context.clearConversation();
    this.summaryOpenSignal.set(false);
  }

  /** Mid-examination "show me today's findings" — leaves the session running. */
  async refreshSummary(): Promise<SessionSummary | null> {
    const session = this.sessionSignal();
    if (!session) return null;
    const summary = await this.loadSummary(session.id);
    this.summaryOpenSignal.set(true);
    return summary;
  }

  openSummary(): void {
    if (this.summarySignal()) this.summaryOpenSignal.set(true);
  }

  closeSummary(): void {
    this.summaryOpenSignal.set(false);
  }

  private async loadSummary(sessionId: string): Promise<SessionSummary> {
    const record = await firstValueFrom(this.api.sessionSummary(sessionId));
    const summary = this.buildSummary(record);
    this.summarySignal.set(summary);
    return summary;
  }

  private buildSummary(record: PatientClinicalRecord): SessionSummary {
    const byTooth = new Map<string, ToothSummaryRow>();
    for (const finding of record.findings) {
      const row = byTooth.get(finding.fdi) ?? {
        fdi: finding.fdi,
        description: describeFdi(finding.fdi),
        findings: [],
      };
      row.findings.push({
        code: finding.findingCode,
        label: findingLabel(finding.findingCode),
        kind: finding.kind,
        note: finding.note,
      });
      byTooth.set(finding.fdi, row);
    }

    const teeth = [...byTooth.values()].sort((a, b) => a.fdi.localeCompare(b.fdi));

    // Diagnoses and treatments are the same findings sliced by kind — the
    // doctor reviews "what is wrong" separately from "what needs doing",
    // which is how a consultation summary is actually read.
    const diagnoses: string[] = [];
    const treatments: string[] = [];
    for (const row of teeth) {
      for (const finding of row.findings) {
        const line = `${row.fdi} (${row.description}) — ${finding.label}`;
        if (finding.kind === 'TREATMENT_REQUIRED') treatments.push(line);
        else if (finding.kind === 'CONDITION') diagnoses.push(line);
      }
    }

    const followUps = record.notes
      .filter(note => note.category === 'FOLLOW_UP')
      .map(note => note.content);

    return {
      teeth,
      diagnoses,
      treatments,
      notes: record.notes
        .filter(note => note.category !== 'FOLLOW_UP')
        .map(note => ({ category: note.category, content: note.content, fdi: note.fdi })),
      allergies: record.allergies.map(a => a.substance),
      medicalHistory: record.medicalHistory.map(entry => ({ category: entry.category, label: entry.label })),
      followUps,
      totalFindings: record.findings.length,
    };
  }

  /** A short read-back for "show me today's findings" while hands are busy. */
  spokenSummary(summary: SessionSummary): string {
    if (summary.totalFindings === 0 && summary.notes.length === 0) {
      return 'Nothing recorded in this examination yet.';
    }
    const parts: string[] = [];
    if (summary.teeth.length) {
      parts.push(`${summary.teeth.length} ${summary.teeth.length === 1 ? 'tooth' : 'teeth'} with findings`);
    }
    if (summary.treatments.length) parts.push(`${summary.treatments.length} treatments recommended`);
    if (summary.allergies.length) parts.push(`${summary.allergies.length} allergies`);
    if (summary.notes.length) parts.push(`${summary.notes.length} notes`);
    return `So far: ${parts.join(', ')}. The full summary is on screen.`;
  }
}
