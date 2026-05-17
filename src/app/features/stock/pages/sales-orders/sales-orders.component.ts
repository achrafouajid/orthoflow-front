import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { StockService } from '../../../../core/services/stock.service';
import { PatientApiService } from '../../../../core/services/patient-api.service';
import { SalesOrder, SalesOrderLine, StockItem, SOStatus } from '../../../../core/models/stock.model';
import { Patient } from '../../../../core/models/patient.model';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sales-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      
      <!-- Top Title Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-ortho-navy">Direct Patient Sales</h1>
          <p class="text-sm text-ortho-navy/60">Log direct clinic merchandise sales (toothbrush, aligner chewies) and deduct stock instantly.</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="openCreateSOModal()" class="flex items-center gap-2 px-4 py-2.5 bg-ortho-navy text-white font-medium rounded-xl hover:bg-ortho-navy/90 transition shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Record Direct Sale
          </button>
        </div>
      </div>

      <!-- Module Navigation Pills -->
      <div class="flex flex-wrap gap-2 bg-ortho-navy/[0.03] p-1.5 rounded-xl border border-ortho-navy/5 max-w-max font-semibold text-xs">
        <a routerLink="/stock" class="px-4 py-2 rounded-lg transition text-ortho-navy/60 hover:text-ortho-navy hover:bg-white/50">
          Stock Catalog
        </a>
        <a routerLink="/stock/procurement" class="px-4 py-2 rounded-lg transition text-ortho-navy/60 hover:text-ortho-navy hover:bg-white/50">
          Procurement & Receipts (PO/DN)
        </a>
        <a routerLink="/stock/direct-sales" class="px-4 py-2 rounded-lg transition bg-white text-ortho-navy shadow-sm">
          Patient OTC Sales (SO)
        </a>
        <a routerLink="/stock/treatment-sessions" class="px-4 py-2 rounded-lg transition text-ortho-navy/60 hover:text-ortho-navy hover:bg-white/50">
          Treatment Sessions Logger
        </a>
      </div>


      <!-- Sales Orders Registry -->
      <div class="bg-white rounded-2xl border border-ortho-navy/5 shadow-sm overflow-hidden">
        
        <div class="p-4 border-b border-ortho-navy/5 bg-ortho-navy/[0.01] flex items-center justify-between">
          <h3 class="text-base font-bold text-ortho-navy">Sales Orders History</h3>
          <span class="text-xs text-ortho-navy/40 font-medium">Record of patient over-the-counter purchases.</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-ortho-navy/[0.02] text-ortho-navy/60 font-semibold border-b border-ortho-navy/5">
                <th class="p-4">SO Number</th>
                <th class="p-4">Patient Name</th>
                <th class="p-4">Purchase Date</th>
                <th class="p-4 text-center">Status</th>
                <th class="p-4">Sold Items</th>
                <th class="p-4 text-right">Total Amount</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ortho-navy/5">
              @for (so of salesOrders(); track so.id) {
                <tr class="hover:bg-ortho-navy/[0.01] transition">
                  <td class="p-4 font-mono text-xs font-bold text-ortho-navy">{{ so.soNumber }}</td>
                  <td class="p-4">
                    <div class="font-bold text-ortho-navy">{{ so.patient?.firstName }} {{ so.patient?.lastName }}</div>
                    <div class="text-[10px] text-ortho-navy/40">Email: {{ so.patient?.email }}</div>
                  </td>
                  <td class="p-4 text-ortho-navy/60 font-medium">{{ so.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
                  <td class="p-4 text-center">
                    <span class="px-2.5 py-1 text-xs font-bold rounded-full border uppercase" [ngClass]="getSOStatusClasses(so.status!)">
                      {{ so.status }}
                    </span>
                  </td>
                  <td class="p-4">
                    <div class="flex flex-col gap-1">
                      @for (line of so.lines; track line.id) {
                        <div class="text-[11px] text-ortho-navy/70">
                          • {{ line.stockItem?.name }}: <span class="font-bold text-ortho-navy">{{ line.quantity }}</span> units
                        </div>
                      }
                    </div>
                  </td>
                  <td class="p-4 text-right font-bold text-emerald-600">{{ so.totalAmount | number:'1.2-2' }} DH</td>
                  <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      @if (so.status === 'DRAFT') {
                        <button (click)="confirmSale(so)" class="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition">
                          Confirm Sale
                        </button>
                        <button (click)="cancelSale(so)" class="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 rounded-lg border border-red-200 transition">
                          Cancel
                        </button>
                      }
                      <button (click)="deleteSale(so)" class="p-1 hover:bg-red-50 text-red-500/60 hover:text-red-500 rounded-lg transition" [disabled]="so.status === 'CONFIRMED'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="p-8 text-center text-ortho-navy/40">No direct patient purchases found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create Sales Order Modal -->
      @if (showSOCreationModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ortho-navy/60 backdrop-blur-sm">
          <div class="bg-white rounded-2xl max-w-2xl w-full overflow-hidden border border-ortho-navy/5 shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
            <div class="px-6 py-4 border-b border-ortho-navy/5 flex items-center justify-between bg-ortho-navy/[0.01] shrink-0">
              <h3 class="text-lg font-bold text-ortho-navy">Record Direct Sale</h3>
              <button (click)="closeCreateSOModal()" class="p-1 text-ortho-navy/40 hover:text-ortho-navy hover:bg-ortho-navy/5 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
              <!-- Select Patient -->
              <div>
                <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Select Patient *</label>
                <select [(ngModel)]="selectedPatientId" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white">
                  <option [value]="null">Select a patient...</option>
                  @for (p of patients(); track p.id) {
                    <option [value]="p.id">{{ p.lastName }} {{ p.firstName }} (CIN: {{ p.cin || 'N/A' }})</option>
                  }
                </select>
              </div>

              <!-- Lines Editor -->
              @if (selectedPatientId) {
                <div class="space-y-3">
                  <div class="flex items-center justify-between border-b border-ortho-navy/5 pb-2">
                    <span class="text-xs font-bold text-ortho-navy/60 uppercase tracking-wide">Sales Lines</span>
                    <button type="button" (click)="addSOLine()" class="px-2.5 py-1 text-xs font-semibold bg-ortho-navy text-white hover:bg-ortho-navy/90 transition rounded-lg">
                      + Add Item
                    </button>
                  </div>

                  <div class="space-y-3">
                    @for (line of lines; track $index; let idx = $index) {
                      <div class="grid grid-cols-12 gap-3 items-end bg-gray-50/50 p-3 rounded-xl border border-gray-100 font-medium">
                        <div class="col-span-5">
                          <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Catalog Item</label>
                          <select [(ngModel)]="line.stockItem" (change)="onItemChange(idx)" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white focus:outline-none">
                            <option [value]="null">Select item...</option>
                            @for (item of catalogItems(); track item.id) {
                              <option [ngValue]="item">{{ item.name }} (SKU: {{ item.sku }}) - Stock: {{ item.currentStock }}</option>
                            }
                          </select>
                        </div>
                        <div class="col-span-2">
                          <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Quantity</label>
                          <input type="number" [(ngModel)]="line.quantity" (change)="calculateSOTotal()" min="1" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white text-center focus:outline-none" />
                        </div>
                        <div class="col-span-2">
                          <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Unit Price (DH)</label>
                          <input type="number" [(ngModel)]="line.unitPrice" (change)="calculateSOTotal()" min="0" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white text-right focus:outline-none" />
                        </div>
                        <div class="col-span-2 text-right">
                          <span class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Total (DH)</span>
                          <span class="font-bold text-xs text-ortho-navy block py-1.5">{{ (line.quantity * line.unitPrice) | number:'1.2-2' }}</span>
                        </div>
                        <div class="col-span-1 text-center">
                          <button type="button" (click)="removeSOLine(idx)" class="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                      </div>
                    }
                  </div>

                  <div class="flex justify-end pt-3 border-t border-ortho-navy/5">
                    <div class="text-right">
                      <span class="text-xs font-bold text-ortho-navy/40 uppercase tracking-wider block">Grand Total</span>
                      <span class="text-xl font-bold text-emerald-600">{{ total | number:'1.2-2' }} DH</span>
                    </div>
                  </div>
                </div>
              }
            </div>

            <div class="px-6 py-4 border-t border-ortho-navy/5 flex items-center justify-end gap-3 bg-ortho-navy/[0.01] shrink-0">
              <button type="button" (click)="closeCreateSOModal()" class="px-4 py-2 border border-ortho-navy/10 rounded-xl text-sm font-semibold hover:bg-gray-50 transition text-ortho-navy/70">Cancel</button>
              <button type="button" (click)="saveSO()" [disabled]="!selectedPatientId || lines.length === 0" class="px-5 py-2 bg-ortho-navy text-white rounded-xl text-sm font-semibold hover:bg-ortho-navy/90 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Save Sale Draft</button>
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
export class SalesOrdersComponent implements OnInit {
  private stockService = inject(StockService);
  private patientService = inject(PatientApiService);

  readonly salesOrders = signal<SalesOrder[]>([]);
  readonly patients = signal<Patient[]>([]);
  readonly catalogItems = signal<StockItem[]>([]);

  // Create Modal control
  readonly showSOCreationModal = signal(false);
  selectedPatientId: string | null = null;
  lines: SalesOrderLine[] = [];
  total = 0;

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.stockService.getSalesOrders().subscribe(data => {
      this.salesOrders.set(data.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
    });
    this.patientService.getPatients().subscribe(data => this.patients.set(data));
    this.stockService.getStockItems().subscribe(data => this.catalogItems.set(data));
  }

  openCreateSOModal() {
    this.selectedPatientId = null;
    this.lines = [];
    this.total = 0;
    this.showSOCreationModal.set(true);
  }

  closeCreateSOModal() {
    this.showSOCreationModal.set(false);
  }

  addSOLine() {
    this.lines.push({
      stockItem: null as any,
      quantity: 1,
      unitPrice: 0
    });
    this.calculateSOTotal();
  }

  removeSOLine(idx: number) {
    this.lines.splice(idx, 1);
    this.calculateSOTotal();
  }

  onItemChange(idx: number) {
    const line = this.lines[idx];
    if (line.stockItem) {
      line.unitPrice = line.stockItem.purchasePrice * 1.5; // Retail price markup
    }
    this.calculateSOTotal();
  }

  calculateSOTotal() {
    this.total = this.lines.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
  }

  saveSO() {
    const pat = this.patients().find(p => p.id === this.selectedPatientId);
    if (!pat || this.lines.length === 0) {
      return;
    }

    const order: Partial<SalesOrder> = {
      patient: pat,
      lines: this.lines.map(line => ({
        stockItem: { id: line.stockItem.id } as StockItem,
        quantity: line.quantity,
        unitPrice: line.unitPrice
      }))
    };

    this.stockService.createSalesOrder(order).subscribe(() => {
      this.loadAllData();
      this.closeCreateSOModal();
    });
  }

  confirmSale(so: SalesOrder) {
    // We confirm direct patient sale using dummy confirmedBy UUID
    this.stockService.confirmSalesOrder(so.id!, '00000000-0000-0000-0000-000000000000').subscribe(() => {
      this.loadAllData();
    });
  }

  cancelSale(so: SalesOrder) {
    this.stockService.cancelSalesOrder(so.id!, '00000000-0000-0000-0000-000000000000').subscribe(() => {
      this.loadAllData();
    });
  }

  deleteSale(so: SalesOrder) {
    if (confirm(`Are you sure you want to delete this sales order draft?`)) {
      this.stockService.deleteSalesOrder(so.id!).subscribe(() => {
        this.loadAllData();
      });
    }
  }

  getSOStatusClasses(status: SOStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'INVOICED':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-500 border-red-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  }
}
