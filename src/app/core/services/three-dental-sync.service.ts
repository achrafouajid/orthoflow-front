import { Injectable, signal, computed, inject } from '@angular/core';
import { ToothState, ToothStatus } from '../models/patient.model';
import { DentalChartService } from './dental-chart.service';

export type ViewType = 'top' | 'frontal' | 'internal' | 'roots';

export interface AuditEntry {
  user: string;
  timestamp: string;
  toothId: string;
  viewModified: ViewType;
  previousStatus: ToothStatus;
  newStatus: ToothStatus;
  autoSyncTriggered: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ThreeDentalSyncService {
  private dentalChartService = inject(DentalChartService);

  // We keep a separate status map for each view, and a shared one where applicable.
  // By default, Top, Frontal, Internal views are kept synchronized, whereas Roots is isolated.
  private teethStates = signal<Record<ViewType, Record<string, ToothState>>>({
    top: {},
    frontal: {},
    internal: {},
    roots: {},
  });

  private auditLog = signal<AuditEntry[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  // Get state for a specific view
  getViewTeethState(view: ViewType) {
    return computed(() => this.teethStates()[view]);
  }

  // Get frontal teeth for overview
  getFrontalTeethForOverview = computed(() => this.teethStates().frontal);

  // Get full state signal
  getAllTeethStates() {
    return this.teethStates.asReadonly();
  }

  // Get audit log
  getAuditLog() {
    return this.auditLog.asReadonly();
  }

  // Initialize/load patient's state
  initPatientState(patientId: string, baseTeeth: Record<string, ToothState> = {}) {
    const stored = localStorage.getItem(`orthoflow_3d_state_${patientId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.teethStates.set(parsed.teethStates);
        this.auditLog.set(parsed.auditLog || []);
        return;
      } catch (e) {
        console.error('Failed to parse stored 3D dental state', e);
      }
    }

    // Default: initialize all views with base teeth or service data
    const chartData = this.dentalChartService.getAllTeeth();
    const sourceData = Object.keys(chartData).length > 0 ? chartData : baseTeeth;

    const initial: Record<ViewType, Record<string, ToothState>> = {
      top: JSON.parse(JSON.stringify(sourceData)),
      frontal: JSON.parse(JSON.stringify(sourceData)),
      internal: JSON.parse(JSON.stringify(sourceData)),
      roots: JSON.parse(JSON.stringify(sourceData)),
    };
    this.teethStates.set(initial);
    this.auditLog.set([]);
  }

  // Update tooth status and handle synchronization
  setToothStatus(
    patientId: string,
    toothId: string,
    status: ToothStatus,
    sourceView: ViewType,
    notes: string = '',
    user: string = 'Doctor'
  ) {
    const currentState = this.teethStates();
    const previousStatus = currentState[sourceView][toothId]?.status || 'present';

    if (previousStatus === status && currentState[sourceView][toothId]?.notes === notes) {
      return; // No change
    }

    const updated = JSON.parse(JSON.stringify(currentState)) as Record<ViewType, Record<string, ToothState>>;
    const timestamp = new Date().toISOString();
    const logs: AuditEntry[] = [];

    // 1. Update the source view
    if (!updated[sourceView][toothId]) {
      updated[sourceView][toothId] = { id: toothId, status: 'present' };
    }
    updated[sourceView][toothId].status = status;
    updated[sourceView][toothId].notes = notes;

    // Log the manual change
    logs.push({
      user,
      timestamp,
      toothId,
      viewModified: sourceView,
      previousStatus,
      newStatus: status,
      autoSyncTriggered: false,
    });

    // 2. Handle propagation/synchronization rules
    // Synchronization triggers between Top, Frontal, and Internal views. Roots view remains isolated.
    const syncGroup: ViewType[] = ['top', 'frontal', 'internal'];
    if (syncGroup.includes(sourceView)) {
      syncGroup.forEach((view) => {
        if (view !== sourceView) {
          const prevViewStatus = updated[view][toothId]?.status || 'present';
          if (prevViewStatus !== status) {
            if (!updated[view][toothId]) {
              updated[view][toothId] = { id: toothId, status: 'present' };
            }
            updated[view][toothId].status = status;
            updated[view][toothId].notes = notes;

            // Log the automatic synchronization
            logs.push({
              user: 'System (Sync)',
              timestamp,
              toothId,
              viewModified: view,
              previousStatus: prevViewStatus,
              newStatus: status,
              autoSyncTriggered: true,
            });
          }
        }
      });
    }

    // Update state signals
    this.teethStates.set(updated);
    this.auditLog.update((l) => [...logs, ...l]);

    // Sync with main chart service
    this.dentalChartService.updateTooth(toothId, { status, notes }, `3d_${sourceView}`);

    // Save to storage
    this.saveToStorage(patientId);
  }

  private saveToStorage(patientId: string) {
    localStorage.setItem(
      `orthoflow_3d_state_${patientId}`,
      JSON.stringify({
        teethStates: this.teethStates(),
        auditLog: this.auditLog(),
      })
    );
  }

  private loadFromStorage() {
    // Shared defaults on launch, initialized specifically per patient in initPatientState
  }
}
