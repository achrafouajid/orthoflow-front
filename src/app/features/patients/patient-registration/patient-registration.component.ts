import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../core/models/patient.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, TranslateModule],
  template: `
    <div class="registration-container">
      <header class="page-header">
        <button class="back-btn" [routerLink]="editMode ? ['/patients', patientId] : ['/patients']">
          <span class="material-icons">arrow_back</span>
        </button>
        <div class="header-content">
          <h1>{{ (editMode ? 'PATIENTS.DOSSIER.EDIT_DOSSIER' : 'PATIENTS.DOSSIER.REGISTRATION_TITLE') | translate }}</h1>
          <p>{{ (editMode ? 'PATIENTS.DOSSIER.EDIT_SUBTITLE' : 'PATIENTS.DOSSIER.REGISTRATION_SUBTITLE') | translate }}</p>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'COMMON.LOADING' | translate }}</p>
        </div>
      } @else {
        <form [formGroup]="patientForm" (ngSubmit)="onSubmit()" class="registration-form">
          <div class="form-grid">
            <!-- Identity Section -->
            <div class="form-section">
              <h2 class="section-title">{{ 'PATIENTS.DOSSIER.IDENTITY' | translate }}</h2>
              <div class="inputs-grid">
                <div class="form-group">
                  <label for="firstName">{{ 'PATIENTS.DOSSIER.FIRST_NAME' | translate }}</label>
                  <input id="firstName" formControlName="firstName" type="text" [placeholder]="'PATIENTS.DOSSIER.FIRST_NAME' | translate" />
                </div>
                <div class="form-group">
                  <label for="lastName">{{ 'PATIENTS.DOSSIER.LAST_NAME' | translate }}</label>
                  <input id="lastName" formControlName="lastName" type="text" [placeholder]="'PATIENTS.DOSSIER.LAST_NAME' | translate" />
                </div>
                <div class="form-group">
                  <label for="dateOfBirth">{{ 'PATIENTS.DOSSIER.DOB' | translate }}</label>
                  <input id="dateOfBirth" formControlName="dateOfBirth" type="date" />
                </div>
                <div class="form-group">
                  <label for="gender">{{ 'PATIENTS.DOSSIER.GENDER' | translate }}</label>
                  <select id="gender" formControlName="gender">
                    <option value="M">{{ 'PATIENTS.DOSSIER.GENDER_M' | translate }}</option>
                    <option value="F">{{ 'PATIENTS.DOSSIER.GENDER_F' | translate }}</option>
                    <option value="O">{{ 'PATIENTS.DOSSIER.GENDER_O' | translate }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="cin">{{ 'PATIENTS.DOSSIER.CIN' | translate }}</label>
                  <input id="cin" formControlName="cin" type="text" [placeholder]="'PATIENTS.DOSSIER.CIN_PLACEHOLDER' | translate" />
                </div>
                @if (editMode) {
                  <div class="form-group">
                    <label for="status">{{ 'COMMON.STATUS' | translate }}</label>
                    <select id="status" formControlName="status">
                      <option value="ACTIVE">{{ 'PATIENTS.DOSSIER.STATUS_ACTIVE' | translate }}</option>
                      <option value="COMPLETED">{{ 'PATIENTS.DOSSIER.STATUS_COMPLETED' | translate }}</option>
                      <option value="ON_HOLD">{{ 'PATIENTS.DOSSIER.STATUS_ON_HOLD' | translate }}</option>
                    </select>
                  </div>
                }
              </div>
            </div>

            <!-- Contact Section -->
            <div class="form-section">
              <h2 class="section-title">{{ 'PATIENTS.DOSSIER.CONTACT_INFO' | translate }}</h2>
              <div class="inputs-grid">
                <div class="form-group">
                  <label for="email">{{ 'PATIENTS.DOSSIER.EMAIL' | translate }}</label>
                  <input id="email" formControlName="email" type="email" [placeholder]="'PATIENTS.DOSSIER.EMAIL_PLACEHOLDER' | translate" />
                </div>
                <div class="form-group">
                  <label for="phone">{{ 'PATIENTS.DOSSIER.PHONE' | translate }}</label>
                  <input id="phone" formControlName="phone" type="tel" [placeholder]="'PATIENTS.DOSSIER.PHONE_PLACEHOLDER' | translate" />
                </div>
                <div class="form-group full-width">
                  <label for="address">{{ 'PATIENTS.DOSSIER.ADDRESS' | translate }}</label>
                  <textarea id="address" formControlName="address" rows="2" [placeholder]="'PATIENTS.DOSSIER.ADDRESS_PLACEHOLDER' | translate"></textarea>
                </div>
              </div>
            </div>

            <!-- Insurance Section -->
            <div class="form-section">
              <h2 class="section-title">{{ 'PATIENTS.DOSSIER.INSURANCE' | translate }}</h2>
              <div class="inputs-grid">
                <div class="form-group">
                  <label for="insuranceProvider">{{ 'PATIENTS.DOSSIER.INSURANCE' | translate }}</label>
                  <select id="insuranceProvider" formControlName="insuranceProvider">
                    <option value="">{{ 'PATIENTS.DOSSIER.INSURANCE_NONE' | translate }}</option>
                    <option value="CNOPS">CNOPS</option>
                    <option value="CNAM">CNAM</option>
                    <option value="RAMED">RAMED</option>
                    <option value="PRIVATE">{{ 'PATIENTS.DOSSIER.INSURANCE_PRIVATE' | translate }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="insuranceNumber">{{ 'PATIENTS.DOSSIER.POLICY_NUMBER' | translate }}</label>
                  <input id="insuranceNumber" formControlName="insuranceNumber" type="text" />
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-ghost" [routerLink]="editMode ? ['/patients', patientId] : ['/patients']">{{ 'COMMON.CANCEL' | translate }}</button>
            <button type="submit" class="btn-primary" [disabled]="patientForm.invalid">
              {{ (editMode ? 'COMMON.EDIT' : 'COMMON.ADD') | translate }} {{ 'PATIENTS.NAME' | translate }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .registration-container {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .back-btn {
      background: white;
      border: 1px solid #e5e7eb;
      padding: 0.5rem;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .back-btn:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .header-content h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .header-content p {
      color: #6b7280;
      margin: 0.25rem 0 0 0;
    }

    .registration-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .inputs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #4b5563;
    }

    .form-group input, 
    .form-group select, 
    .form-group textarea {
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      outline: none;
    }

    .form-group input:focus, 
    .form-group select:focus, 
    .form-group textarea:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }

    .btn-primary {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .btn-primary:hover {
      background: #4338ca;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-ghost {
      background: transparent;
      border: 1px solid #e5e7eb;
      color: #6b7280;
      padding: 0.75rem 2rem;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-ghost:hover {
      background: #f9fafb;
      color: #374151;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #6b7280;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #4f46e5;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Responsive Styles */
    @media (max-width: 768px) {
      .registration-container {
        padding: 1rem;
      }

      .page-header {
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .header-content h1 {
        font-size: 1.5rem;
      }

      .form-section {
        padding: 1.5rem;
      }

      .inputs-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions button {
        width: 100%;
      }
    }
  `]
})
export class PatientRegistrationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editMode = false;
  patientId: string | null = null;
  loading = this.patientService.loading;

  patientForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
    gender: ['M', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    address: ['', Validators.required],
    cin: [''],
    insuranceProvider: [''],
    insuranceNumber: [''],
    status: ['ACTIVE']
  });

  ngOnInit() {
    this.patientId = this.route.snapshot.paramMap.get('id');
    if (this.patientId && this.patientId !== 'register') {
      this.editMode = true;
      this.loadPatientData(this.patientId);
    }
  }

  loadPatientData(id: string) {
    this.patientService.setCurrentPatient(id);
    const patient = this.patientService.currentPatient();
    if (patient) {
      this.patientForm.patchValue(patient as any);
    } else {
      // If not in signal, the service will fetch it. We might need to subscribe to the signal.
      // For simplicity in this bootstrap, we assume it's loaded or we wait.
    }
  }

  onSubmit() {
    if (this.patientForm.valid) {
      const patientData = this.patientForm.value as any;
      if (this.editMode && this.patientId) {
        this.patientService.updatePatient(this.patientId, patientData).subscribe({
          next: () => this.router.navigate(['/patients', this.patientId]),
          error: (err) => console.error('Error updating patient', err)
        });
      } else {
        this.patientService.addPatient(patientData).subscribe({
          next: () => this.router.navigate(['/patients']),
          error: (err) => console.error('Error creating patient', err)
        });
      }
    }
  }
}
