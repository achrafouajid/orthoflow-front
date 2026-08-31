import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Patient } from '../models/patient.model';
import { environment } from '../../../environments/environment';

/** Shape of a Spring Data Page<T> response. */
interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class PatientApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/patients`;

  /**
   * The backend now returns a paginated Page<Patient> (bounded to 200 by
   * default) instead of an unbounded array (audit II.8). Unwrapped here so
   * every existing caller — dashboard stats, dossier balance calculations,
   * the patient list — keeps working against a plain Patient[] unchanged.
   */
  getPatients(): Observable<Patient[]> {
    return this.http.get<SpringPage<Patient>>(this.apiUrl).pipe(
      map(page => page.content)
    );
  }

  getPatient(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`);
  }

  createPatient(patient: Partial<Patient>): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, patient);
  }

  updatePatient(id: string, patient: Partial<Patient>): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, patient);
  }

  deletePatient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** GDPR Art. 6/7 consent capture (audit V.8) — ADMIN-only on the backend. */
  recordConsent(patientId: string, notes?: string): Observable<Patient> {
    return this.http.post<Patient>(`${this.apiUrl}/${patientId}/compliance/consent`, notes ? { notes } : {});
  }

  /** GDPR Art. 15/20 data export (audit V.8) — ADMIN-only on the backend. */
  exportPatientData(patientId: string): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/${patientId}/compliance/export`);
  }
}
