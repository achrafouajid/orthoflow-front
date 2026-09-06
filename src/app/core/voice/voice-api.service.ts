import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PatientClinicalRecord } from '../models/clinical-record.model';
import { CommandOutcome, ConfirmationStatus, ResolverKind, RiskTier } from './voice-intent.model';

export interface IntentDescriptorDto {
  id: string;
  description: string;
  args: Record<string, string>;
  examples: string[];
}

export interface InterpretRequestDto {
  transcript: string;
  locale: string;
  module: string;
  selectedFdi: string | null;
  patientContext: boolean;
  chartType: string;
  recentUtterances: string[];
  availableIntents: IntentDescriptorDto[];
  findingCodes: string[];
  sessionId: string | null;
}

export interface InterpretResponseDto {
  intent: string | null;
  entities: Record<string, unknown>;
  confidence: number;
  clarification: string | null;
  resolver: string;
  provider: string;
  error: string | null;
}

export interface TranscriptionResponseDto {
  /** The recognised text, or '' when the server produced none. */
  text: string;
  provider: string;
  model: string;
  /** Language Whisper detected for the clip, when it reported one. */
  language: string | null;
  /**
   * Non-null when the server did not transcribe: 'stt-disabled' (server-side
   * STT is off), 'stt-not-configured', or an upstream failure tag. The client
   * falls back to the browser recogniser rather than treating it as an error.
   */
  error: string | null;
}

export interface RecordVoiceCommandDto {
  patientId: string | null;
  sessionId: string | null;
  transcript: string;
  locale: string;
  intent: string;
  entities: string;
  resolver: ResolverKind;
  confidence: number | null;
  module: string;
  riskTier: RiskTier;
  confirmationStatus: ConfirmationStatus;
  outcome: CommandOutcome;
  targetType?: string | null;
  targetId?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  errorMessage?: string | null;
}

export interface VoiceCommandAuditDto extends RecordVoiceCommandDto {
  id: string;
  actorId: string;
  occurredAt: string;
  undoneAt: string | null;
}

/** Server intents the audit row can be executed as on confirmation. */
export type ServerIntent =
  | 'clinical.addFindings'
  | 'clinical.retractFindings'
  | 'clinical.addNote'
  | 'clinical.addAllergy'
  | 'clinical.addMedicalHistory';

export interface VoiceSessionDto {
  id: string;
  patientId: string | null;
  actorId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  locale: string | null;
  summary: string | null;
  startedAt: string;
  endedAt: string | null;
  confirmedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class VoiceApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/voice`;

  /**
   * Fallback interpretation for an utterance the on-device grammar declined.
   * Returns a *proposed* intent or a question — never a performed action.
   */
  interpret(request: InterpretRequestDto): Observable<InterpretResponseDto> {
    return this.http.post<InterpretResponseDto>(`${this.base}/interpret`, request);
  }

  /**
   * Sends one captured clip to the server's Whisper proxy and gets back a
   * transcript, which the pipeline then treats identically to a
   * browser-recognised or typed utterance. The API key stays on the server;
   * the browser never sees it.
   *
   * Do not set Content-Type — the browser adds the multipart boundary.
   */
  transcribe(audio: Blob, filename: string, language?: string): Observable<TranscriptionResponseDto> {
    const form = new FormData();
    form.append('file', audio, filename);
    if (language) form.append('language', language);
    return this.http.post<TranscriptionResponseDto>(`${this.base}/transcribe`, form);
  }

  /**
   * Logs one interpreted command.
   *
   * For a SAFE command (navigation, reads) the client has already acted by
   * the time this is called. For a CONFIRM command this must carry
   * `confirmationStatus: 'PENDING'` and **nothing has been written yet** —
   * the server refuses any other status on that tier. The write happens in
   * {@link confirmCommand}, re-derived from this row.
   */
  recordCommand(entry: RecordVoiceCommandDto): Observable<VoiceCommandAuditDto> {
    return this.http.post<VoiceCommandAuditDto>(`${this.base}/commands`, entry);
  }

  /**
   * Executes a pending command from its own audit row.
   *
   * The client deliberately sends no payload: the server replays exactly what
   * it recorded and showed the doctor, so what executes cannot drift from
   * what was previewed and confirmed.
   */
  confirmCommand(auditId: string): Observable<VoiceCommandAuditDto> {
    return this.http.post<VoiceCommandAuditDto>(`${this.base}/commands/${auditId}/confirm`, {});
  }

  rejectCommand(auditId: string): Observable<VoiceCommandAuditDto> {
    return this.http.post<VoiceCommandAuditDto>(`${this.base}/commands/${auditId}/reject`, {});
  }

  auditForPatient(patientId: string): Observable<VoiceCommandAuditDto[]> {
    return this.http.get<VoiceCommandAuditDto[]>(`${this.base}/commands`, { params: { patientId } });
  }

  startSession(patientId: string | null, locale: string): Observable<VoiceSessionDto> {
    return this.http.post<VoiceSessionDto>(`${this.base}/sessions`, { patientId, locale });
  }

  completeSession(
    sessionId: string,
    body: { status: 'COMPLETED' | 'ABANDONED'; summary?: string; confirmed: boolean },
  ): Observable<VoiceSessionDto> {
    return this.http.post<VoiceSessionDto>(`${this.base}/sessions/${sessionId}/end`, body);
  }

  /** Read back from the clinical tables — what the session actually persisted. */
  sessionSummary(sessionId: string): Observable<PatientClinicalRecord> {
    return this.http.get<PatientClinicalRecord>(`${this.base}/sessions/${sessionId}/summary`);
  }

  lexicon(): Observable<{ codes: string[]; definitions: unknown[] }> {
    return this.http.get<{ codes: string[]; definitions: unknown[] }>(`${this.base}/lexicon`);
  }
}
