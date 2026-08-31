import { Injectable, signal, computed, inject } from '@angular/core';
import { Appointment, Chair } from '../models/patient.model';
import { ScheduleApiService } from './schedule-api.service';
import { finalize, tap, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private api = inject(ScheduleApiService);

  private appointmentsSignal = signal<Appointment[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private chairsSignal = signal<Chair[]>([]);

  appointments = computed(() => this.appointmentsSignal());
  loading = computed(() => this.loadingSignal());
  error = computed(() => this.errorSignal());
  chairs = computed(() => this.chairsSignal());

  constructor() {
    this.refreshAppointments();
    this.api.getChairs().subscribe({
      next: (chairs) => this.chairsSignal.set(chairs),
      error: (err) => console.error('Failed to load chairs', err)
    });
  }

  /**
   * Defaults to a bounded window (3 months back, 6 months ahead) instead of
   * the entire appointment history — that used to be loaded in full and
   * filtered client-side to render a single day (audit II.8/VI.4). Pass an
   * explicit range for a narrower or wider fetch.
   */
  refreshAppointments(range?: { from: Date; to: Date }): void {
    const effectiveRange = range ?? this.defaultRange();
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getAppointments(effectiveRange)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (apps) => this.appointmentsSignal.set(apps),
        error: (err) => {
          console.error('Failed to load appointments', err);
          this.errorSignal.set('Failed to load appointments.');
        }
      });
  }

  private defaultRange(): { from: Date; to: Date } {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 7, 0);
    return { from, to };
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
