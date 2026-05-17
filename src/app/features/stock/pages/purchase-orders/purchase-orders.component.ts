import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { StockService } from '../../../../core/services/stock.service';
import { 
  PurchaseOrder, 
  PurchaseOrderLine, 
  Supplier, 
  StockItem, 
  POStatus,
  DeliveryNote,
  DeliveryNoteLine,
  DNStatus
} from '../../../../core/models/stock.model';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      
      <!-- Top Title Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-ortho-navy">Procurement & Receipts</h1>
          <p class="text-sm text-ortho-navy/60">Generate purchase orders, manage supplier procurement, and confirm delivery note receipts.</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="openCreatePOModal()" class="flex items-center gap-2 px-4 py-2.5 bg-ortho-navy text-white font-medium rounded-xl hover:bg-ortho-navy/90 transition shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create Purchase Order
          </button>
        </div>
      </div>

      <!-- Module Navigation Pills -->
      <div class="flex flex-wrap gap-2 bg-ortho-navy/[0.03] p-1.5 rounded-xl border border-ortho-navy/5 max-w-max font-semibold text-xs">
        <a routerLink="/stock" class="px-4 py-2 rounded-lg transition text-ortho-navy/60 hover:text-ortho-navy hover:bg-white/50">
          Stock Catalog
        </a>
        <a routerLink="/stock/procurement" class="px-4 py-2 rounded-lg transition bg-white text-ortho-navy shadow-sm">
          Procurement & Receipts (PO/DN)
        </a>
        <a routerLink="/stock/direct-sales" class="px-4 py-2 rounded-lg transition text-ortho-navy/60 hover:text-ortho-navy hover:bg-white/50">
          Patient OTC Sales (SO)
        </a>
        <a routerLink="/stock/treatment-sessions" class="px-4 py-2 rounded-lg transition text-ortho-navy/60 hover:text-ortho-navy hover:bg-white/50">
          Treatment Sessions Logger
        </a>
      </div>


      <!-- Navigation Tabs -->
      <div class="border-b border-ortho-navy/10 flex gap-6">
        <button (click)="activeTab.set('orders')" class="pb-3 text-sm font-semibold transition" [class.text-ortho-navy]="activeTab() === 'orders'" [class.border-b-2]="activeTab() === 'orders'" [class.border-ortho-navy]="activeTab() === 'orders'" [class.text-ortho-navy/40]="activeTab() !== 'orders'">
          Purchase Orders
        </button>
        <button (click)="activeTab.set('deliveries')" class="pb-3 text-sm font-semibold transition" [class.text-ortho-navy]="activeTab() === 'deliveries'" [class.border-b-2]="activeTab() === 'deliveries'" [class.border-ortho-navy]="activeTab() === 'deliveries'" [class.text-ortho-navy/40]="activeTab() !== 'deliveries'">
          Delivery Receipts (DN)
        </button>
        <button (click)="activeTab.set('invoices')" class="pb-3 text-sm font-semibold transition" [class.text-ortho-navy]="activeTab() === 'invoices'" [class.border-b-2]="activeTab() === 'invoices'" [class.border-ortho-navy]="activeTab() === 'invoices'" [class.text-ortho-navy/40]="activeTab() !== 'invoices'">
          Vendor Invoices (GRNI clearing)
        </button>
      </div>

      <!-- Content Views -->
      @if (activeTab() === 'orders') {
        
        <!-- PO Catalog List -->
        <div class="bg-white rounded-2xl border border-ortho-navy/5 shadow-sm overflow-hidden">
          
          <div class="p-4 border-b border-ortho-navy/5 bg-ortho-navy/[0.01] flex items-center justify-between">
            <h3 class="text-base font-bold text-ortho-navy">Purchase Orders Registry</h3>
            <span class="text-xs text-ortho-navy/40 font-medium">Record of all wholesale orders placed to suppliers.</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="bg-ortho-navy/[0.02] text-ortho-navy/60 font-semibold border-b border-ortho-navy/5">
                  <th class="p-4">PO Number</th>
                  <th class="p-4">Supplier</th>
                  <th class="p-4">Order Date</th>
                  <th class="p-4 text-center">Status</th>
                  <th class="p-4 text-center">Items Ordered</th>
                  <th class="p-4 text-right">Total Amount</th>
                  <th class="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-ortho-navy/5">
                @for (po of purchaseOrders(); track po.id) {
                  <tr class="hover:bg-ortho-navy/[0.01] transition">
                    <td class="p-4 font-mono text-xs font-bold text-ortho-navy">{{ po.poNumber }}</td>
                    <td class="p-4 font-semibold text-ortho-navy/80">{{ po.supplier?.name }}</td>
                    <td class="p-4 text-ortho-navy/60 font-medium">{{ po.orderDate | date:'yyyy-MM-dd' }}</td>
                    <td class="p-4 text-center">
                      <span class="px-2.5 py-1 text-xs font-bold rounded-full border uppercase" [ngClass]="getPOStatusClasses(po.status!)">
                        {{ po.status }}
                      </span>
                    </td>
                    <td class="p-4 text-center font-bold text-ortho-navy/70">{{ po.lines.length }}</td>
                    <td class="p-4 text-right font-bold text-ortho-navy">{{ po.totalAmount | number:'1.2-2' }} DH</td>
                    <td class="p-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        @if (po.status === 'DRAFT') {
                          <button (click)="markAsSent(po)" class="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border border-blue-200 transition">
                            Mark as Sent
                          </button>
                        } @else if (po.status === 'SENT' || po.status === 'PARTIAL') {
                          <button (click)="openReceiveModal(po)" class="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition">
                            Record Receipt (DN)
                          </button>
                        }
                        <button (click)="deletePO(po)" class="p-1 hover:bg-red-50 text-red-500/60 hover:text-red-500 rounded-lg transition" [disabled]="po.status === 'RECEIVED'">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="p-8 text-center text-ortho-navy/40">No purchase orders found.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      } @else if (activeTab() === 'deliveries') {
        
        <!-- Delivery Receipts History Tab -->
        <div class="bg-white rounded-2xl border border-ortho-navy/5 shadow-sm overflow-hidden">
          
          <div class="p-4 border-b border-ortho-navy/5 bg-ortho-navy/[0.01] flex items-center justify-between">
            <h3 class="text-base font-bold text-ortho-navy">Delivery Receipts Journal</h3>
            <span class="text-xs text-ortho-navy/40 font-medium">History of all verified supplier delivery notes.</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="bg-ortho-navy/[0.02] text-ortho-navy/60 font-semibold border-b border-ortho-navy/5">
                  <th class="p-4">DN Number</th>
                  <th class="p-4">PO Ref</th>
                  <th class="p-4">Supplier</th>
                  <th class="p-4">Receipt Date</th>
                  <th class="p-4 text-center">Receipt Status</th>
                  <th class="p-4">Verified By</th>
                  <th class="p-4">Received Items</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-ortho-navy/5">
                @for (dn of deliveryNotes(); track dn.id) {
                  <tr class="hover:bg-ortho-navy/[0.01] transition">
                    <td class="p-4 font-mono text-xs font-bold text-ortho-navy">{{ dn.dnNumber }}</td>
                    <td class="p-4 font-mono text-xs font-semibold text-ortho-navy/60">{{ dn.purchaseOrder?.poNumber }}</td>
                    <td class="p-4 font-semibold text-ortho-navy/80">{{ dn.supplier?.name }}</td>
                    <td class="p-4 text-ortho-navy/60 font-medium">{{ dn.receivedDate | date:'yyyy-MM-dd' }}</td>
                    <td class="p-4 text-center">
                      <span class="px-2.5 py-1 text-xs font-bold rounded-full border uppercase bg-emerald-50 text-emerald-600 border-emerald-200">
                        {{ dn.status }}
                      </span>
                    </td>
                    <td class="p-4 text-ortho-navy/60 font-semibold">Clinician Staff</td>
                    <td class="p-4">
                      <div class="flex flex-col gap-1">
                        @for (line of dn.lines; track line.id) {
                          <div class="text-[11px] text-ortho-navy/70">
                            • {{ line.stockItem?.name }}: <span class="font-bold text-emerald-600">{{ line.quantityReceived }}</span> units @if (line.batchNumber) { <span class="text-ortho-navy/40">(Batch: {{ line.batchNumber }})</span> }
                          </div>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="p-8 text-center text-ortho-navy/40">No delivery note receipts recorded.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      } @else if (activeTab() === 'invoices') {

        <!-- Vendor Invoice Registry & GRNI clearing (BR03) -->
        <div class="space-y-6 animate-fade-in">
          
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Register Invoice Form Panel -->
            <div class="bg-white p-6 rounded-2xl border border-ortho-navy/5 shadow-sm space-y-4">
              <div>
                <h3 class="text-base font-bold text-ortho-navy">Register Supplier Invoice</h3>
                <p class="text-xs text-ortho-navy/40">Register physical supplier invoice to clear out GRNI (Goods Received Not Invoiced) balances.</p>
              </div>

              <!-- Select GRNI -->
              <div class="space-y-1">
                <label class="block text-[10px] font-bold text-ortho-navy/60 uppercase">Select Open Goods Receipt (GRNI) *</label>
                <select [(ngModel)]="selectedGrniId" (change)="onGrniSelectChange()" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-xs focus:outline-none focus:border-ortho-navy bg-white">
                  <option [value]="null">Select a pending receipt...</option>
                  @for (grni of openGrnis(); track grni.id) {
                    <option [value]="grni.id">
                      {{ grni.dnNumber }} (PO: {{ grni.purchaseOrder?.poNumber }} - {{ grni.supplier?.name }})
                    </option>
                  }
                </select>
              </div>

              <!-- Invoice Number & Date -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="block text-[10px] font-bold text-ortho-navy/60 uppercase">Invoice Number *</label>
                  <input type="text" [(ngModel)]="vendorInvoiceNumber" placeholder="INV-2026-XXXX" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-xs bg-white focus:outline-none focus:border-ortho-navy" />
                </div>
                <div class="space-y-1">
                  <label class="block text-[10px] font-bold text-ortho-navy/60 uppercase">Invoice Date *</label>
                  <input type="date" [(ngModel)]="vendorInvoiceDate" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-xs bg-white focus:outline-none focus:border-ortho-navy" />
                </div>
              </div>

              <!-- Invoice Amount & Payment Terms -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="block text-[10px] font-bold text-ortho-navy/60 uppercase">Invoice Amount *</label>
                  <input type="number" [(ngModel)]="vendorInvoiceAmount" min="0.01" step="any" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-xs bg-white focus:outline-none focus:border-ortho-navy font-mono" />
                </div>
                <div class="space-y-1">
                  <label class="block text-[10px] font-bold text-ortho-navy/60 uppercase">Payment Terms</label>
                  <select [(ngModel)]="vendorInvoicePaymentTerms" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-xs focus:outline-none focus:border-ortho-navy bg-white">
                    <option value="IMMEDIATE">Immediate Cash</option>
                    <option value="15_DAYS">15 Days Net</option>
                    <option value="30_DAYS">30 Days Net</option>
                    <option value="60_DAYS">60 Days Net</option>
                  </select>
                </div>
              </div>

              <!-- Invoice Memo -->
              <div class="space-y-1">
                <label class="block text-[10px] font-bold text-ortho-navy/60 uppercase">Notes / Remarks</label>
                <textarea [(ngModel)]="vendorInvoiceNotes" placeholder="e.g. Clears GRNI, posted to Supplier Liability..." rows="2" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-xs bg-white focus:outline-none focus:border-ortho-navy"></textarea>
              </div>

              <button (click)="registerVendorInvoice()" class="w-full py-2.5 bg-ortho-navy text-white hover:bg-ortho-navy/90 font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                Post Invoice & Clear GRNI
              </button>
            </div>

            <!-- Receipt Details Summary Panel -->
            <div class="lg:col-span-2 bg-white rounded-2xl border border-ortho-navy/5 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
              <div class="p-4 border-b border-ortho-navy/5 bg-ortho-navy/[0.01]">
                <h3 class="text-base font-bold text-ortho-navy">Selected Receipt Breakdown</h3>
                <p class="text-xs text-ortho-navy/40">Itemized lines of products received that will be cleared by the invoice.</p>
              </div>

              @if (selectedGrni) {
                <div class="p-4 space-y-4 flex-1">
                  <!-- Vendor / PO Summary -->
                  <div class="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-xl border border-ortho-navy/5 text-xs">
                    <div>
                      <span class="text-ortho-navy/40 block font-semibold uppercase text-[10px]">Supplier Vendor</span>
                      <span class="font-bold text-ortho-navy">{{ selectedGrni.supplier?.name }}</span>
                    </div>
                    <div>
                      <span class="text-ortho-navy/40 block font-semibold uppercase text-[10px]">PO Reference</span>
                      <span class="font-bold text-ortho-navy">{{ selectedGrni.purchaseOrder?.poNumber }}</span>
                    </div>
                    <div>
                      <span class="text-ortho-navy/40 block font-semibold uppercase text-[10px]">Date Goods Received</span>
                      <span class="font-bold text-ortho-navy">{{ selectedGrni.receivedDate | date:'yyyy-MM-dd' }}</span>
                    </div>
                  </div>

                  <!-- Lines Table -->
                  <div class="overflow-x-auto border border-ortho-navy/5 rounded-xl">
                    <table class="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr class="bg-ortho-navy/[0.01] text-ortho-navy/60 font-bold border-b border-ortho-navy/5">
                          <th class="p-3">SKU</th>
                          <th class="p-3">Product Name</th>
                          <th class="p-3 text-center">Qty Received</th>
                          <th class="p-3 text-right">PO Unit Price</th>
                          <th class="p-3 text-right">Expected Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (line of selectedGrni.lines; track line.id) {
                          <tr class="font-semibold border-b border-ortho-navy/5 text-ortho-navy/80">
                            <td class="p-3 font-mono text-[10px] text-ortho-navy/60">{{ line.stockItem?.sku }}</td>
                            <td class="p-3 font-bold">{{ line.stockItem?.name }}</td>
                            <td class="p-3 text-center font-mono">{{ line.quantityReceived }}</td>
                            <td class="p-3 text-right font-mono">{{ (line.poLine?.unitPrice || 0) | number:'1.2-2' }} DH</td>
                            <td class="p-3 text-right font-mono font-bold text-ortho-navy">
                              {{ ((line.quantityReceived || 0) * (line.poLine?.unitPrice || 0)) | number:'1.2-2' }} DH
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              @} @else {
                <div class="flex-1 flex flex-col items-center justify-center text-center p-8 text-ortho-navy/40">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-2 text-ortho-navy/30"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
                  <span>Select a pending Goods Receipt note (GRNI) on the left panel to populate lines and preview matching details.</span>
                </div>
              @}
            </div>

          </div>

          <!-- Posted Invoices Ledger -->
          <div class="bg-white rounded-2xl border border-ortho-navy/5 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-ortho-navy/5 bg-ortho-navy/[0.01]">
              <h3 class="text-base font-bold text-ortho-navy">Posted Supplier Invoices Journal</h3>
              <p class="text-xs text-ortho-navy/40">Double-entry accounting clearing journal: records cleared GRNIs and posted liabilities.</p>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="bg-ortho-navy/[0.02] text-ortho-navy/60 font-semibold border-b border-ortho-navy/5">
                    <th class="p-4">Invoice Number</th>
                    <th class="p-4">Vendor</th>
                    <th class="p-4">Invoice Date</th>
                    <th class="p-4">Terms</th>
                    <th class="p-4 text-right">Invoice Amount</th>
                    <th class="p-4 text-center">Accounting Status</th>
                    <th class="p-4">Receipt Cleared</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-ortho-navy/5">
                  @for (inv of vendorInvoices(); track inv.id) {
                    <tr class="hover:bg-ortho-navy/[0.01] transition font-semibold text-xs text-ortho-navy/80">
                      <td class="p-4 font-mono font-bold text-ortho-navy">{{ inv.invoiceNumber }}</td>
                      <td class="p-4 font-bold">{{ inv.supplierName }}</td>
                      <td class="p-4 text-ortho-navy/60">{{ inv.invoiceDate | date:'yyyy-MM-dd' }}</td>
                      <td class="p-4"><span class="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px]">{{ inv.paymentTerms }}</span></td>
                      <td class="p-4 text-right font-mono text-emerald-600 font-bold">{{ inv.invoiceAmount | number:'1.2-2' }} DH</td>
                      <td class="p-4 text-center">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                          POSTED & CLEARED
                        </span>
                      </td>
                      <td class="p-4 font-mono text-xs text-ortho-navy/50">{{ inv.dnNumber }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="p-8 text-center text-ortho-navy/40">No posted supplier invoices recorded.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        </div>

      }

      <!-- Create PO Modal -->
      @if (showPOCreationModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ortho-navy/60 backdrop-blur-sm">
          <div class="bg-white rounded-2xl max-w-2xl w-full overflow-hidden border border-ortho-navy/5 shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
            <div class="px-6 py-4 border-b border-ortho-navy/5 flex items-center justify-between bg-ortho-navy/[0.01] shrink-0">
              <h3 class="text-lg font-bold text-ortho-navy">Create Purchase Order</h3>
              <button (click)="closeCreatePOModal()" class="p-1 text-ortho-navy/40 hover:text-ortho-navy hover:bg-ortho-navy/5 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
              <!-- Select Supplier -->
              <div>
                <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Select Supplier *</label>
                <select [(ngModel)]="newPOSupplierId" (change)="onSupplierChange()" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white">
                  <option [value]="null">Select a supplier...</option>
                  @for (sup of suppliers(); track sup.id) {
                    <option [value]="sup.id">{{ sup.name }}</option>
                  }
                </select>
              </div>

              <!-- Lines Editor -->
              @if (newPOSupplierId) {
                <div class="space-y-3">
                  <div class="flex items-center justify-between border-b border-ortho-navy/5 pb-2">
                    <span class="text-xs font-bold text-ortho-navy/60 uppercase tracking-wide">Order Lines</span>
                    <button type="button" (click)="addPOLine()" class="px-2.5 py-1 text-xs font-semibold bg-ortho-navy text-white hover:bg-ortho-navy/90 transition rounded-lg">
                      + Add Item
                    </button>
                  </div>

                  <div class="space-y-3">
                    @for (line of newPOLines; track $index; let idx = $index) {
                      <div class="grid grid-cols-12 gap-3 items-end bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <div class="col-span-5">
                          <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Stock Item</label>
                          <select [(ngModel)]="line.stockItem" (change)="onPOItemChange(idx)" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white focus:outline-none">
                            <option [value]="null">Select item...</option>
                            @for (item of catalogItems(); track item.id) {
                              <option [ngValue]="item">{{ item.name }} (SKU: {{ item.sku }})</option>
                            }
                          </select>
                        </div>
                        <div class="col-span-2">
                          <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Quantity</label>
                          <input type="number" [(ngModel)]="line.quantityOrdered" (change)="calculatePOTotal()" min="1" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white text-center focus:outline-none" />
                        </div>
                        <div class="col-span-2">
                          <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Unit Cost (DH)</label>
                          <input type="number" [(ngModel)]="line.unitPrice" (change)="calculatePOTotal()" min="0" step="0.01" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white text-right focus:outline-none" />
                        </div>
                        <div class="col-span-2 text-right">
                          <span class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Total (DH)</span>
                          <span class="font-bold text-xs text-ortho-navy block py-1.5">{{ (line.quantityOrdered * line.unitPrice) | number:'1.2-2' }}</span>
                        </div>
                        <div class="col-span-1 text-center">
                          <button type="button" (click)="removePOLine(idx)" class="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                      </div>
                    }
                  </div>

                  <div class="flex justify-end pt-3 border-t border-ortho-navy/5">
                    <div class="text-right">
                      <span class="text-xs font-bold text-ortho-navy/40 uppercase tracking-wider block">Estimated Total</span>
                      <span class="text-xl font-bold text-ortho-navy">{{ newPOTotal | number:'1.2-2' }} DH</span>
                    </div>
                  </div>
                </div>
              }
            </div>

            <div class="px-6 py-4 border-t border-ortho-navy/5 flex items-center justify-end gap-3 bg-ortho-navy/[0.01] shrink-0">
              <button type="button" (click)="closeCreatePOModal()" class="px-4 py-2 border border-ortho-navy/10 rounded-xl text-sm font-semibold hover:bg-gray-50 transition text-ortho-navy/70">Cancel</button>
              <button type="button" (click)="savePO()" [disabled]="!newPOSupplierId || newPOLines.length === 0" class="px-5 py-2 bg-ortho-navy text-white rounded-xl text-sm font-semibold hover:bg-ortho-navy/90 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Save Draft PO</button>
            </div>
          </div>
        </div>
      }

      <!-- Record Delivery Note Modal -->
      @if (showReceiveModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ortho-navy/60 backdrop-blur-sm">
          <div class="bg-white rounded-2xl max-w-3xl w-full overflow-hidden border border-ortho-navy/5 shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
            <div class="px-6 py-4 border-b border-ortho-navy/5 flex items-center justify-between bg-ortho-navy/[0.01] shrink-0">
              <div>
                <h3 class="text-lg font-bold text-ortho-navy">Record Delivery Note (DN)</h3>
                <p class="text-xs text-ortho-navy/60">Verifying order receipt for PO: <span class="font-bold text-ortho-navy font-mono">{{ activePO()?.poNumber }}</span></p>
              </div>
              <button (click)="closeReceiveModal()" class="p-1 text-ortho-navy/40 hover:text-ortho-navy hover:bg-ortho-navy/5 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Supplier Delivery Note Number *</label>
                  <input type="text" [(ngModel)]="dnNumber" placeholder="e.g. BL-99382" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white font-mono uppercase" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Receiving Agent / Clinician *</label>
                  <input type="text" [(ngModel)]="receivedByClinician" placeholder="e.g. Dr. Amine" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" />
                </div>
              </div>

              <!-- Lines checklist -->
              <div class="space-y-3">
                <span class="text-xs font-bold text-ortho-navy/60 uppercase tracking-wide block border-b border-ortho-navy/5 pb-2">Receive Items Verification</span>
                
                <div class="space-y-3">
                  @for (line of dnLines; track $index; let idx = $index) {
                    <div class="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3">
                      <div class="flex justify-between items-start">
                        <div>
                          <span class="font-bold text-ortho-navy block text-sm">{{ line.stockItem?.name }}</span>
                          <span class="text-xs text-ortho-navy/40 block font-mono">SKU: {{ line.stockItem?.sku }}</span>
                        </div>
                        <div class="text-right">
                          <span class="text-[10px] text-ortho-navy/40 font-bold uppercase block">Ordered Qty</span>
                          <span class="font-bold text-sm text-ortho-navy">{{ line.poLine.quantityOrdered }} units</span>
                        </div>
                      </div>

                      <div class="grid grid-cols-4 gap-3 items-end">
                        <div>
                          <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Prev. Received</label>
                          <span class="font-semibold text-xs text-ortho-navy/80 block py-1.5 px-3 bg-gray-100 rounded-lg text-center font-mono">{{ line.poLine.quantityReceived || 0 }}</span>
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Received Now *</label>
                          <input type="number" [(ngModel)]="line.quantityReceived" min="0" class="w-full px-3 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white text-center font-bold focus:outline-none" />
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Batch Number</label>
                          <input type="text" [(ngModel)]="line.batchNumber" placeholder="e.g. B-883" class="w-full px-3 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white focus:outline-none font-mono uppercase" />
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Expiry Date</label>
                          <input type="date" [(ngModel)]="line.expiryDate" class="w-full px-3 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Notes / Discrepancy Remarks</label>
                <textarea [(ngModel)]="dnNotes" rows="2" placeholder="Describe any discrepancies in quantity or damages..." class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white placeholder-ortho-navy/30"></textarea>
              </div>
            </div>

            <div class="px-6 py-4 border-t border-ortho-navy/5 flex items-center justify-end gap-3 bg-ortho-navy/[0.01] shrink-0">
              <button type="button" (click)="closeReceiveModal()" class="px-4 py-2 border border-ortho-navy/10 rounded-xl text-sm font-semibold hover:bg-gray-50 transition text-ortho-navy/70">Cancel</button>
              <button type="button" (click)="confirmReceipt()" [disabled]="!dnNumber || !receivedByClinician" class="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Confirm Receipt & Add to Stock</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.25s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class PurchaseOrdersComponent implements OnInit {
  private stockService = inject(StockService);

  readonly activeTab = signal<'orders' | 'deliveries' | 'invoices'>('orders');

  // Directory Signals
  readonly purchaseOrders = signal<PurchaseOrder[]>([]);
  readonly deliveryNotes = signal<DeliveryNote[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly catalogItems = signal<StockItem[]>([]);
  readonly openGrnis = signal<DeliveryNote[]>([]);
  readonly vendorInvoices = signal<any[]>([]);

  // Vendor Invoice state variables (BR03)
  selectedGrniId: string | null = null;
  selectedGrni: DeliveryNote | null = null;
  vendorInvoiceNumber = '';
  vendorInvoiceDate = '';
  vendorInvoiceAmount = 0;
  vendorInvoiceNotes = '';
  vendorInvoicePaymentTerms = '30_DAYS';

  // PO Creation controls
  readonly showPOCreationModal = signal(false);
  newPOSupplierId: string | null = null;
  newPOLines: PurchaseOrderLine[] = [];
  newPOTotal = 0;

  // Receive DN modal controls
  readonly showReceiveModal = signal(false);
  readonly activePO = signal<PurchaseOrder | null>(null);
  dnNumber = '';
  receivedByClinician = '';
  dnLines: DeliveryNoteLine[] = [];
  dnNotes = '';

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.stockService.getPurchaseOrders().subscribe(data => {
      this.purchaseOrders.set(data.sort((a, b) => new Date(b.orderDate!).getTime() - new Date(a.orderDate!).getTime()));
    });
    this.stockService.getDeliveryNotes().subscribe(data => {
      this.deliveryNotes.set(data.sort((a, b) => new Date(b.receivedDate!).getTime() - new Date(a.receivedDate!).getTime()));
    });
    this.stockService.getSuppliers().subscribe(data => this.suppliers.set(data));
    this.stockService.getStockItems().subscribe(data => this.catalogItems.set(data));
    this.loadInvoiceData();
  }

  loadInvoiceData() {
    this.stockService.getOpenGrni().subscribe(data => {
      this.openGrnis.set(data);
    });
    this.stockService.getVendorInvoices().subscribe(data => {
      this.vendorInvoices.set(data.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()));
    });
  }

  onGrniSelectChange() {
    if (!this.selectedGrniId || this.selectedGrniId === 'null') {
      this.selectedGrni = null;
      this.vendorInvoiceAmount = 0;
      return;
    }

    const found = this.openGrnis().find(g => g.id === this.selectedGrniId);
    if (found) {
      this.selectedGrni = found;
      let total = 0;
      if (found.lines) {
        found.lines.forEach((line: any) => {
          const price = line.poLine?.unitPrice || 0;
          total += (line.quantityReceived || 0) * price;
        });
      }
      this.vendorInvoiceAmount = total;
    }
  }

  registerVendorInvoice() {
    if (!this.selectedGrniId || !this.vendorInvoiceNumber || !this.vendorInvoiceDate || this.vendorInvoiceAmount <= 0) {
      alert('Please fill in all mandatory fields: GRNI receipt, invoice number, date, and valid invoice amount.');
      return;
    }

    let expected = 0;
    if (this.selectedGrni && this.selectedGrni.lines) {
      this.selectedGrni.lines.forEach((line: any) => {
        const price = line.poLine?.unitPrice || 0;
        expected += (line.quantityReceived || 0) * price;
      });
    }

    if (Math.abs(this.vendorInvoiceAmount - expected) > 0.01) {
      if (!confirm(`Warning: The invoice amount (${this.vendorInvoiceAmount} DH) does not match the received goods value (${expected} DH). Are you sure you want to proceed?`)) {
        return;
      }
    }

    const payload = {
      deliveryNoteId: this.selectedGrniId,
      invoiceNumber: this.vendorInvoiceNumber,
      invoiceDate: this.vendorInvoiceDate,
      invoiceAmount: this.vendorInvoiceAmount,
      paymentTerms: this.vendorInvoicePaymentTerms,
      notes: this.vendorInvoiceNotes
    };

    this.stockService.createVendorInvoice(payload).subscribe(() => {
      alert('Vendor Invoice successfully registered and posted! GRNI cleared, Vendor Liability created.');
      this.selectedGrniId = null;
      this.selectedGrni = null;
      this.vendorInvoiceNumber = '';
      this.vendorInvoiceDate = '';
      this.vendorInvoiceAmount = 0;
      this.vendorInvoiceNotes = '';
      this.vendorInvoicePaymentTerms = '30_DAYS';
      this.loadAllData();
    });
  }

  // --- Purchase Order Operations ---

  openCreatePOModal() {
    this.newPOSupplierId = null;
    this.newPOLines = [];
    this.newPOTotal = 0;
    this.showPOCreationModal.set(true);
  }

  closeCreatePOModal() {
    this.showPOCreationModal.set(false);
  }

  onSupplierChange() {
    this.newPOLines = [];
    this.newPOTotal = 0;
    this.addPOLine();
  }

  addPOLine() {
    this.newPOLines.push({
      stockItem: null as any,
      quantityOrdered: 10,
      unitPrice: 0,
      totalPrice: 0
    });
    this.calculatePOTotal();
  }

  removePOLine(idx: number) {
    this.newPOLines.splice(idx, 1);
    this.calculatePOTotal();
  }

  onPOItemChange(idx: number) {
    const line = this.newPOLines[idx];
    if (line.stockItem) {
      line.unitPrice = line.stockItem.purchasePrice;
    }
    this.calculatePOTotal();
  }

  calculatePOTotal() {
    this.newPOTotal = this.newPOLines.reduce((acc, curr) => acc + (curr.quantityOrdered * curr.unitPrice), 0);
  }

  savePO() {
    const selectedSup = this.suppliers().find(s => s.id === this.newPOSupplierId);
    if (!selectedSup || this.newPOLines.length === 0) {
      return;
    }

    const order: Partial<PurchaseOrder> = {
      supplier: selectedSup,
      lines: this.newPOLines.map(line => ({
        stockItem: { id: line.stockItem.id } as StockItem,
        quantityOrdered: line.quantityOrdered,
        unitPrice: line.unitPrice
      }))
    };

    this.stockService.createPurchaseOrder(order).subscribe(() => {
      this.loadAllData();
      this.closeCreatePOModal();
    });
  }

  markAsSent(po: PurchaseOrder) {
    this.stockService.updatePOStatus(po.id!, 'SENT').subscribe(() => {
      this.loadAllData();
    });
  }

  deletePO(po: PurchaseOrder) {
    if (confirm(`Are you sure you want to delete purchase order '${po.poNumber}'?`)) {
      this.stockService.deletePurchaseOrder(po.id!).subscribe(() => {
        this.loadAllData();
      });
    }
  }

  // --- Delivery Receipt Operations ---

  openReceiveModal(po: PurchaseOrder) {
    this.activePO.set(po);
    this.dnNumber = '';
    this.receivedByClinician = '';
    this.dnNotes = '';

    // Create delivery lines pre-filled with items from PO that are not fully received
    this.dnLines = po.lines
      .filter(line => {
        const received = line.quantityReceived || 0;
        return received < line.quantityOrdered;
      })
      .map(line => {
        const expected = line.quantityOrdered - (line.quantityReceived || 0);
        return {
          poLine: line,
          stockItem: line.stockItem,
          quantityExpected: expected,
          quantityReceived: expected, // Default to receiving everything remaining
          batchNumber: '',
          expiryDate: ''
        };
      });

    if (this.dnLines.length === 0) {
      alert("All items on this purchase order have already been completely received.");
      return;
    }

    this.showReceiveModal.set(true);
  }

  closeReceiveModal() {
    this.showReceiveModal.set(false);
  }

  confirmReceipt() {
    const po = this.activePO();
    if (!po || !this.dnNumber || !this.receivedByClinician || this.dnLines.length === 0) {
      return;
    }

    const note: Partial<DeliveryNote> = {
      purchaseOrder: { id: po.id } as PurchaseOrder,
      dnNumber: this.dnNumber,
      notes: this.dnNotes,
      lines: this.dnLines.map(line => ({
        poLine: { id: line.poLine.id } as PurchaseOrderLine,
        stockItem: { id: line.stockItem.id } as StockItem,
        quantityExpected: line.quantityExpected,
        quantityReceived: line.quantityReceived,
        batchNumber: line.batchNumber,
        expiryDate: line.expiryDate
      }))
    };

    // Register and confirm delivery note
    this.stockService.createDeliveryNote(note).subscribe(savedNote => {
      this.stockService.receiveDeliveryNote(savedNote.id!, this.receivedByClinician, this.dnNotes).subscribe(() => {
        this.loadAllData();
        this.closeReceiveModal();
      });
    });
  }

  // --- Helpers ---

  getPOStatusClasses(status: POStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      case 'SENT':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'PARTIAL':
        return 'bg-amber-50 text-amber-500 border-amber-200';
      case 'RECEIVED':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-500 border-red-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  }
}
