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
import { FormsModule } from '@angular/forms';
import { PatientTreatmentService } from '../../../core/services/patient-treatment.service';
import { StockService } from '../../../core/services/stock.service';
import { PatientTreatment, PatientTreatmentConsumable, PatientTreatmentStatus } from '../../../core/models/patient-treatment.model';
import { Treatment, StockItem } from '../../../core/models/stock.model';

@Component({
  selector: 'app-patient-dossier',
  standalone: true,
  imports: [CommonModule, RouterModule, DentalChartComponent, TranslateModule, FormsModule],
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
                      [patientTreatments]="patientTreatments()"
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
          @case ('treatments') {
            <div class="tab-pane">
              <div class="treatments-layout">
                <!-- Left panel: Interactive Tooth Select and active tooth info -->
                <div class="chart-sidebar">
                  <div class="sidebar-header-custom">
                    <h3>{{ 'DENTAL_CHART.TITLE' | translate }}</h3>
                    <p class="text-xs text-slate-500">Click a tooth in the chart below to inspect its history or assign a new treatment.</p>
                  </div>
                  <div class="dental-chart-small">
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

                  <!-- Selected Tooth Details Panel -->
                  @if (selectedToothForTreatments(); as toothNum) {
                    <div class="tooth-treatment-details fade-in-up">
                      <div class="detail-header">
                        <span class="tooth-badge">#{{ toothNum }}</span>
                        <h4>Treatments on Tooth #{{ toothNum }}</h4>
                      </div>
                      
                      @if (selectedToothTreatments().length > 0) {
                        <div class="small-timeline">
                          @for (t of selectedToothTreatments(); track t.id) {
                            <div class="timeline-detail-item">
                              <div class="flex justify-between items-center mb-1">
                                <span class="font-bold text-slate-700">{{ t.treatment.name }}</span>
                                <span [class]="getStatusClass(t.status)">{{ t.status }}</span>
                              </div>
                              <div class="flex justify-between text-xs text-slate-500 mb-2">
                                <span>{{ t.doctorName }}</span>
                                <span>{{ t.startDate | date:'shortDate' }}</span>
                              </div>
                              <p class="text-xs italic text-slate-600 bg-slate-50 p-2 rounded" *ngIf="t.notes">"{{ t.notes }}"</p>
                              
                              <!-- Materials used -->
                              <div class="materials-used-list mt-2" *ngIf="t.consumables && t.consumables.length > 0">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Materials Consumed:</span>
                                <div class="flex flex-wrap gap-1 mt-1">
                                  @for (c of t.consumables; track c.id) {
                                    <span class="material-chip">
                                      {{ c.stockItem.name }} ({{ c.quantityUsed }} {{ c.stockItem.unitLabel || 'Units' }})
                                    </span>
                                  }
                                </div>
                              </div>
                            </div>
                          }
                        </div>
                      } @else {
                        <p class="text-slate-400 text-xs italic p-4 text-center">No treatments assigned to this tooth yet.</p>
                      }

                      <button class="btn-primary btn-sm w-full mt-3 justify-center" (click)="openAssignModal()">
                        <span class="material-icons">add</span>
                        Assign to Tooth #{{ toothNum }}
                      </button>
                    </div>
                  }
                </div>

                <!-- Right panel: Patient Treatments Tracker -->
                <div class="treatments-tracker">
                  <div class="tracker-header">
                    <h2>Patient Clinical Treatments</h2>
                    <button class="btn-primary" (click)="openAssignModal()">
                      <span class="material-icons">add</span>
                      Assign Treatment
                    </button>
                  </div>

                  <div class="treatments-list">
                    @for (pt of patientTreatments(); track pt.id) {
                      <div class="treatment-card">
                        <div class="card-left">
                          <div class="treatment-icon">
                            <span class="material-icons">healing</span>
                          </div>
                          <div class="treatment-meta">
                            <div class="flex items-center gap-2">
                              <span class="treatment-name">{{ pt.treatment.name }}</span>
                              <span class="teeth-list">Teeth: {{ pt.teeth }}</span>
                            </div>
                            <div class="flex items-center gap-4 text-xs text-slate-500 mt-1">
                              <span><span class="font-semibold text-slate-700">Doctor:</span> {{ pt.doctorName }}</span>
                              <span *ngIf="pt.startDate">
                                <span class="font-semibold text-slate-700">Started:</span> {{ pt.startDate | date:'mediumDate' }}
                              </span>
                            </div>
                            <p class="treatment-desc text-xs text-slate-600 mt-2" *ngIf="pt.notes">
                              {{ pt.notes }}
                            </p>
                          </div>
                        </div>

                        <div class="card-right">
                          <div class="status-progress">
                            <span [class]="getStatusClass(pt.status)">{{ pt.status }}</span>
                            <div class="progress-bar-container">
                              <div class="progress-fill" [style.width.%]="pt.progress"></div>
                              <span class="progress-val">{{ pt.progress }}%</span>
                            </div>
                          </div>
                          
                          <div class="card-actions">
                            <button class="btn-icon" (click)="openAssignModal(pt)" title="Edit">
                              <span class="material-icons text-slate-500 hover:text-slate-800">edit</span>
                            </button>
                            <button class="btn-icon danger" (click)="deletePatientTreatment(pt)" title="Delete">
                              <span class="material-icons text-red-500 hover:text-red-700">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    } @empty {
                      <div class="no-treatments">
                        <span class="material-icons large">health_and_safety</span>
                        <p>No treatments assigned to this patient.</p>
                        <button class="btn-outline btn-sm mt-3" (click)="openAssignModal()">Assign First Treatment</button>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Custom Modal Backdrop -->
            @if (showAssignModal()) {
              <div class="modal-backdrop" (click)="closeAssignModal()">
                <div class="modal-card" (click)="$event.stopPropagation()">
                  <header class="modal-header">
                    <h3>{{ isEditingTreatment() ? 'Edit Treatment Assignment' : 'Assign Treatment Procedure' }}</h3>
                    <button class="close-btn" (click)="closeAssignModal()">
                      <span class="material-icons">close</span>
                    </button>
                  </header>

                  <div class="modal-body">
                    <div class="form-grid">
                      <!-- Select Treatment -->
                      <div class="form-group col-span-2">
                        <label>Select Treatment Setup *</label>
                        <select [(ngModel)]="formTreatmentId" (ngModelChange)="onTreatmentSelected($event)" [disabled]="isEditingTreatment()" class="form-input">
                          <option value="" disabled>-- Choose a predefined treatment --</option>
                          @for (t of availableTreatments(); track t.id) {
                            <option [value]="t.id">{{ t.name }} ({{ t.code }})</option>
                          }
                        </select>
                      </div>

                      <!-- Teeth comma separated -->
                      <div class="form-group">
                        <label>Assigned Teeth (FDI numbers separated by comma) *</label>
                        <input type="text" [(ngModel)]="formTeeth" placeholder="e.g. 11, 12, 13" class="form-input">
                      </div>

                      <!-- Doctor Name -->
                      <div class="form-group">
                        <label>Assigned Doctor *</label>
                        <input type="text" [(ngModel)]="formDoctorName" class="form-input">
                      </div>

                      <!-- Status -->
                      <div class="form-group">
                        <label>Status</label>
                        <select [(ngModel)]="formStatus" class="form-input">
                          <option value="PLANNED">PLANNED</option>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>

                      <!-- Progress Slider -->
                      <div class="form-group">
                        <label>Progress ({{ formProgress }}%)</label>
                        <div class="flex items-center gap-2">
                          <input type="range" min="0" max="100" step="5" [(ngModel)]="formProgress" class="flex-1">
                        </div>
                      </div>

                      <!-- Start Date -->
                      <div class="form-group">
                        <label>Start Date</label>
                        <input type="date" [(ngModel)]="formStartDate" class="form-input">
                      </div>

                      <!-- End Date -->
                      <div class="form-group">
                        <label>End Date</label>
                        <input type="date" [(ngModel)]="formEndDate" class="form-input">
                      </div>

                      <!-- Notes -->
                      <div class="form-group col-span-2">
                        <label>Clinical Notes</label>
                        <textarea [(ngModel)]="formNotes" placeholder="Describe clinical symptoms or execution details..." class="form-textarea"></textarea>
                      </div>

                      <!-- Predefined Materials / Consumables -->
                      <div class="form-group col-span-2">
                        <div class="flex justify-between items-center mb-2">
                          <span class="font-bold text-slate-700 text-sm">Material Consumption Settings</span>
                          <button type="button" class="btn-outline btn-sm" (click)="addConsumableToForm()">
                            <span class="material-icons">add</span> Add Material
                          </button>
                        </div>
                        
                        <div class="consumables-editor bg-slate-50 p-3 rounded-xl border border-slate-200">
                          @if (formConsumables.length > 0) {
                            @for (c of formConsumables; track $index) {
                              <div class="consumable-editor-row">
                                <div class="item-select">
                                  <select [(ngModel)]="c.stockItem" class="form-input-sm">
                                    @for (item of availableStockItems(); track item.id) {
                                      <option [ngValue]="item">{{ item.name }} (SKU: {{ item.sku }})</option>
                                    }
                                  </select>
                                </div>
                                <div class="item-qty">
                                  <input type="number" step="any" [(ngModel)]="c.quantityUsed" class="form-input-sm" style="width: 80px;">
                                  <span class="text-xs text-slate-500 ml-1">{{ c.stockItem.unitLabel || 'Units' }}</span>
                                </div>
                                <div class="item-actions">
                                  <button type="button" class="btn-icon danger" (click)="removeConsumableFromForm($index)">
                                    <span class="material-icons text-sm text-red-500">delete</span>
                                  </button>
                                </div>
                              </div>
                            }
                          } @else {
                            <p class="text-slate-400 text-xs italic text-center p-2">No materials configured for consumption in this session.</p>
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <footer class="modal-footer mt-4">
                    <button class="btn-outline" (click)="closeAssignModal()">Cancel</button>
                    <button class="btn-primary" (click)="savePatientTreatment()">Save Assignment</button>
                  </footer>
                </div>
              </div>
            }
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

    /* Treatments Layout */
    .treatments-layout {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 2rem;
      align-items: start;
    }

    .chart-sidebar {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .sidebar-header-custom h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.25rem 0;
    }

    .dental-chart-small {
      margin: 1rem 0;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 1rem;
    }

    .tooth-treatment-details {
      background: #f8fafc;
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid #e2e8f0;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.5rem;
    }

    .detail-header h4 {
      font-size: 0.9rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .tooth-badge {
      background: #4f46e5;
      color: white;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
    }

    .small-timeline {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .timeline-detail-item {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
    }

    .material-chip {
      background: #f1f5f9;
      color: #475569;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.4rem;
      border-radius: 9999px;
      border: 1px solid #cbd5e1;
    }

    .treatments-tracker {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .tracker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .tracker-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .treatments-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .treatment-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      transition: all 0.2s;
    }

    .treatment-card:hover {
      border-color: #4f46e5;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.05);
    }

    .card-left {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      flex: 1;
    }

    .treatment-icon {
      background: #e0e7ff;
      color: #4f46e5;
      padding: 0.5rem;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .treatment-meta {
      flex: 1;
    }

    .treatment-name {
      font-weight: 700;
      color: #1e293b;
      font-size: 1rem;
    }

    .teeth-list {
      font-size: 0.75rem;
      font-weight: 700;
      background: #e2e8f0;
      color: #475569;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    .card-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .status-progress {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
      min-width: 120px;
    }

    .progress-bar-container {
      width: 100px;
      height: 6px;
      background: #e2e8f0;
      border-radius: 9999px;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      background: #4f46e5;
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    .progress-val {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      margin-top: 0.2rem;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
    }

    .no-treatments {
      text-align: center;
      padding: 4rem 2rem;
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      color: #64748b;
    }

    .no-treatments .material-icons.large {
      font-size: 3rem;
      color: #94a3b8;
      margin-bottom: 1rem;
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-card {
      background: white;
      border-radius: 20px;
      width: 650px;
      max-width: 90%;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      padding: 2rem;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.2s ease-out;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.75rem;
    }

    .modal-header h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .close-btn {
      background: #f1f5f9;
      border: none;
      padding: 0.4rem;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      color: #64748b;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    .col-span-2 {
      grid-column: span 2;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-group label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .form-input, .form-input-sm, .form-textarea {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.6rem 0.75rem;
      font-size: 0.9rem;
      color: #1e293b;
      transition: border-color 0.2s;
      background: white;
    }

    .form-input-sm {
      padding: 0.4rem 0.5rem;
      font-size: 0.8rem;
    }

    .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .form-textarea {
      height: 80px;
      resize: vertical;
    }

    .consumable-editor-row {
      display: grid;
      grid-template-columns: 1fr 160px 40px;
      gap: 0.75rem;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      border-top: 1px solid #f1f5f9;
      padding-top: 1rem;
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

  // Patient Treatment Signals
  private patientTreatmentService = inject(PatientTreatmentService);
  private stockService = inject(StockService);

  patientTreatments = signal<PatientTreatment[]>([]);
  availableTreatments = signal<Treatment[]>([]);
  availableStockItems = signal<StockItem[]>([]);

  // Modal State
  showAssignModal = signal(false);
  isEditingTreatment = signal(false);
  selectedTreatmentForEdit = signal<PatientTreatment | null>(null);

  // Form Fields
  formTreatmentId = '';
  formTeeth = '';
  formStatus: PatientTreatmentStatus = 'PLANNED';
  formProgress = 0;
  formNotes = '';
  formDoctorName = '';
  formStartDate = '';
  formEndDate = '';
  formConsumables: PatientTreatmentConsumable[] = [];

  // Tooth selection detail panel
  selectedToothForTreatments = signal<string | null>(null);
  selectedToothTreatments = computed(() => {
    const tooth = this.selectedToothForTreatments();
    if (!tooth) return [];
    return this.patientTreatments().filter(t => t.teeth.split(',').map(x => x.trim()).includes(tooth));
  });

  totalInvoicedForPatient = computed(() => {
    return this.patientInvoices().reduce((sum, inv) => sum + inv.total, 0);
  });

  balanceDueForPatient = computed(() => {
    return this.patientInvoices()
      .filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
      .reduce((sum, inv) => sum + inv.total, 0);
  });

  nextAppointmentDate = new Date(new Date().setDate(new Date().getDate() + 8));
  latestNoteDate = new Date(new Date().setDate(new Date().getDate() - 6));
  pastAppointments = [
    { date: new Date(new Date().setDate(new Date().getDate() - 6)), type: 'checkup', notes: 'Aligner 4 delivered.' },
    { date: new Date(new Date().setDate(new Date().getDate() - 34)), type: 'initial', notes: 'First set of aligners fitted.' }
  ];

  tabs = [
    { id: 'overview', key: 'COMMON.OVERVIEW', icon: 'dashboard' },
    { id: 'treatments', key: 'COMMON.TREATMENTS', icon: 'healing' },
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
          this.loadPatientTreatments(patient.id);
        }
      }
    });

    // Load available treatments and stock items for selectors
    this.stockService.getTreatments().subscribe(list => this.availableTreatments.set(list));
    this.stockService.getStockItems().subscribe(list => this.availableStockItems.set(list));
  }

  loadPatientBilling(patientId: string) {
    this.invoiceService.getPatientInvoices(patientId).subscribe(invoices => {
      this.patientInvoices.set(invoices);
    });
  }

  onToothSelected(tooth: ToothState) {
    const chart = this.chartService.currentChart();
    if (chart) {
      this.dentalChartState = { ...chart };
    }
    this.selectedToothForTreatments.set(tooth.id);
  }

  loadPatientTreatments(patientId: string) {
    this.patientTreatmentService.getPatientTreatments(patientId).subscribe(list => {
      this.patientTreatments.set(list);
    });
  }

  openAssignModal(treatment?: PatientTreatment) {
    if (treatment) {
      this.isEditingTreatment.set(true);
      this.selectedTreatmentForEdit.set(treatment);
      this.formTreatmentId = treatment.treatment.id || '';
      this.formTeeth = treatment.teeth;
      this.formStatus = treatment.status;
      this.formProgress = treatment.progress;
      this.formNotes = treatment.notes || '';
      this.formDoctorName = treatment.doctorName || '';
      this.formStartDate = treatment.startDate || '';
      this.formEndDate = treatment.endDate || '';
      this.formConsumables = treatment.consumables ? [...treatment.consumables.map(c => ({...c}))] : [];
    } else {
      this.isEditingTreatment.set(false);
      this.selectedTreatmentForEdit.set(null);
      this.formTreatmentId = '';
      this.formTeeth = this.selectedToothForTreatments() || '';
      this.formStatus = 'PLANNED';
      this.formProgress = 0;
      this.formNotes = '';
      this.formDoctorName = 'Dr. Smith';
      this.formStartDate = new Date().toISOString().split('T')[0];
      this.formEndDate = '';
      this.formConsumables = [];
    }
    this.showAssignModal.set(true);
  }

  closeAssignModal() {
    this.showAssignModal.set(false);
    this.isEditingTreatment.set(false);
    this.selectedTreatmentForEdit.set(null);
  }

  onTreatmentSelected(treatmentId: string) {
    const matched = this.availableTreatments().find(t => t.id === treatmentId);
    if (matched && matched.consumables) {
      this.formConsumables = matched.consumables.map(c => ({
        stockItem: c.stockItem,
        quantityUsed: c.quantityUsed,
        pricePerUnit: c.stockItem.pricePerUse,
        notes: c.notes || ''
      }));
    } else {
      this.formConsumables = [];
    }
  }

  addConsumableToForm() {
    this.formConsumables.push({
      stockItem: this.availableStockItems()[0],
      quantityUsed: 1,
      pricePerUnit: this.availableStockItems()[0]?.pricePerUse || 0,
      notes: ''
    });
  }

  removeConsumableFromForm(index: number) {
    this.formConsumables.splice(index, 1);
  }

  savePatientTreatment() {
    const patient = this.patientService.currentPatient();
    if (!patient) return;

    const matchedTreatment = this.availableTreatments().find(t => t.id === this.formTreatmentId);
    if (!matchedTreatment) {
      alert('Please select a valid treatment procedure.');
      return;
    }

    const payload: PatientTreatment = {
      treatment: matchedTreatment,
      teeth: this.formTeeth,
      status: this.formStatus,
      progress: this.formProgress,
      notes: this.formNotes,
      doctorName: this.formDoctorName,
      startDate: this.formStartDate || undefined,
      endDate: this.formEndDate || undefined,
      consumables: this.formConsumables
    };

    if (this.isEditingTreatment() && this.selectedTreatmentForEdit()) {
      const treatmentId = this.selectedTreatmentForEdit()!.id!;
      this.patientTreatmentService.updatePatientTreatment(patient.id, treatmentId, payload).subscribe({
        next: () => {
          this.loadPatientTreatments(patient.id);
          this.closeAssignModal();
        },
        error: (err: any) => {
          alert(err.error?.message || err.message || 'Error updating treatment. Check stock quantities.');
        }
      });
    } else {
      this.patientTreatmentService.createPatientTreatment(patient.id, payload).subscribe({
        next: () => {
          this.loadPatientTreatments(patient.id);
          this.closeAssignModal();
        },
        error: (err: any) => {
          alert(err.error?.message || err.message || 'Error assigning treatment. Check stock quantities.');
        }
      });
    }
  }

  deletePatientTreatment(treatment: PatientTreatment) {
    const patient = this.patientService.currentPatient();
    if (patient && treatment.id) {
      if (confirm('Are you sure you want to delete this treatment assignment? This will reverse any stock deductions.')) {
        this.patientTreatmentService.deletePatientTreatment(patient.id, treatment.id).subscribe({
          next: () => this.loadPatientTreatments(patient.id),
          error: (err: any) => console.error('Error deleting patient treatment', err)
        });
      }
    }
  }

  getStatusClass(status: PatientTreatmentStatus): string {
    switch (status) {
      case 'PLANNED': return 'status-badge sent';
      case 'ACTIVE': return 'status-badge partially-paid';
      case 'COMPLETED': return 'status-badge paid';
      case 'CANCELLED': return 'status-badge cancelled';
      default: return 'status-badge';
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
