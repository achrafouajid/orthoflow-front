import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Invoice, InvoiceStatus, Payment, Quote, BillingSummary } from '../models/billing.model';
import { tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1';

  private invoicesSignal = signal<Invoice[]>([]);
  private quotesSignal = signal<Quote[]>([]);
  private currentInvoiceSignal = signal<Invoice | null>(null);
  private summarySignal = signal<BillingSummary | null>(null);

  invoices = computed(() => this.invoicesSignal());
  quotes = computed(() => this.quotesSignal());
  currentInvoice = computed(() => this.currentInvoiceSignal());
  summary = computed(() => this.summarySignal());

  constructor() {
    this.refreshInvoices();
  }

  async refreshInvoices() {
    try {
      const [invoices, summary] = await Promise.all([
        firstValueFrom(this.http.get<Invoice[]>(`${this.apiUrl}/invoices`)),
        firstValueFrom(this.http.get<BillingSummary>(`${this.apiUrl}/invoices/summary`))
      ]);
      this.invoicesSignal.set(invoices);
      this.summarySignal.set(summary);
    } catch (error) {
      console.error('Failed to fetch invoices or summary', error);
    }
  }

  async getInvoice(id: string) {
    try {
      const invoice = await firstValueFrom(this.http.get<Invoice>(`${this.apiUrl}/invoices/${id}`));
      this.currentInvoiceSignal.set(invoice);
      return invoice;
    } catch (error) {
      console.error('Failed to fetch invoice', error);
      return null;
    }
  }

  async createInvoice(invoice: any) {
    try {
      const newInvoice = await firstValueFrom(this.http.post<Invoice>(`${this.apiUrl}/invoices`, invoice));
      this.invoicesSignal.update(invoices => [...invoices, newInvoice]);
      return newInvoice;
    } catch (error) {
      console.error('Failed to create invoice', error);
      throw error;
    }
  }

  async recordPayment(invoiceId: string, payment: any) {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/invoices/${invoiceId}/payments`, payment));
      // Refresh current invoice and list
      await this.getInvoice(invoiceId);
      await this.refreshInvoices();
    } catch (error) {
      console.error('Failed to record payment', error);
      throw error;
    }
  }

  getBillingSummary() {
    // This could also be a Signal or a call to a dedicated endpoint
    // For now, let's make it an async call that updates a signal if needed
    return firstValueFrom(this.http.get<BillingSummary>(`${this.apiUrl}/invoices/summary`));
  }
}
