import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  StockItem,
  Supplier,
  Treatment,
  PurchaseOrder,
  DeliveryNote,
  VendorInvoice,
  SalesOrder,
  TreatmentInvoice,
  StockMovement,
  CountSession,
  InventoryKPI,
  TreatmentProfitability,
  POStatus,
} from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class StockService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/stock`;

  // ─── Stock Items (BR04) ────────────────────────────────────────────────────

  getStockItems(): Observable<StockItem[]> {
    return this.http.get<StockItem[]>(`${this.baseUrl}/items`);
  }

  getStockItem(id: string): Observable<StockItem> {
    return this.http.get<StockItem>(`${this.baseUrl}/items/${id}`);
  }

  createStockItem(item: Partial<StockItem>): Observable<StockItem> {
    return this.http.post<StockItem>(`${this.baseUrl}/items`, item);
  }

  updateStockItem(id: string, item: Partial<StockItem>): Observable<StockItem> {
    return this.http.put<StockItem>(`${this.baseUrl}/items/${id}`, item);
  }

  deleteStockItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/items/${id}`);
  }

  getLowStockItems(): Observable<StockItem[]> {
    return this.http.get<StockItem[]>(`${this.baseUrl}/items/low-stock`);
  }

  getExpiringItems(daysAhead: number = 30): Observable<StockItem[]> {
    const params = new HttpParams().set('daysAhead', daysAhead.toString());
    return this.http.get<StockItem[]>(`${this.baseUrl}/items/expiring`, { params });
  }

  // ─── Suppliers ────────────────────────────────────────────────────────────

  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.baseUrl}/suppliers`);
  }

  getSupplier(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.baseUrl}/suppliers/${id}`);
  }

  createSupplier(supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.baseUrl}/suppliers`, supplier);
  }

  updateSupplier(id: string, supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.baseUrl}/suppliers/${id}`, supplier);
  }

  deleteSupplier(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/suppliers/${id}`);
  }

  // ─── Stock Movements Ledger (BR06) ────────────────────────────────────────

  getAllMovements(): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.baseUrl}/movements`);
  }

  getItemMovements(itemId: string): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.baseUrl}/items/${itemId}/movements`);
  }

  adjustStock(itemId: string, quantity: number, notes: string, createdBy?: string): Observable<StockMovement> {
    let params = new HttpParams().set('quantity', quantity.toString()).set('notes', notes);
    if (createdBy) params = params.set('createdBy', createdBy);
    return this.http.post<StockMovement>(`${this.baseUrl}/items/${itemId}/adjustment`, {}, { params });
  }

  // ─── Treatments & Action Setup (BR05) ─────────────────────────────────────

  getTreatments(): Observable<Treatment[]> {
    return this.http.get<Treatment[]>(`${this.baseUrl}/treatments`);
  }

  getTreatment(id: string): Observable<Treatment> {
    return this.http.get<Treatment>(`${this.baseUrl}/treatments/${id}`);
  }

  createTreatment(treatment: Partial<Treatment>): Observable<Treatment> {
    return this.http.post<Treatment>(`${this.baseUrl}/treatments`, treatment);
  }

  updateTreatment(id: string, treatment: Partial<Treatment>): Observable<Treatment> {
    return this.http.put<Treatment>(`${this.baseUrl}/treatments/${id}`, treatment);
  }

  deleteTreatment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/treatments/${id}`);
  }

  // ─── Purchase Orders (BR01) ───────────────────────────────────────────────

  getPurchaseOrders(): Observable<PurchaseOrder[]> {
    return this.http.get<PurchaseOrder[]>(`${this.baseUrl}/purchase-orders`);
  }

  getPurchaseOrder(id: string): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.baseUrl}/purchase-orders/${id}`);
  }

  createPurchaseOrder(order: Partial<PurchaseOrder>): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.baseUrl}/purchase-orders`, order);
  }

  updatePurchaseOrder(id: string, order: Partial<PurchaseOrder>): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.baseUrl}/purchase-orders/${id}`, order);
  }

  updatePOStatus(id: string, status: POStatus): Observable<PurchaseOrder> {
    const params = new HttpParams().set('status', status);
    return this.http.put<PurchaseOrder>(`${this.baseUrl}/purchase-orders/${id}/status`, {}, { params });
  }

  confirmPurchaseOrder(id: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.baseUrl}/purchase-orders/${id}/confirm`, {});
  }

  deletePurchaseOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/purchase-orders/${id}`);
  }

  // ─── Delivery Notes / GRNI (BR02) ─────────────────────────────────────────

  getDeliveryNotes(): Observable<DeliveryNote[]> {
    return this.http.get<DeliveryNote[]>(`${this.baseUrl}/delivery-notes`);
  }

  /** Open GRNIs: received but not yet vendor-invoiced (BR03 GRNI selection) */
  getOpenGrni(): Observable<DeliveryNote[]> {
    return this.http.get<DeliveryNote[]>(`${this.baseUrl}/delivery-notes/open-grni`);
  }

  getDeliveryNote(id: string): Observable<DeliveryNote> {
    return this.http.get<DeliveryNote>(`${this.baseUrl}/delivery-notes/${id}`);
  }

  createDeliveryNote(note: Partial<DeliveryNote>): Observable<DeliveryNote> {
    return this.http.post<DeliveryNote>(`${this.baseUrl}/delivery-notes`, note);
  }

  receiveDeliveryNote(id: string, receivedBy: string, notes?: string): Observable<DeliveryNote> {
    let params = new HttpParams().set('receivedBy', receivedBy);
    if (notes) params = params.set('notes', notes);
    return this.http.post<DeliveryNote>(`${this.baseUrl}/delivery-notes/${id}/receive`, {}, { params });
  }

  deleteDeliveryNote(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delivery-notes/${id}`);
  }

  // ─── Vendor Invoices (BR03) ───────────────────────────────────────────────

  getVendorInvoices(): Observable<VendorInvoice[]> {
    return this.http.get<VendorInvoice[]>(`${this.baseUrl}/vendor-invoices`);
  }

  getVendorInvoice(id: string): Observable<VendorInvoice> {
    return this.http.get<VendorInvoice>(`${this.baseUrl}/vendor-invoices/${id}`);
  }

  createVendorInvoice(invoice: Partial<VendorInvoice>): Observable<VendorInvoice> {
    return this.http.post<VendorInvoice>(`${this.baseUrl}/vendor-invoices`, invoice);
  }

  validateVendorInvoice(id: string, validatedBy: string): Observable<VendorInvoice> {
    const params = new HttpParams().set('validatedBy', validatedBy);
    return this.http.post<VendorInvoice>(`${this.baseUrl}/vendor-invoices/${id}/validate`, {}, { params });
  }

  cancelVendorInvoice(id: string): Observable<VendorInvoice> {
    return this.http.post<VendorInvoice>(`${this.baseUrl}/vendor-invoices/${id}/cancel`, {});
  }

  deleteVendorInvoice(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/vendor-invoices/${id}`);
  }

  // ─── Sales Orders ─────────────────────────────────────────────────────────

  getSalesOrders(): Observable<SalesOrder[]> {
    return this.http.get<SalesOrder[]>(`${this.baseUrl}/sales-orders`);
  }

  getSalesOrder(id: string): Observable<SalesOrder> {
    return this.http.get<SalesOrder>(`${this.baseUrl}/sales-orders/${id}`);
  }

  createSalesOrder(order: Partial<SalesOrder>): Observable<SalesOrder> {
    return this.http.post<SalesOrder>(`${this.baseUrl}/sales-orders`, order);
  }

  confirmSalesOrder(id: string, confirmedBy: string): Observable<SalesOrder> {
    const params = new HttpParams().set('confirmedBy', confirmedBy);
    return this.http.post<SalesOrder>(`${this.baseUrl}/sales-orders/${id}/confirm`, {}, { params });
  }

  cancelSalesOrder(id: string, cancelledBy: string): Observable<SalesOrder> {
    const params = new HttpParams().set('cancelledBy', cancelledBy);
    return this.http.post<SalesOrder>(`${this.baseUrl}/sales-orders/${id}/cancel`, {}, { params });
  }

  deleteSalesOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sales-orders/${id}`);
  }

  // ─── Treatment Invoices / Sessions (BR07) ─────────────────────────────────

  getTreatmentInvoices(): Observable<TreatmentInvoice[]> {
    return this.http.get<TreatmentInvoice[]>(`${this.baseUrl}/treatment-invoices`);
  }

  getTreatmentInvoice(id: string): Observable<TreatmentInvoice> {
    return this.http.get<TreatmentInvoice>(`${this.baseUrl}/treatment-invoices/${id}`);
  }

  getPatientTreatmentInvoices(patientId: string): Observable<TreatmentInvoice[]> {
    return this.http.get<TreatmentInvoice[]>(`${this.baseUrl}/treatment-invoices/patient/${patientId}`);
  }

  createDraftTreatmentInvoice(patientId: string, treatmentId: string, createdBy?: string): Observable<TreatmentInvoice> {
    let params = new HttpParams().set('patientId', patientId).set('treatmentId', treatmentId);
    if (createdBy) params = params.set('createdBy', createdBy);
    return this.http.post<TreatmentInvoice>(`${this.baseUrl}/treatment-invoices/draft`, {}, { params });
  }

  saveTreatmentInvoice(invoice: Partial<TreatmentInvoice>): Observable<TreatmentInvoice> {
    if (invoice.id) {
      return this.http.put<TreatmentInvoice>(`${this.baseUrl}/treatment-invoices/${invoice.id}`, invoice);
    }
    return this.http.post<TreatmentInvoice>(`${this.baseUrl}/treatment-invoices`, invoice);
  }

  finalizeTreatmentInvoice(id: string, finalizedBy: string): Observable<TreatmentInvoice> {
    const params = new HttpParams().set('finalizedBy', finalizedBy);
    return this.http.post<TreatmentInvoice>(`${this.baseUrl}/treatment-invoices/${id}/finalize`, {}, { params });
  }

  cancelTreatmentInvoice(id: string, cancelledBy: string): Observable<TreatmentInvoice> {
    const params = new HttpParams().set('cancelledBy', cancelledBy);
    return this.http.post<TreatmentInvoice>(`${this.baseUrl}/treatment-invoices/${id}/cancel`, {}, { params });
  }

  deleteTreatmentInvoice(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/treatment-invoices/${id}`);
  }

  // ─── Analytics (BR07, BR09) ───────────────────────────────────────────────

  getTreatmentProfitability(): Observable<TreatmentProfitability[]> {
    return this.http.get<TreatmentProfitability[]>(`${this.baseUrl}/analytics/treatment-profitability`);
  }

  getInventoryKPI(): Observable<InventoryKPI> {
    return this.http.get<InventoryKPI>(`${this.baseUrl}/analytics/kpi`);
  }

  // ─── Physical Count Sessions (BR08) ───────────────────────────────────────

  getCountSessions(): Observable<CountSession[]> {
    return this.http.get<CountSession[]>(`${this.baseUrl}/count-sessions`);
  }

  getCountSession(id: string): Observable<CountSession> {
    return this.http.get<CountSession>(`${this.baseUrl}/count-sessions/${id}`);
  }

  /** Create a session — backend freezes current stock snapshot (BR08) */
  createCountSession(notes?: string): Observable<CountSession> {
    const body = notes ? { notes } : {};
    return this.http.post<CountSession>(`${this.baseUrl}/count-sessions`, body);
  }

  /** Enter physical quantities for lines */
  updateCountSessionLines(id: string, lines: { stockItemId: string; physicalQuantity: number; notes?: string }[]): Observable<CountSession> {
    return this.http.put<CountSession>(`${this.baseUrl}/count-sessions/${id}/lines`, lines);
  }

  /** Validate & post adjustments — updates inventory balance + generates ledger entries (BR08) */
  validateCountSession(id: string, validatedBy: string): Observable<CountSession> {
    const params = new HttpParams().set('validatedBy', validatedBy);
    return this.http.post<CountSession>(`${this.baseUrl}/count-sessions/${id}/validate`, {}, { params });
  }

  cancelCountSession(id: string): Observable<CountSession> {
    return this.http.post<CountSession>(`${this.baseUrl}/count-sessions/${id}/cancel`, {});
  }
}
