import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice, Payment } from '../../models/billing.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    @if (invoice(); as inv) {
      <div class="invoice-detail-container">
        <header class="page-header">
          <div class="header-content">
            <button class="back-btn" routerLink="..">
              <span class="material-icons">arrow_back</span>
            </button>
            <div class="title-with-status">
              <h1>Invoice {{ inv.invoiceNumber }}</h1>
              <span class="status-badge" [class]="inv.status.toLowerCase().replace('_', '-')">
                {{ inv.status.replace('_', ' ') }}
              </span>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-secondary">
              <span class="material-icons">download</span>
              PDF
            </button>
            <button class="btn-secondary">
              <span class="material-icons">email</span>
              Send
            </button>
            @if (inv.status === 'DRAFT') {
              <button class="btn-primary">Edit Invoice</button>
            }
          </div>
        </header>

        <div class="detail-grid">
          <div class="main-content">
            <div class="card patient-card">
              <div class="card-header">
                <h3>Patient & Practice</h3>
              </div>
              <div class="card-body info-grid">
                <div class="info-group">
                  <label>Bill To</label>
                  <span class="info-value">{{ inv.patientName }}</span>
                  <span class="info-sub">Patient ID: {{ inv.patientId }}</span>
                </div>
                <div class="info-group">
                  <label>Practice</label>
                  <span class="info-value">OrthoFlow Clinic</span>
                  <span class="info-sub">Casablanca, Morocco</span>
                </div>
                <div class="info-group">
                  <label>Issue Date</label>
                  <span class="info-value">{{ inv.issueDate | date:'longDate' }}</span>
                </div>
                <div class="info-group">
                  <label>Due Date</label>
                  <span class="info-value">{{ inv.dueDate | date:'longDate' }}</span>
                </div>
              </div>
            </div>

            <div class="card items-card">
              <div class="card-header">
                <h3>Line Items</h3>
              </div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Discount</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of inv.lines; track $index) {
                    <tr>
                      <td>{{ line.label }}</td>
                      <td class="text-right">{{ line.quantity }}</td>
                      <td class="text-right">{{ line.unitPrice | number:'1.2-2' }}</td>
                      <td class="text-right">{{ line.discountPct }}%</td>
                      <td class="text-right font-bold">{{ line.lineTotal | number:'1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
              <div class="totals-section">
                <div class="total-row">
                  <span>Subtotal</span>
                  <span>{{ inv.subtotal | number:'1.2-2' }} {{ inv.currency }}</span>
                </div>
                <div class="total-row">
                  <span>Discount</span>
                  <span class="text-success">-{{ inv.discountAmount | number:'1.2-2' }} {{ inv.currency }}</span>
                </div>
                <div class="total-row">
                  <span>Tax</span>
                  <span>{{ inv.taxAmount | number:'1.2-2' }} {{ inv.currency }}</span>
                </div>
                <div class="total-row grand-total">
                  <span>Total</span>
                  <span>{{ inv.total | number:'1.2-2' }} {{ inv.currency }}</span>
                </div>
              </div>
            </div>

            <div class="card payments-card">
              <div class="card-header">
                <h3>Payment History</h3>
              </div>
              <div class="card-body">
                @if (inv.payments && inv.payments.length > 0) {
                  <div class="payment-timeline">
                    @for (payment of inv.payments; track payment.id) {
                      <div class="payment-item">
                        <div class="payment-icon" [ngSwitch]="payment.method">
                          <span class="material-icons" *ngSwitchCase="'CASH'">payments</span>
                          <span class="material-icons" *ngSwitchCase="'CARD'">credit_card</span>
                          <span class="material-icons" *ngSwitchDefault>account_balance</span>
                        </div>
                        <div class="payment-details">
                          <div class="payment-main">
                            <span class="payment-amount">{{ payment.amount | number:'1.2-2' }} {{ inv.currency }}</span>
                            <span class="payment-method">{{ payment.method }}</span>
                          </div>
                          <div class="payment-meta">
                            <span>{{ payment.paymentDate | date:'mediumDate' }}</span>
                            <span>•</span>
                            <span>By {{ payment.recordedBy }}</span>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="empty-msg">No payments recorded yet.</p>
                }
              </div>
            </div>
          </div>

          <div class="sidebar">
            <div class="card balance-card">
              <div class="balance-content">
                <span class="balance-label">Remaining Balance</span>
                <span class="balance-value" [class.paid]="remainingBalance() === 0">
                  {{ remainingBalance() | number:'1.2-2' }} {{ inv.currency }}
                </span>
              </div>
              @if (remainingBalance() > 0) {
                <button class="btn-primary full-width" (click)="showPaymentForm.set(true)">
                  <span class="material-icons">add</span>
                  Record Payment
                </button>
              }
            </div>

            @if (showPaymentForm()) {
              <div class="card payment-form-card">
                <div class="card-header">
                  <h3>Record Payment</h3>
                  <button class="icon-btn" (click)="showPaymentForm.set(false)">
                    <span class="material-icons">close</span>
                  </button>
                </div>
                <div class="card-body">
                  <div class="form-group">
                    <label>Amount</label>
                    <input type="number" [(ngModel)]="paymentAmount" class="form-control">
                  </div>
                  <div class="form-group">
                    <label>Method</label>
                    <select [(ngModel)]="paymentMethod" class="form-control">
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Reference #</label>
                    <input type="text" [(ngModel)]="paymentRef" class="form-control" placeholder="Optional">
                  </div>
                  <button class="btn-primary full-width mt-4" (click)="recordPayment()">
                    Submit Payment
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="loading">Loading invoice...</div>
    }
  `,
  styles: [`
    .invoice-detail-container {
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

    .header-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .back-btn {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 0.5rem;
      cursor: pointer;
      display: flex;
      color: #6b7280;
      transition: all 0.2s;
    }

    .back-btn:hover { background: #f9fafb; color: #4f46e5; }

    .title-with-status {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .title-with-status h1 {
      margin: 0;
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.draft { background: #f3f4f6; color: #374151; }
    .status-badge.sent { background: #e0e7ff; color: #4338ca; }
    .status-badge.partially-paid { background: #fef3c7; color: #92400e; }
    .status-badge.paid { background: #dcfce7; color: #166534; }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
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
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 2rem;
    }

    .card {
      background: white;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }

    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f3f4f6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
    }

    .card-body {
      padding: 1.5rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }

    .info-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-group label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-value {
      font-weight: 600;
      color: #111827;
    }

    .info-sub {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
    }

    .items-table th {
      background: #f9fafb;
      padding: 0.75rem 1.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
    }

    .items-table td {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f3f4f6;
      color: #374151;
    }

    .text-right { text-align: right; }
    .font-bold { font-weight: 600; }

    .totals-section {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.75rem;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      width: 250px;
      font-size: 0.95rem;
      color: #4b5563;
    }

    .total-row.grand-total {
      margin-top: 0.5rem;
      padding-top: 1rem;
      border-top: 2px solid #f3f4f6;
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
    }

    .text-success { color: #059669; }

    .payment-timeline {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .payment-item {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .payment-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #f3f4f6;
      color: #4b5563;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .payment-details {
      flex: 1;
    }

    .payment-main {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.125rem;
    }

    .payment-amount { font-weight: 600; color: #111827; }
    .payment-method { font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; }
    .payment-meta { font-size: 0.8125rem; color: #6b7280; display: flex; gap: 0.5rem; }

    .balance-card {
      padding: 1.5rem;
      background: #1e293b;
      color: white;
      border: none;
    }

    .balance-content {
      display: flex;
      flex-direction: column;
      margin-bottom: 1.5rem;
    }

    .balance-label { font-size: 0.875rem; opacity: 0.8; }
    .balance-value { font-size: 2rem; font-weight: 700; }
    .balance-value.paid { color: #4ade80; }

    .full-width { width: 100%; justify-content: center; }

    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; }
    .form-control { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; outline: none; }

    .mt-4 { margin-top: 1rem; }

    @media (max-width: 992px) {
      .detail-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class InvoiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private invoiceService = inject(InvoiceService);

  invoice = signal<Invoice | null>(null);
  showPaymentForm = signal(false);

  paymentAmount = 0;
  paymentMethod: any = 'CASH';
  paymentRef = '';

  remainingBalance = signal(0);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const inv = this.invoiceService.getInvoice(id);
      if (inv) {
        this.invoice.set(inv);
        this.calculateBalance();
      }
    }
  }

  calculateBalance() {
    const inv = this.invoice();
    if (inv) {
      const paid = inv.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      this.remainingBalance.set(inv.total - paid);
      this.paymentAmount = this.remainingBalance();
    }
  }

  async recordPayment() {
    const inv = this.invoice();
    if (inv) {
      try {
        await this.invoiceService.recordPayment(inv.id, {
          amount: this.paymentAmount,
          method: this.paymentMethod,
          paymentDate: new Date().toISOString().split('T')[0],
          reference: this.paymentRef
        });
        
        // Refresh local state
        const updatedInv = await this.invoiceService.getInvoice(inv.id);
        this.invoice.set(updatedInv || null);
        this.calculateBalance();
        this.showPaymentForm.set(false);
      } catch (error) {
        alert('Failed to record payment');
      }
    }
  }
}
