import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="patient-list-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Patients</h1>
          <p>Manage your patient dossiers and treatment plans</p>
        </div>
        <button class="btn-primary" routerLink="register">
          <span class="material-icons">add</span>
          New Patient
        </button>
      </header>

      <div class="filters-bar">
        <div class="search-input">
          <span class="material-icons">search</span>
          <input type="text" placeholder="Search by name, ID or phone..." />
        </div>
        <div class="filters-actions">
          <button class="btn-secondary">
            <span class="material-icons">filter_list</span>
            Filters
          </button>
        </div>
      </div>

      <div class="table-card">
        <table class="patients-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Status</th>
              <th>Next Appointment</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (patient of patientService.patients(); track patient.id) {
              <tr class="clickable-row" [routerLink]="[patient.id]">
                <td>
                  <div class="patient-info">
                    <div class="patient-avatar">
                      {{ patient.firstName[0] }}{{ patient.lastName[0] }}
                    </div>
                    <div class="patient-details">
                      <span class="patient-name">{{ patient.firstName }} {{ patient.lastName }}</span>
                      <span class="patient-id">ID: {{ patient.id }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="status-badge" [class]="patient.status.toLowerCase()">
                    {{ patient.status }}
                  </span>
                </td>
                <td>
                  <div class="appointment-info">
                    <span class="date">May 24, 2026</span>
                    <span class="type">Consultation</span>
                  </div>
                </td>
                <td>
                  <div class="contact-info">
                    <span>{{ patient.phone }}</span>
                    <span class="email">{{ patient.email }}</span>
                  </div>
                </td>
                <td>
                  <div class="row-actions">
                    <button class="icon-btn" title="View Dossier">
                      <span class="material-icons">visibility</span>
                    </button>
                    <button class="icon-btn" title="Edit">
                      <span class="material-icons">edit</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .patient-list-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-content h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .header-content p {
      color: var(--text-secondary);
      margin: 0.5rem 0 0 0;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
      transition: all 0.2s ease;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .search-input {
      flex: 1;
      position: relative;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      display: flex;
      align-items: center;
      padding: 0 1rem;
      transition: all 0.2s ease;
    }

    .search-input:focus-within {
      border-color: #6366f1;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
    }

    .search-input input {
      border: none;
      padding: 0.75rem 0.5rem;
      width: 100%;
      outline: none;
      font-size: 0.95rem;
    }

    .search-input .material-icons {
      color: #9ca3af;
    }

    .btn-secondary {
      background: white;
      border: 1px solid #e5e7eb;
      color: #374151;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    .table-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }

    .patients-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .patients-table th {
      background: #f9fafb;
      padding: 1rem 1.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .patients-table td {
      padding: 1.25rem 1.5rem;
      border-top: 1px solid #f3f4f6;
    }

    .clickable-row {
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .clickable-row:hover {
      background: #f8fafc;
    }

    .patient-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .patient-avatar {
      width: 40px;
      height: 40px;
      background: #e0e7ff;
      color: #4338ca;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .patient-details {
      display: flex;
      flex-direction: column;
    }

    .patient-name {
      font-weight: 600;
      color: #111827;
    }

    .patient-id {
      font-size: 0.8rem;
      color: #6b7280;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge.active {
      background: #dcfce7;
      color: #166534;
    }

    .appointment-info, .contact-info {
      display: flex;
      flex-direction: column;
    }

    .appointment-info .date, .contact-info span {
      font-size: 0.9rem;
      color: #374151;
      font-weight: 500;
    }

    .appointment-info .type, .contact-info .email {
      font-size: 0.8rem;
      color: #6b7280;
    }

    .row-actions {
      display: flex;
      gap: 0.5rem;
    }

    .icon-btn {
      background: transparent;
      border: none;
      color: #9ca3af;
      padding: 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .icon-btn:hover {
      background: #f3f4f6;
      color: #4f46e5;
    }

    /* Responsive Styles */
    @media (max-width: 768px) {
      .patient-list-container {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .btn-primary {
        width: 100%;
        justify-content: center;
      }

      .filters-bar {
        flex-direction: column;
      }

      .btn-secondary {
        width: 100%;
        justify-content: center;
      }

      .table-card {
        border: none;
        box-shadow: none;
        background: transparent;
      }

      .patients-table thead {
        display: none;
      }

      .patients-table tr {
        display: block;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        margin-bottom: 1rem;
        padding: 1rem;
      }

      .patients-table td {
        display: block;
        padding: 0.5rem 0;
        border: none;
      }

      .patient-info {
        margin-bottom: 0.5rem;
      }

      .status-badge {
        display: inline-block;
        margin-bottom: 0.5rem;
      }

      .row-actions {
        margin-top: 1rem;
        justify-content: flex-end;
        border-top: 1px solid #f3f4f6;
        padding-top: 1rem;
      }
    }
  `]
})
export class PatientListComponent {
  patientService = inject(PatientService);
}
