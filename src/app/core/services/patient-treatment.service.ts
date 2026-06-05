import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PatientTreatment } from '../models/patient-treatment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PatientTreatmentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/patients`;

  getPatientTreatments(patientId: string): Observable<PatientTreatment[]> {
    return this.http.get<PatientTreatment[]>(`${this.baseUrl}/${patientId}/treatments`);
  }

  getAllPatientTreatments(): Observable<PatientTreatment[]> {
    return this.http.get<PatientTreatment[]>(`${this.baseUrl}/treatments`);
  }

  getTreatmentById(patientId: string, id: string): Observable<PatientTreatment> {
    return this.http.get<PatientTreatment>(`${this.baseUrl}/${patientId}/treatments/${id}`);
  }

  createPatientTreatment(patientId: string, pt: PatientTreatment): Observable<PatientTreatment> {
    return this.http.post<PatientTreatment>(`${this.baseUrl}/${patientId}/treatments`, pt);
  }

  updatePatientTreatment(patientId: string, id: string, pt: PatientTreatment): Observable<PatientTreatment> {
    return this.http.put<PatientTreatment>(`${this.baseUrl}/${patientId}/treatments/${id}`, pt);
  }

  deletePatientTreatment(patientId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${patientId}/treatments/${id}`);
  }
}
