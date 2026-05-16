export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'INSURANCE' | 'CHEQUE';
export type ClaimStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';
export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface InvoiceLine {
  id?: string;
  actCode?: string;
  label: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
  sortOrder: number;
}

export interface Invoice {
  id: string;
  practiceId: string;
  patientId: string;
  patientName?: string;
  treatmentPlanId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  regionCode: string;
  insuranceScheme?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lines: InvoiceLine[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: string;
  reference?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  practiceId: string;
  patientId: string;
  patientName?: string;
  treatmentPlanId?: string;
  quoteNumber: string;
  status: QuoteStatus;
  issueDate: string;
  expiryDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  regionCode: string;
  notes?: string;
  convertedToInvoiceId?: string;
  rejectionReason?: string;
  lines: InvoiceLine[];
}

export interface InsuranceClaim {
  id: string;
  invoiceId: string;
  insuranceScheme: string;
  status: ClaimStatus;
  coveragePct: number;
  claimAmount: number;
  paidAmount: number;
  reference?: string;
  notes?: string;
}

export interface BillingSummary {
  periodStart: string;
  periodEnd: string;
  totalInvoiced: number;
  totalCollected: number;
  outstandingAmount: number;
  invoiceCount: number;
  byStatus: Record<InvoiceStatus, number>;
}
