import { Injectable, signal } from '@angular/core';
import {
  DentalChartState,
  DentalChartType,
  ToothState,
  ToothStatus,
  ADULT_TEETH,
  CHILD_TEETH,
} from '../models/patient.model';

/**
 * DentalChartService
 * 
 * Manages dental chart state per patient.
 * State is serialized as a compact JSON string for storage.
 * 
 * Serialized format (compact):
 *   Base64-encoded JSON of { chartType, teeth: { [id]: status } }
 *   Only non-"present" teeth are stored to keep the string minimal.
 */
@Injectable({
  providedIn: 'root',
})
export class DentalChartService {
  // In-memory store keyed by patientId
  private chartStore = new Map<string, DentalChartState>();

  // Current chart being viewed/edited
  currentChart = signal<DentalChartState | null>(null);

  /**
   * Determine chart type based on patient age.
   * Children < 12 years → deciduous (child) chart
   * Adults ≥ 12 years → permanent (adult) chart
   */
  getChartTypeForAge(dateOfBirth: string): DentalChartType {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 12 ? 'child' : 'adult';
  }

  /**
   * Initialize a fresh dental chart with all teeth set to "present".
   */
  createDefaultChart(patientId: string, chartType: DentalChartType): DentalChartState {
    const toothIds = chartType === 'adult' ? ADULT_TEETH : CHILD_TEETH;
    const teeth: Record<string, ToothState> = {};
    for (const id of toothIds) {
      teeth[id] = { id, status: 'present' };
    }
    return {
      patientId,
      chartType,
      teeth,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Load or create a dental chart for a patient.
   */
  loadChart(patientId: string, dateOfBirth: string): DentalChartState {
    // Check in-memory store first
    let chart = this.chartStore.get(patientId);
    if (!chart) {
      // Try loading from localStorage
      const stored = localStorage.getItem(`dental_chart_${patientId}`);
      if (stored) {
        chart = this.deserialize(patientId, stored);
      } else {
        const chartType = this.getChartTypeForAge(dateOfBirth);
        chart = this.createDefaultChart(patientId, chartType);
      }
      this.chartStore.set(patientId, chart);
    }
    this.currentChart.set(chart);
    return chart;
  }

  /**
   * Update a single tooth status.
   */
  updateToothStatus(patientId: string, toothId: string, status: ToothStatus, notes?: string): void {
    const chart = this.chartStore.get(patientId);
    if (!chart) return;

    chart.teeth[toothId] = {
      id: toothId,
      status,
      notes: notes !== undefined ? notes : chart.teeth[toothId]?.notes,
    };
    chart.lastUpdated = new Date().toISOString();
    this.chartStore.set(patientId, chart);
    this.currentChart.set({ ...chart });
    this.saveToLocalStorage(patientId, chart);
  }

  /**
   * Get a tooth's current state.
   */
  getToothState(patientId: string, toothId: string): ToothState | undefined {
    return this.chartStore.get(patientId)?.teeth[toothId];
  }

  /**
   * Serialize chart state to a compact string for storage/transmission.
   * Only stores non-"present" teeth to keep the string minimal.
   */
  serialize(chart: DentalChartState): string {
    const compact: Record<string, any> = {
      t: chart.chartType === 'adult' ? 'a' : 'c',
      d: {} as Record<string, string>,
    };

    for (const [id, tooth] of Object.entries(chart.teeth)) {
      if (tooth.status !== 'present') {
        (compact.d as Record<string, string>)[id] = tooth.status;
        if (tooth.notes) {
          (compact.d as Record<string, string>)[`${id}_n`] = tooth.notes;
        }
      }
    }

    return btoa(JSON.stringify(compact));
  }

  /**
   * Deserialize a compact string back into a full DentalChartState.
   */
  deserialize(patientId: string, encoded: string): DentalChartState {
    try {
      const compact = JSON.parse(atob(encoded));
      const chartType: DentalChartType = compact.t === 'a' ? 'adult' : 'child';
      const chart = this.createDefaultChart(patientId, chartType);

      if (compact.d) {
        for (const [key, value] of Object.entries(compact.d)) {
          if (key.endsWith('_n')) {
            // It's a note
            const toothId = key.replace('_n', '');
            if (chart.teeth[toothId]) {
              chart.teeth[toothId].notes = value as string;
            }
          } else {
            // It's a status
            if (chart.teeth[key]) {
              chart.teeth[key].status = value as ToothStatus;
            }
          }
        }
      }

      return chart;
    } catch {
      // If deserialization fails, return default
      return this.createDefaultChart(patientId, 'adult');
    }
  }

  /**
   * Export chart state as a JSON string (human-readable).
   */
  exportAsJson(patientId: string): string {
    const chart = this.chartStore.get(patientId);
    if (!chart) return '{}';
    return JSON.stringify(chart, null, 2);
  }

  /**
   * Export chart state as a compact encoded string.
   */
  exportAsCompactString(patientId: string): string {
    const chart = this.chartStore.get(patientId);
    if (!chart) return '';
    return this.serialize(chart);
  }

  /**
   * Import chart state from a compact encoded string.
   */
  importFromCompactString(patientId: string, encoded: string): DentalChartState {
    const chart = this.deserialize(patientId, encoded);
    this.chartStore.set(patientId, chart);
    this.currentChart.set(chart);
    this.saveToLocalStorage(patientId, chart);
    return chart;
  }

  /**
   * Persist to localStorage.
   */
  private saveToLocalStorage(patientId: string, chart: DentalChartState): void {
    localStorage.setItem(`dental_chart_${patientId}`, this.serialize(chart));
  }

  /**
   * Color mapping for tooth statuses (used by the chart component).
   */
  static readonly STATUS_COLORS: Record<ToothStatus, string> = {
    present: 'none',
    extracted: '#ef4444',
    composite: '#3b82f6',
    amalgam: '#6b7280',
    crown: '#f59e0b',
    bridge: '#f97316',
    implant: '#8b5cf6',
    veneer: '#06b6d4',
    root_canal: '#ec4899',
    caries: '#dc2626',
    fracture: '#991b1b',
    impacted: '#a855f7',
    deciduous: '#84cc16',
    missing: '#d1d5db',
    post: '#94a3b8',
  };

  /**
   * Human-readable labels for statuses.
   */
  static readonly STATUS_LABELS: Record<ToothStatus, string> = {
    present: 'Present',
    extracted: 'Extracted',
    composite: 'Composite',
    amalgam: 'Amalgam',
    crown: 'Crown',
    bridge: 'Bridge',
    implant: 'Implant',
    veneer: 'Veneer',
    root_canal: 'Root Canal',
    caries: 'Caries',
    fracture: 'Fracture',
    impacted: 'Impacted',
    deciduous: 'Deciduous',
    missing: 'Missing',
    post: 'Post/Nail',
  };
}
