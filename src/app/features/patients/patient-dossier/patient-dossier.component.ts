import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { DentalChartService } from '../../../core/services/dental-chart.service';
import { Patient, DentalChartState, DentalChartType, ToothState } from '../../../core/models/patient.model';
import { DentalChartComponent } from '../../dental-chart/dental-chart.component';
import { InvoiceService } from '../../billing/services/invoice.service';
import { Invoice } from '../../billing/models/billing.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-patient-dossier',
  standalone: true,
  imports: [CommonModule, RouterModule, DentalChartComponent, TranslateModule],
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
            <span class="status-badge active">{{ 'PATIENTS.DOSSIER.STATUS_' + patient.status | translate }}</span>
          </div>
          <div class="header-actions">
            <button class="btn-outline">
              <span class="material-icons">print</span>
              {{ 'COMMON.PRINT' | translate }}
            </button>
            <button class="btn-primary" [routerLink]="['edit']">
              <span class="material-icons">edit</span>
              {{ 'COMMON.EDIT' | translate }} {{ 'PATIENTS.NAME' | translate }}
            </button>
            <button class="btn-danger" (click)="onDelete()">
              <span class="material-icons">delete</span>
              {{ 'COMMON.DELETE' | translate }}
            </button>
          </div>
        </div>

        <div class="patient-quick-info">
          <div class="info-item">
            <span class="label">{{ 'PATIENTS.DOSSIER.AGE' | translate }}</span>
            <span class="value">{{ calculateAge(patient.dateOfBirth) }} {{ 'PATIENTS.DOSSIER.YEARS' | translate }}</span>
          </div>
          <div class="info-divider"></div>
          <div class="info-item">
            <span class="label">{{ 'PATIENTS.DOSSIER.GENDER' | translate }}</span>
            <span class="value">{{ 'PATIENTS.DOSSIER.GENDER_' + patient.gender | translate }}</span>
          </div>
          <div class="info-divider"></div>
          <div class="info-item">
            <span class="label">{{ 'PATIENTS.DOSSIER.PHONE' | translate }}</span>
            <span class="value">{{ patient.phone }}</span>
          </div>
          <div class="info-divider"></div>
          <div class="info-item">
            <span class="label">{{ 'PATIENTS.DOSSIER.CIN' | translate }}</span>
            <span class="value">{{ patient.cin || 'N/A' }}</span>
          </div>
          <div class="info-divider"></div>
          <div class="info-item">
            <span class="label">{{ 'PATIENTS.DOSSIER.INSURANCE' | translate }}</span>
            <span class="value">{{ patient.insuranceProvider || ('PATIENTS.DOSSIER.PRIVATE' | translate) }}</span>
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
              {{ tab.key | translate }}
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
                  <h3>{{ 'PATIENTS.NEXT_APPOINTMENT' | translate }}</h3>
                  <div class="card-content">
                    <span class="date">{{ nextAppointmentDate | date:'longDate' }} - {{ nextAppointmentDate | date:'shortTime' }}</span>
                    <span class="desc">{{ 'SCHEDULE.TYPES.CHECKUP' | translate }}</span>
                  </div>
                </div>
                <div class="summary-card">
                  <h3>{{ 'PATIENTS.DOSSIER.LATEST_NOTE' | translate }}</h3>
                  <div class="card-content">
                    <p>"Patient is responding well to treatment."</p>
                    <span class="date">{{ latestNoteDate | date:'mediumDate' }}</span>
                  </div>
                </div>
                <div class="summary-card dental-chart-card">
                  <div class="chart-card-header">
                    <h3>{{ 'DENTAL_CHART.TITLE' | translate }}</h3>
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
                <h2>{{ 'PATIENTS.DOSSIER.MEDICAL_HISTORY' | translate }}</h2>
                <div class="history-content">
                  <div class="info-group">
                    <label>{{ 'PATIENTS.DOSSIER.GENERAL_HEALTH' | translate }}</label>
                    <p>Good</p>
                  </div>
                  <div class="info-group">
                    <label>{{ 'PATIENTS.DOSSIER.ALLERGIES' | translate }}</label>
                    <div class="tag-list">
                      <span class="tag alert">Penicillin</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          }
          @case ('diagnostics') {
            <div class="tab-pane">
              <section class="dossier-section">
                <h2>{{ 'PATIENTS.DOSSIER.DIAGNOSTICS' | translate }}</h2>
                <div class="diagnostics-grid">
                  <div class="info-group">
                    <label>{{ 'PATIENTS.DOSSIER.SKELETAL_CLASS' | translate }}</label>
                    <p>Class I</p>
                  </div>
                </div>
              </section>
            </div>
          }
          @case ('plan') {
             <div class="tab-pane">
              <section class="dossier-section">
                <h2>{{ 'PATIENTS.DOSSIER.TREATMENT_PLAN' | translate }}</h2>
                <div class="plan-details">
                  <div class="info-group">
                    <label>Appliance Type</label>
                    <p>Invisalign</p>
                  </div>
                </div>
              </section>
            </div>
          }
          @case ('appointments') {
            <div class="tab-pane">
              <h2>{{ 'COMMON.SCHEDULE' | translate }}</h2>
              <table class="simple-table">
                <thead>
                  <tr>
                    <th>{{ 'COMMON.DATE' | translate }}</th>
                    <th>Type</th>
                    <th>{{ 'COMMON.STATUS' | translate }}</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  @for (app of pastAppointments; track app.date) {
                    <tr>
                      <td>{{ app.date | date:'mediumDate' }}</td>
                      <td>{{ 'SCHEDULE.TYPES.' + app.type.toUpperCase() | translate }}</td>
                      <td><span class="status-badge completed">{{ 'PATIENTS.DOSSIER.STATUS_COMPLETED' | translate }}</span></td>
                      <td>{{ app.notes }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @case ('notes') {
            <div class="tab-pane">
              <div class="notes-header">
                <h2>{{ 'DENTAL_CHART.REPORT_TITLE' | translate }}</h2>
                <button class="btn-primary btn-sm">{{ 'COMMON.ADD' | translate }} {{ 'DENTAL_CHART.NOTE_LABEL' | translate }}</button>
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
          @case ('billing') {
            <div class="tab-pane">
              <div class="billing-header">
                <h2>{{ 'BILLING.TITLE' | translate }}</h2>
                <button class="btn-primary" [routerLink]="['/billing/invoices/create']" [queryParams]="{ patientId: patient.id }">
                  <span class="material-icons">add</span>
                  {{ 'BILLING.NEW_INVOICE' | translate }}
                </button>
              </div>

              <div class="billing-summary-mini">
                <div class="mini-stat">
                  <span class="label">{{ 'BILLING.TOTAL_INVOICED' | translate }}</span>
                  <span class="value">{{ totalInvoicedForPatient() | number:'1.2-2' }} MAD</span>
                </div>
                <div class="mini-stat">
                  <span class="label">{{ 'BILLING.OUTSTANDING' | translate }}</span>
                  <span class="value warning">{{ balanceDueForPatient() | number:'1.2-2' }} MAD</span>
                </div>
              </div>

              <table class="simple-table">
                <thead>
                  <tr>
                    <th>{{ 'BILLING.INVOICE_NUMBER' | translate }}</th>
                    <th>{{ 'COMMON.STATUS' | translate }}</th>
                    <th>{{ 'COMMON.DATE' | translate }}</th>
                    <th>{{ 'COMMON.AMOUNT' | translate }}</th>
                    <th>{{ 'COMMON.ACTIONS' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (invoice of patientInvoices(); track invoice.id) {
                    <tr>
                      <td><span class="invoice-link" [routerLink]="['/billing/invoices', invoice.id]">{{ invoice.invoiceNumber }}</span></td>
                      <td>
                        <span class="status-badge" [class]="invoice.status.toLowerCase().replace('_', '-')">
                          {{ 'BILLING.STATUS.' + invoice.status | translate }}
                        </span>
                      </td>
                      <td>{{ invoice.issueDate | date:'mediumDate' }}</td>
                      <td>{{ invoice.total | number:'1.2-2' }} {{ invoice.currency }}</td>
                      <td>
                        <button class="icon-btn" [title]="'PATIENTS.DOSSIER.DOWNLOAD_PDF' | translate"><span class="material-icons">download</span></button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="empty-state">{{ 'PATIENTS.DOSSIER.NO_INVOICES' | translate }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      </main>
      } @else {
        <div class="loading">
          <p>{{ 'COMMON.LOADING' | translate }}</p>
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
    .btn-danger {
      background: #fef2f2;
      border: 1px solid #fee2e2;
      color: #dc2626;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-danger:hover {
      background: #fee2e2;
      border-color: #fecaca;
    }
    
    .billing-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .billing-summary-mini {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
      background: #f8fafc;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .mini-stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .mini-stat .label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .mini-stat .value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }

    .mini-stat .value.warning { color: #d97706; }

    .invoice-link {
      color: #4f46e5;
      font-weight: 600;
      cursor: pointer;
    }

    .invoice-link:hover { text-decoration: underline; }

    .empty-state {
      text-align: center;
      padding: 3rem !important;
      color: #94a3b8;
      font-style: italic;
    }

    .status-badge.sent { background: #e0e7ff; color: #4338ca; }
    .status-badge.partially-paid { background: #fef3c7; color: #92400e; }
    .status-badge.paid { background: #dcfce7; color: #166534; }
    .status-badge.cancelled { background: #fee2e2; color: #991b1b; }

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
  private router = inject(Router);
  patientService = inject(PatientService);
  private chartService = inject(DentalChartService);
  private invoiceService = inject(InvoiceService);
  private translate = inject(TranslateService);

  activeTab = signal('overview');
  showDentalChartFullscreen = signal(false);
  dentalChartState: DentalChartState | null = null;
  patientInvoices = signal<Invoice[]>([]);

  nextAppointmentDate = new Date(new Date().setDate(new Date().getDate() + 8));
  latestNoteDate = new Date(new Date().setDate(new Date().getDate() - 6));
  pastAppointments = [
    { date: new Date(new Date().setDate(new Date().getDate() - 6)), type: 'checkup', notes: 'Aligner 4 delivered.' },
    { date: new Date(new Date().setDate(new Date().getDate() - 34)), type: 'initial', notes: 'First set of aligners fitted.' }
  ];

  tabs = [
    { id: 'overview', key: 'COMMON.OVERVIEW', icon: 'dashboard' },
    { id: 'history', key: 'PATIENTS.DOSSIER.MEDICAL_HISTORY', icon: 'medical_services' },
    { id: 'diagnostics', key: 'PATIENTS.DOSSIER.DIAGNOSTICS', icon: 'biotech' },
    { id: 'plan', key: 'PATIENTS.DOSSIER.TREATMENT_PLAN', icon: 'assignment' },
    { id: 'appointments', key: 'COMMON.SCHEDULE', icon: 'event' },
    { id: 'notes', key: 'DENTAL_CHART.REPORT_TITLE', icon: 'history_edu' },
    { id: 'documents', key: 'COMMON.ANALYTICS', icon: 'folder' },
    { id: 'billing', key: 'COMMON.BILLING', icon: 'payments' },
  ];

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.patientService.setCurrentPatient(id);
        const patient = this.patientService.currentPatient();
        if (patient) {
          this.dentalChartState = this.chartService.loadChart(patient.id, patient.dateOfBirth);
          this.loadPatientBilling(patient.id);
        }
      }
    });
  }

  loadPatientBilling(patientId: string) {
    this.invoiceService.getPatientInvoices(patientId).subscribe(invoices => {
      this.patientInvoices.set(invoices);
    });
  }

  totalInvoicedForPatient = computed(() => {
    return this.patientInvoices().reduce((sum, inv) => sum + inv.total, 0);
  });

  balanceDueForPatient = computed(() => {
    return this.patientInvoices()
      .filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
      .reduce((sum, inv) => sum + inv.total, 0);
  });

  onToothSelected(tooth: ToothState) {
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

  onDelete() {
    const patient = this.patientService.currentPatient();
    if (patient) {
      const confirmMsg = this.translate.instant('PATIENTS.DOSSIER.ARCHIVE_CONFIRM', { name: `${patient.firstName} ${patient.lastName}` });
      if (confirm(confirmMsg)) {
        this.patientService.deletePatient(patient.id).subscribe({
          next: () => {
            this.router.navigate(['/patients']);
          },
          error: (err) => console.error('Error deleting patient', err)
        });
      }
    }
  }
}
