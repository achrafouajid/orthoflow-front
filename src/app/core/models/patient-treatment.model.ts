import { Patient } from './patient.model';
import { Treatment, StockItem } from './stock.model';

export type PatientTreatmentStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface PatientTreatmentConsumable {
  id?: string;
  stockItem: StockItem;
  quantityUsed: number;
  pricePerUnit: number;
  notes?: string;
}

export interface PatientTreatment {
  id?: string;
  patient?: Patient;
  treatment: Treatment;
  teeth: string; // Comma-separated list of FDI tooth numbers
  status: PatientTreatmentStatus;
  progress: number; // 0 to 100
  notes?: string;
  doctorName?: string;
  startDate?: string;
  endDate?: string;
  consumables?: PatientTreatmentConsumable[];
  createdAt?: string;
  updatedAt?: string;
}
