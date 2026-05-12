import { Injectable, signal, computed } from '@angular/core';
import { Appointment } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private appointmentsSignal = signal<Appointment[]>([]);
  
  appointments = computed(() => this.appointmentsSignal());

  constructor() {
    this.loadMockAppointments();
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

  addAppointment(appointment: Omit<Appointment, 'id'>) {
    const newApp: Appointment = {
      ...appointment,
      id: Math.random().toString(36).substring(2, 9)
    };
    this.appointmentsSignal.update(apps => [...apps, newApp]);
    return newApp;
  }
}
