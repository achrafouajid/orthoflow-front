import { Injectable, signal, computed, inject } from '@angular/core';
import { Patient, MedicalHistory, TreatmentPlan, Appointment, ClinicalNote, PatientDocument, SimulationMetadata } from '../models/patient.model';
import { PatientApiService } from './patient-api.service';
import { finalize, tap, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private api = inject(PatientApiService);
  
  // Signals for state management
  private patientsSignal = signal<Patient[]>([]);
  private currentPatientSignal = signal<Patient | null>(null);
  private loadingSignal = signal<boolean>(false);
  
  // Public selectors
  patients = computed(() => this.patientsSignal());
  currentPatient = computed(() => this.currentPatientSignal());
  loading = computed(() => this.loadingSignal());

  constructor() {
    this.refreshPatients();
  }

  refreshPatients(): void {
    this.loadingSignal.set(true);
    this.api.getPatients()
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (patients) => this.patientsSignal.set(patients),
        error: (err) => {
          console.error('Failed to load patients', err);
          // Fallback to mock data if API fails (for demo purposes)
          this.loadMockPatients();
        }
      });
  }

  loadMockPatients() {
    const mockPatients: Patient[] = [
      {
        id: '1',
        firstName: 'Amine',
        lastName: 'El Mansouri',
        dateOfBirth: '1995-03-15',
        gender: 'M',
        email: 'amine.m@email.com',
        phone: '+212 600-000000',
        address: 'Casablanca, Morocco',
        cin: 'BK123456',
        insuranceProvider: 'CNOPS',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        dateOfBirth: '2008-07-22',
        gender: 'F',
        email: 'sarah.j@email.com',
        phone: '+1 555-0123',
        address: 'New York, USA',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    this.patientsSignal.set(mockPatients);
  }

  setCurrentPatient(id: string): void {
    const patient = this.patientsSignal().find(p => p.id === id);
    if (patient) {
      this.currentPatientSignal.set(patient);
    } else {
      this.loadingSignal.set(true);
      this.api.getPatient(id)
        .pipe(finalize(() => this.loadingSignal.set(false)))
        .subscribe({
          next: (p) => this.currentPatientSignal.set(p),
          error: () => this.currentPatientSignal.set(null)
        });
    }
  }

  addPatient(patient: Partial<Patient>): Observable<Patient> {
    this.loadingSignal.set(true);
    return this.api.createPatient(patient).pipe(
      tap(newPatient => {
        this.patientsSignal.update(patients => [...patients, newPatient]);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  updatePatient(id: string, patient: Partial<Patient>): Observable<Patient> {
    this.loadingSignal.set(true);
    return this.api.updatePatient(id, patient).pipe(
      tap(updated => {
        this.patientsSignal.update(patients => 
          patients.map(p => p.id === id ? updated : p)
        );
        if (this.currentPatientSignal()?.id === id) {
          this.currentPatientSignal.set(updated);
        }
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  deletePatient(id: string): Observable<void> {
    this.loadingSignal.set(true);
    return this.api.deletePatient(id).pipe(
      tap(() => {
        this.patientsSignal.update(patients => patients.filter(p => p.id !== id));
        if (this.currentPatientSignal()?.id === id) {
          this.currentPatientSignal.set(null);
        }
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  // Mock methods for dossier data (stays for now)
  getMedicalHistory(patientId: string): MedicalHistory {
    return {
      patientId,
      generalHealth: 'Good',
      allergies: ['Penicillin'],
      medications: [],
      previousOrthoTreatment: false,
      chiefComplaint: 'Crowding in upper jaw'
    };
  }

  getTreatmentPlan(patientId: string): TreatmentPlan {
    return {
      id: 'tp1',
      patientId,
      goals: ['Align upper and lower teeth', 'Correct overbite'],
      applianceType: 'Invisalign',
      strippingRequired: true,
      estimatedDurationMonths: 18,
      status: 'ACTIVE',
      version: 1
    };
  }

  getAppointments(patientId: string): Appointment[] {
    return [
      {
        id: 'a1',
        patientId,
        dateTime: new Date().toISOString(),
        type: 'Checkup',
        status: 'SCHEDULED',
        applianceStep: 5
      }
    ];
  }

  getClinicalNotes(patientId: string): ClinicalNote[] {
    return [
      {
        id: 'n1',
        patientId,
        authorId: 'dr1',
        content: 'Patient showing good compliance with aligners.',
        createdAt: new Date().toISOString(),
        type: 'PROGRESS'
      }
    ];
  }

  getDocuments(patientId: string): PatientDocument[] {
    return [
      {
        id: 'd1',
        patientId,
        name: 'Panoramic X-Ray',
        type: 'XRAY',
        url: 'assets/mock/xray.jpg',
        createdAt: new Date().toISOString()
      }
    ];
  }

  getSimulationMetadata(patientId: string): SimulationMetadata {
    return {
      id: 's1',
      patientId,
      externalLink: 'https://sim-viewer.orthoflow.com/p/1',
      stepCount: 24,
      lastUpdated: new Date().toISOString()
    };
  }
}
