import { Injectable, signal, computed } from '@angular/core';
import { Patient, MedicalHistory, TreatmentPlan, Appointment, ClinicalNote, PatientDocument, SimulationMetadata } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  // Signals for state management
  private patientsSignal = signal<Patient[]>([]);
  private currentPatientSignal = signal<Patient | null>(null);
  
  // Public selectors
  patients = computed(() => this.patientsSignal());
  currentPatient = computed(() => this.currentPatientSignal());

  constructor() {
    // Initialize with mock data for Sprint 3/4 demo
    this.loadMockPatients();
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

  setCurrentPatient(id: string) {
    const patient = this.patientsSignal().find(p => p.id === id);
    this.currentPatientSignal.set(patient || null);
  }

  addPatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) {
    const newPatient: Patient = {
      ...patient,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.patientsSignal.update(patients => [...patients, newPatient]);
    return newPatient;
  }

  // Mock methods for dossier data
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
