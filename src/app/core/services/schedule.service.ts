import { Injectable, signal, computed, inject } from '@angular/core';
import { Appointment } from '../models/patient.model';
import { ScheduleApiService } from './schedule-api.service';
import { finalize, tap, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private api = inject(ScheduleApiService);
  
  private appointmentsSignal = signal<Appointment[]>([]);
  private loadingSignal = signal<boolean>(false);
  
  appointments = computed(() => this.appointmentsSignal());
  loading = computed(() => this.loadingSignal());

  constructor() {
    this.refreshAppointments();
  }

  refreshAppointments(): void {
    this.loadingSignal.set(true);
    this.api.getAppointments()
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (apps) => this.appointmentsSignal.set(apps),
        error: (err) => {
          console.error('Failed to load appointments', err);
          this.loadMockAppointments();
        }
      });
  }

  loadMockAppointments() {
    const today = new Date();
    const mockAppointments: Appointment[] = [
      {
        id: 'a1',
        patientId: '1',
        dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
        type: 'Checkup',
        status: 'SCHEDULED',
        notes: 'Check aligner fit (step 5)',
        applianceStep: 5
      },
      {
        id: 'a2',
        patientId: '2',
        dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 14, 30).toISOString(),
        type: 'Initial Fit',
        status: 'SCHEDULED',
        notes: 'Delivery of first set of aligners'
      },
      {
        id: 'a3',
        patientId: '1',
        dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 11, 0).toISOString(),
        type: 'Emergency',
        status: 'COMPLETED',
        notes: 'Fixed broken attachment'
      }
    ];
    this.appointmentsSignal.set(mockAppointments);
  }

  getAppointmentsByRange(start: Date, end: Date) {
    return this.appointmentsSignal().filter(app => {
      const date = new Date(app.dateTime);
      return date >= start && date <= end;
    });
  }

  addAppointment(appointment: Partial<Appointment>): Observable<Appointment> {
    this.loadingSignal.set(true);
    return this.api.createAppointment(appointment).pipe(
      tap(newApp => {
        this.appointmentsSignal.update(apps => [...apps, newApp]);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  updateAppointment(id: string, appointment: Partial<Appointment>): Observable<Appointment> {
    this.loadingSignal.set(true);
    return this.api.updateAppointment(id, appointment).pipe(
      tap(updated => {
        this.appointmentsSignal.update(apps => 
          apps.map(a => a.id === id ? updated : a)
        );
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  deleteAppointment(id: string): Observable<void> {
    this.loadingSignal.set(true);
    return this.api.deleteAppointment(id).pipe(
      tap(() => {
        this.appointmentsSignal.update(apps => apps.filter(a => a.id !== id));
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
}
