export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'O';
  email: string;
  phone: string;
  address: string;
  cin?: string; // Morocco specific
  insuranceProvider?: string;
  insuranceNumber?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  createdAt: string;
  updatedAt: string;
}

export interface MedicalHistory {
  patientId: string;
  generalHealth: string;
  allergies: string[];
  medications: string[];
  previousOrthoTreatment: boolean;
  chiefComplaint: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  goals: string[];
  applianceType: string;
  extractionPlan?: string;
  strippingRequired: boolean;
  estimatedDurationMonths: number;
  status: 'PROPOSED' | 'APPROVED' | 'ACTIVE' | 'COMPLETED';
  version: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  dateTime: string;
  type: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  applianceStep?: number;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  authorId: string;
  content: string;
  createdAt: string;
  type: 'PROGRESS' | 'SOAP' | 'URGENT';
}

export interface PatientDocument {
  id: string;
  patientId: string;
  name: string;
  type: 'PHOTO' | 'XRAY' | 'STL' | 'CBCT' | 'CONSENT' | 'PRESCRIPTION';
  url: string;
  createdAt: string;
}

export interface SimulationMetadata {
  id: string;
  patientId: string;
  externalLink?: string;
  snapshotUrl?: string;
  stepCount: number;
  lastUpdated: string;
}

// ── Dental Chart State Models ──────────────────────────────────────────

export type ToothStatus =
  | 'present'       // Normal / healthy tooth
  | 'extracted'     // Tooth has been removed
  | 'composite'     // Composite filling (obturation composite)
  | 'amalgam'       // Amalgam filling (obturation amalgame)
  | 'crown'         // Prothèse couronne
  | 'bridge'        // Part of a bridge
  | 'implant'       // Implant dentaire
  | 'veneer'        // Facette
  | 'root_canal'    // Traitement endodontique
  | 'caries'        // Carie active
  | 'fracture'      // Fracture dentaire
  | 'impacted'      // Dent incluse
  | 'deciduous'     // Dent de lait (primary tooth still present)
  | 'missing'       // Congenitally missing
  | 'post';          // Pivot / Nail / Post

export interface ToothState {
  id: string;           // FDI notation: "11", "21", "55", "85", etc.
  status: ToothStatus;
  notes?: string;       // Optional clinical note per tooth
}

export type DentalChartType = 'adult' | 'child';

export interface DentalChartState {
  patientId: string;
  chartType: DentalChartType;
  teeth: Record<string, ToothState>;  // keyed by FDI tooth number
  lastUpdated: string;
}

// Adult teeth (FDI notation): Q1: 11-18, Q2: 21-28, Q3: 31-38, Q4: 41-48
export const ADULT_TEETH: string[] = [
  '11','12','13','14','15','16','17','18',
  '21','22','23','24','25','26','27','28',
  '31','32','33','34','35','36','37','38',
  '41','42','43','44','45','46','47','48',
];

// Child teeth (FDI notation): Q5: 51-55, Q6: 61-65, Q7: 71-75, Q8: 81-85
export const CHILD_TEETH: string[] = [
  '51','52','53','54','55',
  '61','62','63','64','65',
  '71','72','73','74','75',
  '81','82','83','84','85',
];
