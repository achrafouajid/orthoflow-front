/**
 * Treatment sessions recorded against a patient.
 *
 * Re-exported from `core/api/contract`. The hand-written version this replaces
 * declared `patient?: Patient` — a nested patient object. The server sends
 * `patientId` and nothing else: `PatientTreatmentResponse` has never contained
 * a nested patient. Anything reading `treatment.patient.firstName` was reading
 * `undefined`.
 */
export type {
  PatientTreatment,
  PatientTreatmentRequest,
} from '../api/contract';

import type { PatientTreatment } from '../api/contract';

export type PatientTreatmentStatus = NonNullable<PatientTreatment['status']>;
export type PatientTreatmentConsumable =
  NonNullable<PatientTreatment['consumables']>[number];
