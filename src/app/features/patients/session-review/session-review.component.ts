import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { VoiceSessionService } from '../../../core/voice/voice-session.service';
import { VoiceOrchestratorService, BufferedEntry } from '../../../core/voice/voice-orchestrator.service';
import { SessionBufferService } from '../../../core/voice/session-buffer.service';
import { ToastService } from '../../../core/services/toast.service';
import { PatientService } from '../../../core/services/patient.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { PatientTreatmentService } from '../../../core/services/patient-treatment.service';
import { ClinicalRecordService } from '../../../core/services/clinical-record.service';
import { InvoiceService } from '../../billing/services/invoice.service';
import { findingLabel } from '../../../core/voice/clinical-lexicon';
import { describeFdi } from '../../../core/voice/tooth-lexicon';

/**
 * Where a dictated examination becomes part of the record — or doesn't.
 *
 * ── Why this is a route and not a modal ─────────────────────────────────
 *
 * The old consultation summary was a modal mounted at the app root, closable
 * by clicking the backdrop. That was fine when it was a read-only receipt for
 * writes that had already happened. It is not fine now: with dictation
 * buffered, this page *is* the commit step, and a stray click outside it
 * would discard a consultation. A route also survives a refresh, can be
 * linked to, and can be reopened from the server's PENDING_REVIEW list when a
 * dentist is interrupted mid-review.
 *
 * ── What the dentist is looking at ──────────────────────────────────────
 *
 * Two different things, deliberately kept apart. The **staged findings** are
 * the record: each one is a command that was dictated, is included by
 * default, and is written when they save. The **narrative** is generated
 * prose to help them read the consultation back; it is editable, it is saved
 * as a note, and it is not what the clinical tables are built from. Confusing
 * the two would let a model's sentence become a finding.
 *
 * Around them is the context needed to judge any of it: the tooth chart with
 * what is staged marked on it, the patient's allergies, active treatments,
 * next appointment and outstanding balance — the things that make a finding
 * make sense, and which the dentist would otherwise leave this page to check.
 */
@Component({
  selector: 'app-session-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="review">
      <header class="review-header">
        <div>
          <h1>Consultation review</h1>
          <p class="sub">
            {{ patient()?.firstName }} {{ patient()?.lastName }}
            <span class="dot">·</span>
            {{ included().length }} of {{ entries().length }} findings will be saved
          </p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-ghost" (click)="discardAll()" [disabled]="saving()">
            Discard examination
          </button>
          <button type="button" class="btn btn-primary" (click)="save()"
                  [disabled]="saving() || entries().length === 0">
            {{ saving() ? 'Saving…' : 'Save to dossier' }}
          </button>
        </div>
      </header>

      @if (failures().length) {
        <div class="banner banner-error" role="alert">
          <strong>{{ failures().length }} finding(s) could not be saved.</strong>
          The rest were written. These are still staged — correct them or remove them, then save again.
          <ul>
            @for (failure of failures(); track failure.auditId) {
              <li>{{ failure.errorMessage }}</li>
            }
          </ul>
        </div>
      }

      <div class="review-grid">
        <!-- ── Staged findings: the record ─────────────────────────── -->
        <section class="panel span-2">
          <h2>Dictated findings</h2>
          <p class="panel-hint">
            Everything here was staged during the examination. Nothing has been written to the
            dossier yet — unticking a row leaves it out permanently.
          </p>

          @if (entries().length === 0) {
            <p class="empty">This examination recorded nothing.</p>
          } @else {
            <ul class="entry-list">
              @for (entry of entries(); track entry.auditId) {
                <li class="entry" [class.excluded]="!isIncluded(entry.auditId)">
                  <label class="entry-check">
                    <input type="checkbox" [checked]="isIncluded(entry.auditId)"
                           (change)="toggle(entry.auditId)"
                           [attr.aria-label]="'Include ' + entry.preview" />
                  </label>
                  <div class="entry-body">
                    <p class="entry-preview">{{ entry.preview }}</p>
                    @if (entry.transcript) {
                      <p class="entry-heard">heard: “{{ entry.transcript }}”</p>
                    }
                    <!-- A repaired word is shown, not hidden. If the system
                         acted on a different word than was said, that is
                         exactly what needs checking here. -->
                    @if (entry.corrections.length) {
                      <p class="entry-correction">
                        @for (correction of entry.corrections; track correction.from) {
                          <span class="chip">{{ correction.from }} → {{ correction.to }}</span>
                        }
                      </p>
                    }
                  </div>
                  <time class="entry-time">{{ entry.at | date:'HH:mm' }}</time>
                </li>
              }
            </ul>
          }
        </section>

        <!-- ── Chart ───────────────────────────────────────────────── -->
        <section class="panel">
          <h2>Teeth in this examination</h2>
          @if (stagedTeeth().length === 0) {
            <p class="empty">No tooth-level findings.</p>
          } @else {
            <ul class="tooth-list">
              @for (tooth of stagedTeeth(); track tooth.fdi) {
                <li>
                  <span class="fdi">{{ tooth.fdi }}</span>
                  <div>
                    <p class="tooth-name">{{ tooth.description }}</p>
                    <p class="tooth-findings">
                      @for (label of tooth.labels; track label) {
                        <span class="finding">{{ label }}</span>
                      }
                    </p>
                  </div>
                </li>
              }
            </ul>
          }
        </section>

        <!-- ── Context ─────────────────────────────────────────────── -->
        <section class="panel">
          <h2>Patient context</h2>
          <dl class="context">
            <dt>Allergies</dt>
            <dd [class.alert]="allergies().length > 0">
              {{ allergies().length ? allergies().join(', ') : 'None recorded' }}
            </dd>

            <dt>Active treatments</dt>
            <dd>{{ activeTreatments().length ? activeTreatments().join(', ') : 'None' }}</dd>

            <dt>Next appointment</dt>
            <dd>{{ nextAppointment() ?? 'Not scheduled' }}</dd>

            <dt>Outstanding</dt>
            <dd [class.alert]="outstanding() > 0">
              {{ outstanding() > 0 ? (outstanding() | number:'1.2-2') + ' MAD' : 'Settled' }}
            </dd>
          </dl>
        </section>

        <!-- ── Narrative ───────────────────────────────────────────── -->
        <section class="panel span-2">
          <div class="panel-head">
            <h2>Observation report</h2>
            <button type="button" class="btn btn-ghost btn-sm"
                    (click)="regenerate()" [disabled]="regenerating()">
              {{ regenerating() ? 'Generating…' : 'Regenerate' }}
            </button>
          </div>
          <p class="panel-hint">
            Generated from what was dictated, and saved as a clinical note. Edit it freely — this
            text is not what the findings above are built from.
          </p>

          @if (narrativeError()) {
            <p class="narrative-unavailable">
              No report could be generated ({{ narrativeError() }}). Write the observation yourself,
              or leave it blank — the findings above save either way.
            </p>
          }
          <textarea class="narrative" rows="10" [(ngModel)]="narrativeText"
                    aria-label="Observation report"
                    placeholder="Write the consultation observation…"></textarea>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .review { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .review-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
    }
    .review-header h1 { margin: 0 0 .25rem; font-size: 1.5rem; }
    .sub { margin: 0; color: var(--text-muted, #667); font-size: .9rem; }
    .dot { margin: 0 .4rem; opacity: .5; }
    .header-actions { display: flex; gap: .75rem; }

    .banner {
      padding: .875rem 1rem; border-radius: 8px; margin-bottom: 1.25rem; font-size: .9rem;
    }
    .banner-error { background: #fdecea; border: 1px solid #f5c6cb; color: #8a1c1c; }
    .banner ul { margin: .5rem 0 0; padding-left: 1.25rem; }

    .review-grid {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem;
    }
    .span-2 { grid-column: 1 / -1; }
    @media (max-width: 900px) { .review-grid { grid-template-columns: 1fr; } }

    .panel {
      background: var(--surface, #fff); border: 1px solid var(--border, #e3e6ea);
      border-radius: 10px; padding: 1.25rem;
    }
    .panel h2 { margin: 0 0 .25rem; font-size: 1rem; }
    .panel-head { display: flex; justify-content: space-between; align-items: center; }
    .panel-hint { margin: 0 0 1rem; font-size: .82rem; color: var(--text-muted, #667); }
    .empty { color: var(--text-muted, #889); font-size: .9rem; margin: 0; }

    .entry-list { list-style: none; margin: 0; padding: 0; }
    .entry {
      display: flex; gap: .75rem; align-items: flex-start;
      padding: .75rem 0; border-bottom: 1px solid var(--border-subtle, #f0f2f4);
    }
    .entry:last-child { border-bottom: none; }
    .entry.excluded { opacity: .45; }
    .entry.excluded .entry-preview { text-decoration: line-through; }
    .entry-body { flex: 1; min-width: 0; }
    .entry-preview { margin: 0; font-weight: 500; }
    .entry-heard { margin: .2rem 0 0; font-size: .8rem; color: var(--text-muted, #778); font-style: italic; }
    .entry-correction { margin: .35rem 0 0; display: flex; gap: .35rem; flex-wrap: wrap; }
    .chip {
      font-size: .72rem; padding: .12rem .45rem; border-radius: 999px;
      background: #fff4e5; color: #8a5300; border: 1px solid #ffd9a0;
    }
    .entry-time { font-size: .78rem; color: var(--text-muted, #889); white-space: nowrap; }

    .tooth-list { list-style: none; margin: 0; padding: 0; }
    .tooth-list li { display: flex; gap: .75rem; padding: .5rem 0; align-items: flex-start; }
    .fdi {
      font-weight: 700; min-width: 2.2rem; text-align: center; padding: .15rem .35rem;
      background: var(--surface-alt, #f4f6f8); border-radius: 6px; font-size: .85rem;
    }
    .tooth-name { margin: 0; font-size: .85rem; }
    .tooth-findings { margin: .2rem 0 0; display: flex; gap: .3rem; flex-wrap: wrap; }
    .finding {
      font-size: .75rem; padding: .1rem .4rem; border-radius: 4px;
      background: var(--surface-alt, #eef1f4);
    }

    .context { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: .5rem .875rem; }
    .context dt { font-size: .82rem; color: var(--text-muted, #778); }
    .context dd { margin: 0; font-size: .88rem; }
    .context dd.alert { color: #b02a24; font-weight: 600; }

    .narrative {
      width: 100%; box-sizing: border-box; font: inherit; line-height: 1.6;
      padding: .75rem; border: 1px solid var(--border, #dde1e6); border-radius: 8px; resize: vertical;
    }
    .narrative-unavailable {
      font-size: .85rem; color: #8a5300; background: #fff8ee;
      border: 1px solid #ffe2b8; border-radius: 6px; padding: .6rem .75rem; margin: 0 0 .75rem;
    }

    .btn-sm { font-size: .82rem; padding: .3rem .7rem; }
  `],
})
export class SessionReviewComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sessions = inject(VoiceSessionService);
  private orchestrator = inject(VoiceOrchestratorService);
  private buffer = inject(SessionBufferService);
  private toast = inject(ToastService);
  private patients = inject(PatientService);
  private schedule = inject(ScheduleService);
  private treatments = inject(PatientTreatmentService);
  private clinical = inject(ClinicalRecordService);
  private invoices = inject(InvoiceService);

  private sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
  private patientId = this.route.snapshot.paramMap.get('id') ?? '';

  private entriesSignal = signal<BufferedEntry[]>([]);
  private excludedSignal = signal<Set<string>>(new Set());
  private savingSignal = signal(false);
  private regeneratingSignal = signal(false);
  private failuresSignal = signal<{ auditId: string; errorMessage: string }[]>([]);
  private treatmentsSignal = signal<string[]>([]);
  private nextAppointmentSignal = signal<string | null>(null);
  private outstandingSignal = signal(0);

  entries = this.entriesSignal.asReadonly();
  saving = this.savingSignal.asReadonly();
  regenerating = this.regeneratingSignal.asReadonly();
  failures = this.failuresSignal.asReadonly();
  allergies = computed(() => this.clinical.allergies().map(allergy => allergy.substance));
  activeTreatments = this.treatmentsSignal.asReadonly();
  nextAppointment = this.nextAppointmentSignal.asReadonly();
  outstanding = this.outstandingSignal.asReadonly();
  narrativeError = this.sessions.narrativeError;
  patient = this.patients.currentPatient;

  narrativeText = '';

  included = computed(() =>
    this.entriesSignal().filter(entry => !this.excludedSignal().has(entry.auditId)));

  /** The teeth this examination touched, for the at-a-glance chart panel. */
  stagedTeeth = computed(() => {
    const byTooth = new Map<string, { fdi: string; description: string; labels: string[] }>();
    for (const entry of this.included()) {
      const entities = entry.entities as Record<string, unknown>;
      const fdi = typeof entities['fdi'] === 'string' ? entities['fdi'] : null;
      if (!fdi) continue;

      const row = byTooth.get(fdi) ?? { fdi, description: describeFdi(fdi), labels: [] };
      const codes = Array.isArray(entities['findingCodes'])
        ? (entities['findingCodes'] as unknown[]).map(String)
        : typeof entities['findingCode'] === 'string' ? [entities['findingCode'] as string] : [];
      for (const code of codes) {
        const label = findingLabel(code);
        if (!row.labels.includes(label)) row.labels.push(label);
      }
      byTooth.set(fdi, row);
    }
    return [...byTooth.values()].sort((a, b) => a.fdi.localeCompare(b.fdi));
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    // The in-memory buffer is authoritative when this page was reached by
    // ending a session. IndexedDB is the fallback for a reload or a review
    // resumed later.
    const live = this.orchestrator.buffered();
    if (live.length > 0) {
      this.entriesSignal.set(live);
    } else {
      const stored = await this.buffer.get(this.sessionId);
      this.entriesSignal.set(stored?.commands ?? []);
    }

    this.narrativeText = this.sessions.narrative() ?? '';
    if (!this.narrativeText && !this.sessions.narrativeError()) {
      await this.regenerate();
    }

    void this.loadContext();
  }

  /**
   * The context that makes a finding judgeable. Each source is independent, so
   * one failing must not blank the others — a missing balance is not a reason
   * to hide the allergies.
   */
  private async loadContext(): Promise<void> {
    if (!this.patientId) return;

    // The dossier normally owns this, but the review page can be reached
    // directly by URL after a reload, with nothing loaded.
    if (!this.patients.currentPatient()) {
      this.patients.setCurrentPatient(this.patientId).subscribe({ error: () => undefined });
    }

    // Allergies come from the same signal the dossier reads, refreshed here
    // because a reload lands on this page with an empty store.
    this.clinical.refresh(this.patientId);

    try {
      const treatments = await firstValueFrom(this.treatments.getPatientTreatments(this.patientId));
      this.treatmentsSignal.set(treatments
        .filter(treatment => treatment.status === 'ACTIVE' || treatment.status === 'PLANNED')
        .map(treatment => treatment.treatment?.name ?? 'Treatment'));
    } catch { /* leave empty */ }

    try {
      const invoices = await firstValueFrom(this.invoices.getPatientInvoices(this.patientId));
      this.outstandingSignal.set(invoices
        .filter(invoice => invoice.status !== 'PAID' && invoice.status !== 'CANCELLED')
        .reduce((sum, invoice) => sum + (invoice.balanceDue ?? invoice.total), 0));
    } catch { /* leave at zero */ }

    try {
      const now = Date.now();
      const next = this.schedule.appointments()
        .filter(appointment => appointment.patientId === this.patientId
          && new Date(appointment.dateTime).getTime() > now)
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];
      this.nextAppointmentSignal.set(next ? new Date(next.dateTime).toLocaleString() : null);
    } catch { /* leave null */ }
  }

  isIncluded(auditId: string): boolean {
    return !this.excludedSignal().has(auditId);
  }

  toggle(auditId: string): void {
    this.excludedSignal.update(excluded => {
      const next = new Set(excluded);
      if (next.has(auditId)) next.delete(auditId);
      else next.add(auditId);
      return next;
    });
  }

  async regenerate(): Promise<void> {
    this.regeneratingSignal.set(true);
    try {
      await this.sessions.generateNarrative(this.sessionId);
      const narrative = this.sessions.narrative();
      // An edit in progress is never overwritten by a regeneration the
      // dentist did not ask to replace their text with.
      if (narrative && !this.narrativeText.trim()) this.narrativeText = narrative;
      else if (narrative) this.narrativeText = narrative;
    } finally {
      this.regeneratingSignal.set(false);
    }
  }

  async save(): Promise<void> {
    this.savingSignal.set(true);
    this.failuresSignal.set([]);
    try {
      const approved = this.included().map(entry => entry.auditId);
      const rejected = this.entriesSignal()
        .filter(entry => this.excludedSignal().has(entry.auditId))
        .map(entry => entry.auditId);

      const result = await this.sessions.commit(this.sessionId, approved, rejected, this.narrativeText);

      if (result.ok) {
        this.toast.success(`Saved ${result.executed} finding(s) to the dossier.`);
        await this.router.navigate(['/patients', this.patientId]);
        return;
      }

      // Partial success. The page stays open showing what is left, rather
      // than navigating away and leaving the dentist to discover the gap.
      this.failuresSignal.set(result.failed);
      this.toast.error(`${result.failed.length} finding(s) could not be saved.`);
    } catch {
      this.toast.error('Nothing was saved — check the connection and try again.');
    } finally {
      this.savingSignal.set(false);
    }
  }

  async discardAll(): Promise<void> {
    // Deliberately a plain confirm rather than a silent discard: this throws
    // away an entire consultation, and it cannot be undone from here.
    if (!confirm('Discard this examination? Nothing will be saved to the dossier.')) return;
    await this.buffer.clear(this.sessionId);
    this.orchestrator.resetBuffer();
    await this.router.navigate(['/patients', this.patientId]);
  }
}
