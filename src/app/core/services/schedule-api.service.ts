import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment, Chair } from '../models/patient.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScheduleApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/appointments`;
  private chairsUrl = `${environment.apiUrl}/api/v1/scheduling/chairs`;

  getChairs(): Observable<Chair[]> {
    return this.http.get<Chair[]>(this.chairsUrl);
  }

  /**
   * Pass a range to load only the window a screen needs — omitting one
   * falls back to the full history (see audit II.8/VI.4).
   */
  getAppointments(range?: { from: Date; to: Date }): Observable<Appointment[]> {
    let params = new HttpParams();
    if (range) {
      params = params.set('from', range.from.toISOString()).set('to', range.to.toISOString());
    }
    return this.http.get<Appointment[]>(this.apiUrl, { params });
  }

  getAppointment(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  createAppointment(appointment: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointment);
  }

  updateAppointment(id: string, appointment: Partial<Appointment>): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, appointment);
  }

  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
