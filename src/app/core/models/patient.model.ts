/**
 * Patient and scheduling types.
 *
 * Wire types are re-exported from `core/api/contract`, which derives them from
 * the OpenAPI document the backend publishes. They used to be hand-written
 * here, duplicating the server's shape with nothing comparing the two — see the
 * header of `core/api/contract.ts` for why that mattered.
 *
 * What remains defined in this file is the dental chart, which is genuinely
 * client-side: `ToothStatus` and the FDI tooth lists describe how the chart is
 * drawn and are not a projection of any endpoint.
 *
 * Four interfaces were removed rather than migrated — `MedicalHistory`,
 * `TreatmentPlan`, `PatientDocument` and `SimulationMetadata` — along with a
 * second `ClinicalNote` that shadowed the one in `clinical-record.model.ts`.
 * None had a backend counterpart and none had a single reference outside this
 * file; they described endpoints that were planned and never built.
 */

export type {
  Patient,
  PatientGender,
  PatientStatus,
  PatientSummary,
  Appointment,
  AppointmentStatus,
  Chair,
} from '../api/contract';

// ── Dental chart (client-side) ─────────────────────────────────────────

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
