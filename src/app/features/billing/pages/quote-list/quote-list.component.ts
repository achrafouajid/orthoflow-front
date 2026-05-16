import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="billing-container">
      <header class="page-header">
        <div class="header-content">
          <button class="back-btn" routerLink="/billing/invoices">
            <span class="material-icons">arrow_back</span>
          </button>
          <h1>Quotes (Devis)</h1>
          <p>Manage patient treatment quotes</p>
        </div>
        <button class="btn-primary">
          <span class="material-icons">add</span>
          New Quote
        </button>
      </header>

      <div class="table-card">
        <table class="billing-table">
          <thead>
            <tr>
              <th>Quote #</th>
              <th>Patient</th>
              <th>Status</th>
              <th>Issue Date</th>
              <th>Expiry Date</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (quote of invoiceService.quotes(); track quote.id) {
              <tr>
                <td><span class="quote-number">{{ quote.quoteNumber }}</span></td>
                <td>{{ quote.patientName }}</td>
                <td>
                  <span class="status-badge" [class]="quote.status.toLowerCase()">
                    {{ quote.status }}
                  </span>
                </td>
                <td>{{ quote.issueDate | date }}</td>
                <td>{{ quote.expiryDate | date }}</td>
                <td><span class="amount">{{ quote.total | number:'1.2-2' }} {{ quote.currency }}</span></td>
                <td>
                  <div class="row-actions">
                    <button class="icon-btn" title="Accept & Convert">
                      <span class="material-icons">check_circle</span>
                    </button>
                    <button class="icon-btn" title="Download PDF">
                      <span class="material-icons">download</span>
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
    .billing-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header-content { display: flex; align-items: center; gap: 1.5rem; }
    .header-content h1 { margin: 0; font-size: 1.875rem; font-weight: 700; }
    .back-btn { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 0.5rem; cursor: pointer; display: flex; color: #6b7280; }
    
    .btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white; border: none; padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer;
    }

    .table-card { background: white; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; }
    .billing-table { width: 100%; border-collapse: collapse; text-align: left; }
    .billing-table th { background: #f9fafb; padding: 1rem 1.5rem; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; }
    .billing-table td { padding: 1.25rem 1.5rem; border-top: 1px solid #f3f4f6; }
    
    .quote-number { font-weight: 600; color: #4f46e5; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.accepted { background: #dcfce7; color: #166534; }
    
    .amount { font-weight: 700; color: #111827; }
    .row-actions { display: flex; gap: 0.5rem; }
    .icon-btn { background: transparent; border: none; color: #9ca3af; padding: 0.5rem; border-radius: 8px; cursor: pointer; }
    .icon-btn:hover { color: #4f46e5; background: #f3f4f6; }
  `]
})
export class QuoteListComponent {
  invoiceService = inject(InvoiceService);
}
