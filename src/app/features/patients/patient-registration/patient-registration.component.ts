import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="registration-container">
      <header class="page-header">
        <button class="back-btn" routerLink="/patients">
          <span class="material-icons">arrow_back</span>
        </button>
        <div class="header-content">
          <h1>New Patient Registration</h1>
          <p>Enter patient details to create a new dossier</p>
        </div>
      </header>

      <form [formGroup]="patientForm" (ngSubmit)="onSubmit()" class="registration-form">
        <div class="form-grid">
          <!-- Identity Section -->
          <div class="form-section">
            <h2 class="section-title">Identity</h2>
            <div class="inputs-grid">
              <div class="form-group">
                <label for="firstName">First Name</label>
                <input id="firstName" formControlName="firstName" type="text" placeholder="e.g. Amine" />
              </div>
              <div class="form-group">
                <label for="lastName">Last Name</label>
                <input id="lastName" formControlName="lastName" type="text" placeholder="e.g. El Mansouri" />
              </div>
              <div class="form-group">
                <label for="dateOfBirth">Date of Birth</label>
                <input id="dateOfBirth" formControlName="dateOfBirth" type="date" />
              </div>
              <div class="form-group">
                <label for="gender">Gender</label>
                <select id="gender" formControlName="gender">
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label for="cin">CIN / National ID</label>
                <input id="cin" formControlName="cin" type="text" placeholder="e.g. BK123456" />
              </div>
            </div>
          </div>

          <!-- Contact Section -->
          <div class="form-section">
            <h2 class="section-title">Contact Information</h2>
            <div class="inputs-grid">
              <div class="form-group">
                <label for="email">Email Address</label>
                <input id="email" formControlName="email" type="email" placeholder="amine.m@email.com" />
              </div>
              <div class="form-group">
                <label for="phone">Phone Number</label>
                <input id="phone" formControlName="phone" type="tel" placeholder="+212 600-000000" />
              </div>
              <div class="form-group full-width">
                <label for="address">Full Address</label>
                <textarea id="address" formControlName="address" rows="2" placeholder="Street, City, Country"></textarea>
              </div>
            </div>
          </div>

          <!-- Insurance Section -->
          <div class="form-section">
            <h2 class="section-title">Insurance</h2>
            <div class="inputs-grid">
              <div class="form-group">
                <label for="insuranceProvider">Provider</label>
                <select id="insuranceProvider" formControlName="insuranceProvider">
                  <option value="">None</option>
                  <option value="CNOPS">CNOPS</option>
                  <option value="CNAM">CNAM</option>
                  <option value="RAMED">RAMED</option>
                  <option value="PRIVATE">Private Insurance</option>
                </select>
              </div>
              <div class="form-group">
                <label for="insuranceNumber">Policy Number</label>
                <input id="insuranceNumber" formControlName="insuranceNumber" type="text" />
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-ghost" routerLink="/patients">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="patientForm.invalid">
            Register Patient
          </button>
        </div>
      </form>
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
export class PatientRegistrationComponent {
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private router = inject(Router);

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

  onSubmit() {
    if (this.patientForm.valid) {
      this.patientService.addPatient(this.patientForm.value as any);
      this.router.navigate(['/patients']);
    }
  }
}
