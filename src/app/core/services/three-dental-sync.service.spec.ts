import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThreeDentalSyncService } from './three-dental-sync.service';
import { ToothState } from '../models/patient.model';

describe('ThreeDentalSyncService', () => {
  let service: ThreeDentalSyncService;
  const patientId = 'test-patient-123';
  const initialTeeth: Record<string, ToothState> = {
    '11': { id: '11', status: 'present', notes: '' },
    '26': { id: '26', status: 'present', notes: '' },
  };

  beforeEach(() => {
    localStorage.clear();
    service = new ThreeDentalSyncService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize state for all views', () => {
    service.initPatientState(patientId, initialTeeth);
    const states = service.getAllTeethStates()();

    expect(states.top['11'].status).toBe('present');
    expect(states.frontal['11'].status).toBe('present');
    expect(states.internal['11'].status).toBe('present');
    expect(states.roots['11'].status).toBe('present');
  });

  it('should propagate synchronizable statuses between Top, Frontal, and Internal views', () => {
    service.initPatientState(patientId, initialTeeth);

    // Set Tooth 11 to extracted from Frontal view
    service.setToothStatus(patientId, '11', 'extracted', 'frontal', 'Tooth extracted', 'Dr. Smith');

    const states = service.getAllTeethStates()();

    // Sync targets should be updated
    expect(states.frontal['11'].status).toBe('extracted');
    expect(states.top['11'].status).toBe('extracted');
    expect(states.internal['11'].status).toBe('extracted');
    expect(states.frontal['11'].notes).toBe('Tooth extracted');
    expect(states.top['11'].notes).toBe('Tooth extracted');
    expect(states.internal['11'].notes).toBe('Tooth extracted');

    // Roots view should remain present (isolated)
    expect(states.roots['11'].status).toBe('present');
  });

  it('should isolate Roots view status updates', () => {
    service.initPatientState(patientId, initialTeeth);

    // Set Tooth 26 to root_canal in Roots view
    service.setToothStatus(patientId, '26', 'root_canal', 'roots', 'Endodontic root work', 'Dr. Smith');

    const states = service.getAllTeethStates()();

    // Roots view updated
    expect(states.roots['26'].status).toBe('root_canal');
    expect(states.roots['26'].notes).toBe('Endodontic root work');

    // Non-roots views should remain present (isolated)
    expect(states.top['26'].status).toBe('present');
    expect(states.frontal['26'].status).toBe('present');
    expect(states.internal['26'].status).toBe('present');
  });

  it('should generate audit entries for manual changes and automatic synchronizations', () => {
    service.initPatientState(patientId, initialTeeth);

    service.setToothStatus(patientId, '11', 'caries', 'frontal', 'Caries on labial', 'Dr. Smith');

    const audit = service.getAuditLog()();

    // Since we updated 'frontal', system automatically updated 'top' and 'internal'.
    // That means we expect 3 audit entries: 1 manual + 2 auto-syncs.
    expect(audit.length).toBe(3);

    const manualEntry = audit.find(e => !e.autoSyncTriggered);
    expect(manualEntry).toBeDefined();
    expect(manualEntry?.viewModified).toBe('frontal');
    expect(manualEntry?.newStatus).toBe('caries');
    expect(manualEntry?.user).toBe('Dr. Smith');

    const autoEntries = audit.filter(e => e.autoSyncTriggered);
    expect(autoEntries.length).toBe(2);
    autoEntries.forEach(e => {
      expect(['top', 'internal']).toContain(e.viewModified);
      expect(e.newStatus).toBe('caries');
      expect(e.user).toBe('System (Sync)');
    });
  });
});
