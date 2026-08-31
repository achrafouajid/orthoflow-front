import jsPDF from 'jspdf';
import { Invoice } from '../../features/billing/models/billing.model';

/**
 * Generates a simple, honest invoice PDF from real invoice data — the
 * "Download PDF" button on invoice rows previously had no handler at all
 * (audit VIII.5). This is deliberately plain (no letterhead template, no
 * clinic branding) rather than reaching for the fabricated-numbers pattern
 * the audit flagged elsewhere (the old "Daily Practice Report" PDF) — every
 * figure here comes straight from the Invoice object passed in.
 *
 * The patient's name is a parameter rather than a field read off `invoice`,
 * because `InvoiceResponse` does not carry one. This function used to render
 * `invoice.patientName`, which the server has never sent — so every generated
 * PDF said "Patient: —". The caller knows the patient (it has just resolved
 * one to display the row) and passes it in explicitly.
 *
 * Invoice notes are likewise not returned by the API. `CreateInvoiceRequest`
 * accepts a `notes` field and the server stores it, but `InvoiceResponse` has
 * no `notes`, so there is nothing to print; the block that tried was removed
 * rather than left rendering a permanently undefined value.
 */
export function downloadInvoicePdf(invoice: Invoice, patientName?: string): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const marginX = 20;
  let y = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', marginX, y);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber || '—', 210 - marginX, y, { align: 'right' });

  y += 12;
  doc.setDrawColor(200);
  doc.line(marginX, y, 210 - marginX, y);
  y += 10;

  doc.setFontSize(10);
  doc.text(`Patient: ${patientName || '—'}`, marginX, y);
  doc.text(`Status: ${invoice.status}`, 210 - marginX, y, { align: 'right' });
  y += 6;
  doc.text(`Issue date: ${formatDate(invoice.issueDate)}`, marginX, y);
  doc.text(`Due date: ${formatDate(invoice.dueDate)}`, 210 - marginX, y, { align: 'right' });
  y += 12;

  // Line items table header
  doc.setFont('helvetica', 'bold');
  doc.text('Description', marginX, y);
  doc.text('Qty', 120, y, { align: 'right' });
  doc.text('Unit Price', 155, y, { align: 'right' });
  doc.text('Total', 190, y, { align: 'right' });
  y += 4;
  doc.line(marginX, y, 210 - marginX, y);
  y += 6;
  doc.setFont('helvetica', 'normal');

  for (const line of invoice.lines || []) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.text(line.label || '—', marginX, y, { maxWidth: 85 });
    doc.text(String(line.quantity ?? ''), 120, y, { align: 'right' });
    doc.text(formatMoney(line.unitPrice), 155, y, { align: 'right' });
    doc.text(formatMoney(line.lineTotal), 190, y, { align: 'right' });
    y += 7;
  }

  y += 6;
  doc.line(120, y, 210 - marginX, y);
  y += 7;

  doc.text('Subtotal', 155, y, { align: 'right' });
  doc.text(formatMoney(invoice.subtotal), 190, y, { align: 'right' });
  y += 6;
  doc.text('Tax', 155, y, { align: 'right' });
  doc.text(formatMoney(invoice.taxAmount), 190, y, { align: 'right' });
  y += 6;
  if (invoice.discountAmount) {
    doc.text('Discount', 155, y, { align: 'right' });
    doc.text(`-${formatMoney(invoice.discountAmount)}`, 190, y, { align: 'right' });
    y += 6;
  }
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 155, y, { align: 'right' });
  doc.text(`${formatMoney(invoice.total)} ${invoice.currency || ''}`.trim(), 190, y, { align: 'right' });

  doc.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);
}

function formatMoney(value: number | undefined | null): string {
  return (value ?? 0).toFixed(2);
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}
