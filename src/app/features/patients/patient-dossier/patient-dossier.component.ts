import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { DentalChartService } from '../../../core/services/dental-chart.service';
import { Patient, DentalChartState, DentalChartType, ToothState } from '../../../core/models/patient.model';
import { DentalChartComponent } from '../../dental-chart/dental-chart.component';

@Component({
  selector: 'app-patient-dossier',
  standalone: true,
  imports: [CommonModule, RouterModule, DentalChartComponent],
  template: `
    <div class="dossier-container">
      @if (patientService.currentPatient(); as patient) {
      <!-- Dossier Header -->
      <header class="dossier-header">
        <div class="header-top">
          <button class="back-btn" routerLink="/patients">
            <span class="material-icons">arrow_back</span>
          </button>
          <div class="patient-title">
            <h1>{{ patient.firstName }} {{ patient.lastName }}</h1>
            <span class="status-badge active">{{ patient.status }}</span>
          </div>
          <div class="header-actions">
            <button class="btn-outline">
              <span class="material-icons">print</span>
              Print Report
            </button>
            <button class="btn-primary">
              <span class="material-icons">edit</span>
              Edit Patient
            </button>
          </div>
        </div>

        <div class="patient-quick-info">
          <div class="info-item">
            <span class="label">Age</span>
            <span class="value">{{ calculateAge(patient.dateOfBirth) }} yrs</span>
          </div>
          <div class="info-divider"></div>
          <div class="info-item">
            <span class="label">Gender</span>
            <span class="value">{{ patient.gender === 'M' ? 'Male' : 'Female' }}</span>
          </div>
          <div class="info-divider"></div>
          <div class="info-item">
            <span class="label">Phone</span>
            <span class="value">{{ patient.phone }}</span>
          </div>
          <div class="info-divider"></div>
          <div class="info-item">
            <span class="label">CIN</span>
            <span class="value">{{ patient.cin || 'N/A' }}</span>
          </div>
          <div class="info-divider"></div>
          <div class="info-item">
            <span class="label">Insurance</span>
            <span class="value">{{ patient.insuranceProvider || 'Private' }}</span>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <nav class="dossier-tabs">
          @for (tab of tabs; track tab.id) {
            <button 
              [class.active]="activeTab() === tab.id"
              (click)="activeTab.set(tab.id)"
            >
              <span class="material-icons">{{ tab.icon }}</span>
              {{ tab.label }}
            </button>
          }
        </nav>
      </header>

      <!-- Main Content Area -->
      <main class="dossier-content">
        @switch (activeTab()) {
          @case ('overview') {
            <div class="tab-pane">
              <div class="overview-grid">
                <!-- Summary Cards -->
                <div class="summary-card">
                  <h3>Next Appointment</h3>
                  <div class="card-content">
                    <span class="date">May 24, 2026 - 10:00 AM</span>
                    <span class="desc">Regular checkup & Aligner check</span>
                  </div>
                </div>
                <div class="summary-card">
                  <h3>Latest Note</h3>
                  <div class="card-content">
                    <p>"Patient is responding well to treatment. Aligner 5 fits perfectly."</p>
                    <span class="date">May 10, 2026</span>
                  </div>
                </div>
                <div class="summary-card dental-chart-card">
                  <div class="chart-card-header">
                    <h3>Dental Chart</h3>
                    <button class="btn-sm btn-outline" (click)="showDentalChartFullscreen.set(!showDentalChartFullscreen())">
                      <span class="material-icons">{{ showDentalChartFullscreen() ? 'close_fullscreen' : 'open_in_full' }}</span>
                    </button>
                  </div>
                  @if (dentalChartState) {
                    <app-dental-chart
                      [chartType]="dentalChartState.chartType"
                      [patientId]="dentalChartState.patientId"
                      [teeth]="dentalChartState.teeth"
                      [interactive]="true"
                      (toothSelected)="onToothSelected($event)"
                    />
                  }
                </div>
              </div>
            </div>
          }
          @case ('history') {
            <div class="tab-pane">
              <section class="dossier-section">
                <h2>Medical History</h2>
                <div class="history-content">
                  <div class="info-group">
                    <label>General Health</label>
                    <p>Excellent, no chronic conditions reported.</p>
                  </div>
                  <div class="info-group">
                    <label>Allergies</label>
                    <div class="tag-list">
                      <span class="tag alert">Penicillin</span>
                      <span class="tag alert">Latex</span>
                    </div>
                  </div>
                  <div class="info-group">
                    <label>Chief Complaint</label>
                    <p>"I want to fix the crowding in my upper front teeth and close the gap in the lower jaw."</p>
                  </div>
                </div>
              </section>
            </div>
          }
          @case ('diagnostics') {
            <div class="tab-pane">
              <section class="dossier-section">
                <h2>Diagnostics</h2>
                <div class="diagnostics-grid">
                  <div class="info-group">
                    <label>Skeletal Class</label>
                    <p>Class I</p>
                  </div>
                  <div class="info-group">
                    <label>Malocclusion</label>
                    <p>Crowding (Moderate), Diastema (Mild)</p>
                  </div>
                  <div class="info-group">
                    <label>Facial Analysis</label>
                    <p>Symmetrical, Convex profile</p>
                  </div>
                </div>
              </section>
            </div>
          }
          @case ('plan') {
             <div class="tab-pane">
              <section class="dossier-section">
                <h2>Treatment Plan (v1)</h2>
                <div class="plan-details">
                  <div class="info-group">
                    <label>Appliance Type</label>
                    <p>Invisalign Full Package</p>
                  </div>
                  <div class="info-group">
                    <label>Goals</label>
                    <ul>
                      <li>Correct upper crowding</li>
                      <li>Close lower diastema</li>
                      <li>Improve smile arc</li>
                    </ul>
                  </div>
                  <div class="info-group">
                    <label>Estimated Duration</label>
                    <p>18 - 24 months</p>
                  </div>
                </div>
              </section>
            </div>
          }
          @case ('appointments') {
            <div class="tab-pane">
              <h2>Appointments History</h2>
              <table class="simple-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>May 10, 2026</td>
                    <td>Checkup</td>
                    <td><span class="status-badge completed">Completed</span></td>
                    <td>Aligner 4 delivered.</td>
                  </tr>
                  <tr>
                    <td>Apr 12, 2026</td>
                    <td>Initial Fit</td>
                    <td><span class="status-badge completed">Completed</span></td>
                    <td>First set of aligners fitted.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          }
          @case ('notes') {
            <div class="tab-pane">
              <div class="notes-header">
                <h2>Clinical Notes</h2>
                <button class="btn-primary btn-sm">Add Note</button>
              </div>
              <div class="notes-list">
                <div class="note-item">
                  <div class="note-meta">
                    <span class="author">Dr. El Mansouri</span>
                    <span class="date">May 10, 2026</span>
                  </div>
                  <p class="note-content">SOAP: Subjective: Patient reports no pain. Objective: Aligner 4 fits well. Assessment: Progressing as planned. Plan: Next visit in 4 weeks.</p>
                </div>
              </div>
            </div>
          }
          @case ('documents') {
            <div class="tab-pane">
              <h2>Documents & Imaging</h2>
              <div class="docs-grid">
                <div class="doc-card">
                  <div class="doc-icon"><span class="material-icons">image</span></div>
                  <div class="doc-info">
                    <span class="name">Panoramic_Xray.jpg</span>
                    <span class="date">Mar 15, 2026</span>
                  </div>
                </div>
                <div class="doc-card">
                  <div class="doc-icon"><span class="material-icons">description</span></div>
                  <div class="doc-info">
                    <span class="name">Consent_Form.pdf</span>
                    <span class="date">Mar 15, 2026</span>
                  </div>
                </div>
              </div>
            </div>
          }
        }
      </main>
      } @else {
        <div class="loading">
          <p>Loading patient dossier...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .dossier-container {
      background: #f8fafc;
      min-height: 100vh;
    }

    .dossier-header {
      background: white;
      padding: 1.5rem 2rem 0 2rem;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-top {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .back-btn {
      background: #f1f5f9;
      border: none;
      padding: 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: #e2e8f0;
    }

    .patient-title {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .patient-title h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .patient-quick-info {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding-bottom: 1.5rem;
      color: #64748b;
      font-size: 0.9rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-item .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      font-weight: 600;
      color: #94a3b8;
    }

    .info-item .value {
      color: #334155;
      font-weight: 600;
    }

    .info-divider {
      width: 1px;
      height: 24px;
      background: #e2e8f0;
    }

    .dossier-tabs {
      display: flex;
      gap: 2rem;
    }

    .dossier-tabs button {
      background: transparent;
      border: none;
      padding: 1rem 0;
      color: #64748b;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      position: relative;
      transition: all 0.2s;
    }

    .dossier-tabs button:hover {
      color: #4f46e5;
    }

    .dossier-tabs button.active {
      color: #4f46e5;
    }

    .dossier-tabs button.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: #4f46e5;
    }

    .dossier-content {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .tab-pane {
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .summary-card {
      background: white;
      padding: 1.5rem;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }

    .summary-card h3 {
      font-size: 1rem;
      margin: 0 0 1rem 0;
      color: #64748b;
      font-weight: 600;
    }

    .card-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .card-content .date {
      color: #4f46e5;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .card-content .desc {
      color: #334155;
    }

    .dental-chart-card {
      grid-column: 1 / -1;
    }

    .chart-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .chart-card-header h3 {
      margin: 0;
    }

    .chart-card-header .btn-sm {
      padding: 0.25rem;
      min-width: unset;
    }

    .chart-card-header .btn-sm .material-icons {
      font-size: 1.1rem;
    }

    .dossier-section {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
    }

    .section-title { margin-top: 0; }

    .info-group { margin-bottom: 1.5rem; }
    .info-group label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }

    .tag-list { display: flex; gap: 0.5rem; }
    .tag {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #475569;
    }
    .tag.alert { background: #fee2e2; color: #b91c1c; }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-badge.active { background: #dcfce7; color: #166534; }
    .status-badge.completed { background: #e0e7ff; color: #3730a3; }

    .simple-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }
    .simple-table th {
      text-align: left;
      padding: 1rem;
      background: #f8fafc;
      font-size: 0.85rem;
      color: #64748b;
    }
    .simple-table td {
      padding: 1rem;
      border-top: 1px solid #f1f5f9;
      color: #334155;
    }

    .notes-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .note-item {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      margin-bottom: 1rem;
    }
    .note-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      font-size: 0.85rem;
    }
    .note-meta .author { font-weight: 700; color: #1e293b; }
    .note-meta .date { color: #94a3b8; }
    .note-content { margin: 0; color: #475569; line-height: 1.5; }

    .docs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    .doc-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .doc-card:hover { border-color: #4f46e5; transform: translateY(-2px); }
    .doc-icon {
      color: #4f46e5;
      background: #f5f3ff;
      padding: 0.5rem;
      border-radius: 8px;
    }
    .doc-info .name { display: block; font-weight: 600; font-size: 0.9rem; color: #1e293b; }
    .doc-info .date { font-size: 0.75rem; color: #94a3b8; }

    .btn-primary {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }
    .btn-outline {
      background: white;
      border: 1px solid #e2e8f0;
      color: #475569;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }
    .btn-sm { padding: 0.4rem 0.75rem; font-size: 0.85rem; }

    .loading {
      display: flex;
      justify-content: center;
      padding: 4rem;
      color: #64748b;
    }

    /* Responsive Styles */
    @media (max-width: 768px) {
      .dossier-header {
        padding: 1rem 1rem 0 1rem;
      }

      .header-top {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
      }

      .header-actions button {
        width: 100%;
        justify-content: center;
      }

      .patient-quick-info {
        flex-wrap: wrap;
        gap: 1rem;
        padding-bottom: 1rem;
      }

      .info-divider {
        display: none;
      }

      .info-item {
        flex: 1 1 40%;
      }

      .dossier-tabs {
        overflow-x: auto;
        padding-bottom: 2px;
        gap: 1.5rem;
      }

      .dossier-tabs button {
        white-space: nowrap;
      }

      .dossier-content {
        padding: 1rem;
      }

      .overview-grid {
        grid-template-columns: 1fr;
      }

      .docs-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PatientDossierComponent implements OnInit {
  private route = inject(ActivatedRoute);
  patientService = inject(PatientService);
  private chartService = inject(DentalChartService);

  activeTab = signal('overview');
  showDentalChartFullscreen = signal(false);
  dentalChartState: DentalChartState | null = null;

  tabs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'history', label: 'Medical History', icon: 'medical_services' },
    { id: 'diagnostics', label: 'Diagnostics', icon: 'biotech' },
    { id: 'plan', label: 'Treatment Plan', icon: 'assignment' },
    { id: 'appointments', label: 'Appointments', icon: 'event' },
    { id: 'notes', label: 'Notes', icon: 'history_edu' },
    { id: 'documents', label: 'Documents', icon: 'folder' },
  ];

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.patientService.setCurrentPatient(id);
        // Load dental chart for current patient
        const patient = this.patientService.currentPatient();
        if (patient) {
          this.dentalChartState = this.chartService.loadChart(patient.id, patient.dateOfBirth);
        }
      }
    });
  }

  onToothSelected(tooth: ToothState) {
    // The dental chart component handles status changes internally.
    // Re-read the chart state to keep in sync.
    const chart = this.chartService.currentChart();
    if (chart) {
      this.dentalChartState = { ...chart };
    }
  }

  calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
