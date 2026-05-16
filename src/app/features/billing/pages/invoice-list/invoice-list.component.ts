import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { InvoiceStatus } from '../../models/billing.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="billing-container">
      <header class="page-header">
        <div class="header-content">
          <h1>{{ 'BILLING.TITLE' | translate }}</h1>
          <p>{{ 'BILLING.SUBTITLE' | translate }}</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" routerLink="/billing/quotes">
            <span class="material-icons">description</span>
            {{ 'BILLING.QUOTES' | translate }}
          </button>
          <button class="btn-primary" routerLink="create">
            <span class="material-icons">add</span>
            {{ 'BILLING.NEW_INVOICE' | translate }}
          </button>
        </div>
      </header>

      <div class="stats-grid">
        @if (invoiceService.summary(); as summary) {
          <div class="stat-card">
            <div class="stat-icon invoiced">
              <span class="material-icons">receipt</span>
            </div>
            <div class="stat-info">
              <span class="stat-label">{{ 'BILLING.TOTAL_INVOICED' | translate }}</span>
              <span class="stat-value">{{ summary.totalInvoiced | number:'1.2-2' }} MAD</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon collected">
              <span class="material-icons">payments</span>
            </div>
            <div class="stat-info">
              <span class="stat-label">{{ 'BILLING.TOTAL_COLLECTED' | translate }}</span>
              <span class="stat-value">{{ summary.totalCollected | number:'1.2-2' }} MAD</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon outstanding">
              <span class="material-icons">pending_actions</span>
            </div>
            <div class="stat-info">
              <span class="stat-label">{{ 'BILLING.OUTSTANDING' | translate }}</span>
              <span class="stat-value">{{ summary.outstandingAmount | number:'1.2-2' }} MAD</span>
            </div>
          </div>
        }
      </div>

      <div class="filters-bar">
        <div class="search-input">
          <span class="material-icons">search</span>
          <input type="text" [placeholder]="'COMMON.SEARCH' | translate" />
        </div>
        <div class="filters-actions">
          <select class="filter-select">
            <option value="">{{ 'BILLING.ALL_STATUSES' | translate }}</option>
            <option value="DRAFT">{{ 'BILLING.STATUS.DRAFT' | translate }}</option>
            <option value="SENT">{{ 'BILLING.STATUS.SENT' | translate }}</option>
            <option value="PARTIALLY_PAID">{{ 'BILLING.STATUS.PARTIALLY_PAID' | translate }}</option>
            <option value="PAID">{{ 'BILLING.STATUS.PAID' | translate }}</option>
          </select>
          <button class="btn-filter">
            <span class="material-icons">filter_list</span>
            {{ 'COMMON.FILTER' | translate }}
          </button>
        </div>
      </div>

      <div class="table-card">
        <table class="billing-table">
          <thead>
            <tr>
              <th>{{ 'BILLING.INVOICE_NUMBER' | translate }}</th>
              <th>{{ 'PATIENTS.NAME' | translate }}</th>
              <th>{{ 'COMMON.STATUS' | translate }}</th>
              <th>{{ 'COMMON.DATE' | translate }}</th>
              <th>{{ 'COMMON.AMOUNT' | translate }}</th>
              <th>{{ 'COMMON.ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (invoice of invoiceService.invoices(); track invoice.id) {
              <tr class="clickable-row" [routerLink]="[invoice.id]">
                <td>
                  <span class="invoice-number">{{ invoice.invoiceNumber }}</span>
                </td>
                <td>
                  <div class="patient-info">
                    <span class="patient-name">{{ invoice.patientName }}</span>
                    <span class="region-tag">{{ invoice.regionCode }}</span>
                  </div>
                </td>
                <td>
                  <span class="status-badge" [class]="invoice.status.toLowerCase().replace('_', '-')">
                    {{ 'BILLING.STATUS.' + invoice.status | translate }}
                  </span>
                </td>
                <td>
                  <div class="date-info">
                    <span class="issue-date">{{ invoice.issueDate | date:'mediumDate' }}</span>
                    <span class="due-date">{{ 'BILLING.DUE' | translate }}: {{ invoice.dueDate | date:'mediumDate' }}</span>
                  </div>
                </td>
                <td>
                  <span class="amount-value">{{ invoice.total | number:'1.2-2' }} {{ invoice.currency }}</span>
                </td>
                <td>
                  <div class="row-actions">
                    <button class="icon-btn" [title]="'BILLING.DOWNLOAD_PDF' | translate" (click)="$event.stopPropagation()">
                      <span class="material-icons">download</span>
                    </button>
                    <button class="icon-btn" [title]="'BILLING.SEND_EMAIL' | translate" (click)="$event.stopPropagation()">
                      <span class="material-icons">alternate_email</span>
                    </button>
                    <button class="icon-btn" [title]="'COMMON.MORE' | translate" (click)="$event.stopPropagation()">
                      <span class="material-icons">more_vert</span>
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
    .billing-container {
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
      color: #111827;
      margin: 0;
    }

    .header-content p {
      color: #6b7280;
      margin: 0.5rem 0 0 0;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
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

    .btn-secondary {
      background: white;
      border: 1px solid #e5e7eb;
      color: #374151;
      padding: 0.75rem 1.5rem;
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
      border-color: #d1d5db;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon.invoiced { background: #eff6ff; color: #2563eb; }
    .stat-icon.collected { background: #ecfdf5; color: #059669; }
    .stat-icon.outstanding { background: #fff7ed; color: #d97706; }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
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
    }

    .search-input input {
      border: none;
      padding: 0.75rem 0.5rem;
      width: 100%;
      outline: none;
    }

    .search-input .material-icons { color: #9ca3af; }

    .filters-actions {
      display: flex;
      gap: 0.75rem;
    }

    .filter-select {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 0 1rem;
      background: white;
      color: #374151;
      font-weight: 500;
      outline: none;
    }

    .btn-filter {
      background: white;
      border: 1px solid #e5e7eb;
      color: #374151;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-weight: 500;
    }

    .table-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .billing-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .billing-table th {
      background: #f9fafb;
      padding: 1rem 1.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .billing-table td {
      padding: 1.25rem 1.5rem;
      border-top: 1px solid #f3f4f6;
    }

    .clickable-row {
      cursor: pointer;
      transition: background 0.2s;
    }

    .clickable-row:hover { background: #f8fafc; }

    .invoice-number {
      font-weight: 600;
      color: #4f46e5;
    }

    .patient-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .patient-name {
      font-weight: 500;
      color: #111827;
    }

    .region-tag {
      font-size: 0.7rem;
      background: #f3f4f6;
      color: #6b7280;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge.draft { background: #f3f4f6; color: #374151; }
    .status-badge.sent { background: #e0e7ff; color: #4338ca; }
    .status-badge.partially-paid { background: #fef3c7; color: #92400e; }
    .status-badge.paid { background: #dcfce7; color: #166534; }
    .status-badge.cancelled { background: #fee2e2; color: #991b1b; }

    .date-info {
      display: flex;
      flex-direction: column;
    }

    .issue-date { font-size: 0.9rem; color: #111827; }
    .due-date { font-size: 0.75rem; color: #6b7280; }

    .amount-value {
      font-weight: 700;
      color: #111827;
    }

    .row-actions {
      display: flex;
      gap: 0.25rem;
    }

    .icon-btn {
      background: transparent;
      border: none;
      color: #9ca3af;
      padding: 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .icon-btn:hover {
      background: #f3f4f6;
      color: #4f46e5;
    }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: 1fr; }
      .filters-bar { flex-direction: column; }
      .billing-table thead { display: none; }
      .billing-table tr { display: block; border-bottom: 1px solid #f3f4f6; padding: 1rem; }
      .billing-table td { display: flex; justify-content: space-between; padding: 0.5rem 0; border: none; }
      .billing-table td::before { content: attr(data-label); font-weight: 600; color: #6b7280; }
    }
  `]
})
export class InvoiceListComponent {
  invoiceService = inject(InvoiceService);
}
