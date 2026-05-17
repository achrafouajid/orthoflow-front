import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { StockService } from '../../../../core/services/stock.service';
import { PatientApiService } from '../../../../core/services/patient-api.service';
import { 
  TreatmentInvoice, 
  Treatment, 
  TreatmentInvoiceConsumable, 
  StockItem, 
  TreatmentInvoiceStatus,
  InvoiceDiscount,
  DiscountType,
  DiscountTarget
} from '../../../../core/models/stock.model';
import { Patient } from '../../../../core/models/patient.model';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-treatment-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      
      <!-- Top Title Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-ortho-navy">Treatment Sessions & Billing</h1>
          <p class="text-sm text-ortho-navy/60">Log clinical treatment sessions, adjust pre-mapped consumable usage, and generate stock-deducting invoices.</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="openLogModal()" class="flex items-center gap-2 px-4 py-2.5 bg-ortho-navy text-white font-medium rounded-xl hover:bg-ortho-navy/90 transition shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Log Treatment Session
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
        <a routerLink="/stock/direct-sales" class="px-4 py-2 rounded-lg transition text-ortho-navy/60 hover:text-ortho-navy hover:bg-white/50">
          Patient OTC Sales (SO)
        </a>
        <a routerLink="/stock/treatment-sessions" class="px-4 py-2 rounded-lg transition bg-white text-ortho-navy shadow-sm">
          Treatment Sessions Logger
        </a>
      </div>


      <!-- Invoices Registry -->
      <div class="bg-white rounded-2xl border border-ortho-navy/5 shadow-sm overflow-hidden">
        
        <div class="p-4 border-b border-ortho-navy/5 bg-ortho-navy/[0.01] flex items-center justify-between">
          <h3 class="text-base font-bold text-ortho-navy">Treatment Invoices Registry</h3>
          <span class="text-xs text-ortho-navy/40 font-medium">Record of patient clinical sessions and template materials consumed.</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-ortho-navy/[0.02] text-ortho-navy/60 font-semibold border-b border-ortho-navy/5">
                <th class="p-4">Invoice Number</th>
                <th class="p-4">Patient Name</th>
                <th class="p-4">Treatment</th>
                <th class="p-4">Session Date</th>
                <th class="p-4 text-center">Status</th>
                <th class="p-4 text-right">Materials Cost</th>
                <th class="p-4 text-right">Grand Total</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ortho-navy/5">
              @for (inv of invoices(); track inv.id) {
                <tr class="hover:bg-ortho-navy/[0.01] transition">
                  <td class="p-4 font-mono text-xs font-bold text-ortho-navy">{{ inv.invoiceNumber || 'DRAFT' }}</td>
                  <td class="p-4">
                    <div class="font-bold text-ortho-navy">{{ inv.patient?.firstName }} {{ inv.patient?.lastName }}</div>
                    <div class="text-[10px] text-ortho-navy/40">CIN: {{ inv.patient?.cin || 'N/A' }}</div>
                  </td>
                  <td class="p-4 font-semibold text-ortho-navy/80">{{ inv.treatment?.name }}</td>
                  <td class="p-4 text-ortho-navy/60 font-medium">{{ inv.sessionDate | date:'yyyy-MM-dd HH:mm' }}</td>
                  <td class="p-4 text-center">
                    <span class="px-2.5 py-1 text-xs font-bold rounded-full border uppercase" [ngClass]="getInvoiceStatusClasses(inv.status!)">
                      {{ inv.status }}
                    </span>
                  </td>
                  <td class="p-4 text-right font-medium text-emerald-600">{{ inv.consumablesCost | number:'1.2-2' }} DH</td>
                  <td class="p-4 text-right font-bold text-ortho-navy">{{ inv.total | number:'1.2-2' }} DH</td>
                  <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      @if (inv.status === 'DRAFT') {
                        <button (click)="openDraftEditModal(inv)" class="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border border-blue-200 transition">
                          Edit Draft
                        </button>
                        <button (click)="finalizeInvoice(inv)" class="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition">
                          Finalize
                        </button>
                      } @else if (inv.status === 'FINALIZED') {
                        <button (click)="cancelInvoice(inv)" class="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 rounded-lg border border-red-200 transition">
                          Cancel Session
                        </button>
                      }
                      <button (click)="deleteInvoice(inv)" class="p-1 hover:bg-red-50 text-red-500/60 hover:text-red-500 rounded-lg transition" [disabled]="inv.status === 'FINALIZED'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="p-8 text-center text-ortho-navy/40">No treatment session records found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Log Session Modal / Editor -->
      @if (showLogModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ortho-navy/60 backdrop-blur-sm">
          <div class="bg-white rounded-2xl max-w-4xl w-full overflow-hidden border border-ortho-navy/5 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            
            <div class="px-6 py-4 border-b border-ortho-navy/5 flex items-center justify-between bg-ortho-navy/[0.01] shrink-0">
              <div>
                <h3 class="text-lg font-bold text-ortho-navy">{{ editDraftMode() ? 'Edit Clinical Treatment Session' : 'Log Clinical Treatment Session' }}</h3>
                <p class="text-xs text-ortho-navy/60">Configuring patient materials tracking and billing session.</p>
              </div>
              <button (click)="closeLogModal()" class="p-1 text-ortho-navy/40 hover:text-ortho-navy hover:bg-ortho-navy/5 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 space-y-5">
              
              @if (!activeDraft()) {
                <!-- Step 1: Select Patient and Treatment -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1.5">Select Patient *</label>
                    <select [(ngModel)]="logPatientId" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white font-medium">
                      <option [value]="null">Select a patient...</option>
                      @for (p of patients(); track p.id) {
                        <option [value]="p.id">{{ p.lastName }} {{ p.firstName }} (CIN: {{ p.cin || 'N/A' }})</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1.5">Select Treatment Procedure *</label>
                    <select [(ngModel)]="logTreatmentId" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white font-medium">
                      <option [value]="null">Select procedure template...</option>
                      @for (t of treatments(); track t.id) {
                        <option [value]="t.id">{{ t.name }} ({{ t.basePrice }} DH)</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="flex justify-end pt-2">
                  <button type="button" (click)="initializeDraft()" [disabled]="!logPatientId || !logTreatmentId" class="px-5 py-2 bg-ortho-navy text-white rounded-xl text-sm font-semibold hover:bg-ortho-navy/90 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    Load Session Template
                  </button>
                </div>
              } @else {
                <!-- Step 2: Full session editor -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <!-- Main Editor Section -->
                  <div class="md:col-span-2 space-y-5">
                    
                    <!-- Consumables Editor Table -->
                    <div class="space-y-3">
                      <div class="flex items-center justify-between border-b border-ortho-navy/5 pb-2">
                        <span class="text-xs font-bold text-ortho-navy/60 uppercase tracking-wide">Materials Consumed Logger</span>
                        <button type="button" (click)="addExtraConsumable()" class="px-2.5 py-1 text-xs font-semibold bg-ortho-navy text-white hover:bg-ortho-navy/90 transition rounded-lg">
                          + Add Extra Material
                        </button>
                      </div>

                      <div class="space-y-3">
                        @for (c of draftConsumables; track $index; let idx = $index) {
                          <div class="grid grid-cols-12 gap-3 items-end bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100 font-semibold text-xs text-ortho-navy">
                            <div class="col-span-6">
                              <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Material Name</label>
                              <select [(ngModel)]="c.stockItem" (change)="onConsumableItemChange(idx)" [disabled]="!!c.id" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white focus:outline-none">
                                <option [value]="null">Select item...</option>
                                @for (item of catalogItems(); track item.id) {
                                  <option [ngValue]="item">{{ item.name }} (Available: {{ item.currentStock }})</option>
                                }
                              </select>
                            </div>
                            <div class="col-span-2">
                              <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Qty Used</label>
                              <input type="number" [(ngModel)]="c.actualQuantity" (change)="recalculateDraftTotals()" min="0.0001" step="any" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white text-center focus:outline-none font-mono" />
                            </div>
                            <div class="col-span-3 text-right">
                              <span class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Usage Cost</span>
                              <span class="font-bold text-emerald-600 block py-1.5 text-xs">{{ (c.actualQuantity * c.pricePerUnit) | number:'1.2-2' }} DH</span>
                            </div>
                            <div class="col-span-1 text-center">
                              <button type="button" (click)="removeDraftConsumable(idx)" class="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </div>
                          </div>
                        }
                      </div>
                    </div>

                    <!-- Clinical Discounts -->
                    <div class="space-y-3">
                      <div class="flex items-center justify-between border-b border-ortho-navy/5 pb-2">
                        <span class="text-xs font-bold text-ortho-navy/60 uppercase tracking-wide">Clinical Discounts & Adjustments</span>
                        <button type="button" (click)="addDiscountLine()" class="px-2.5 py-1 text-xs font-semibold bg-ortho-navy text-white hover:bg-ortho-navy/90 transition rounded-lg">
                          + Add Discount
                        </button>
                      </div>

                      <div class="space-y-2">
                        @for (d of draftDiscounts; track $index; let idx = $index) {
                          <div class="grid grid-cols-12 gap-3 items-end bg-amber-50/20 p-3.5 rounded-2xl border border-amber-100/50 font-semibold text-xs text-ortho-navy">
                            <div class="col-span-3">
                              <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Target</label>
                              <select [(ngModel)]="d.target" (change)="recalculateDraftTotals()" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white focus:outline-none">
                                <option value="INVOICE">Entire Invoice</option>
                                <option value="TREATMENT">Treatment Fee</option>
                              </select>
                            </div>
                            <div class="col-span-3">
                              <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Type</label>
                              <select [(ngModel)]="d.type" (change)="recalculateDraftTotals()" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white focus:outline-none">
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FIXED">Fixed Amount (DH)</option>
                              </select>
                            </div>
                            <div class="col-span-2">
                              <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Value</label>
                              <input type="number" [(ngModel)]="d.value" (change)="recalculateDraftTotals()" min="0" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white text-center focus:outline-none font-mono" />
                            </div>
                            <div class="col-span-3">
                              <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Reason</label>
                              <input type="text" [(ngModel)]="d.reason" placeholder="e.g. Family plan" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white focus:outline-none" />
                            </div>
                            <div class="col-span-1 text-center">
                              <button type="button" (click)="removeDiscountLine(idx)" class="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </div>
                          </div>
                        }
                      </div>
                    </div>

                  </div>

                  <!-- Sidebar Totals / Card Summary -->
                  <div class="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-4 self-start">
                    <h4 class="text-sm font-bold text-ortho-navy border-b border-ortho-navy/5 pb-2 uppercase tracking-wide">Session Summary</h4>
                    
                    <div class="space-y-3 text-xs font-semibold text-ortho-navy/70">
                      <div class="flex justify-between">
                        <span>Patient:</span>
                        <span class="font-bold text-ortho-navy">{{ activeDraft()?.patient?.firstName }} {{ activeDraft()?.patient?.lastName }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Procedure:</span>
                        <span class="font-bold text-ortho-navy">{{ activeDraft()?.treatment?.name }}</span>
                      </div>
                      
                      <hr class="border-ortho-navy/5">
                      
                      <div class="flex justify-between">
                        <span>Treatment Fee:</span>
                        <span class="font-bold text-ortho-navy">{{ activeDraft()?.treatmentPrice | number:'1.2-2' }} DH</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Consumables Cost:</span>
                        <span class="font-bold text-emerald-600">+{{ activeDraft()?.consumablesCost | number:'1.2-2' }} DH</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Subtotal:</span>
                        <span class="font-bold text-ortho-navy">{{ activeDraft()?.subtotal | number:'1.2-2' }} DH</span>
                      </div>
                      <div class="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span>-{{ activeDraft()?.discountAmount | number:'1.2-2' }} DH</span>
                      </div>

                      <hr class="border-ortho-navy/5">

                      <div class="flex justify-between items-baseline text-sm font-bold text-ortho-navy pt-2">
                        <span>Grand Total:</span>
                        <span class="text-lg font-extrabold text-ortho-navy">{{ activeDraft()?.total | number:'1.2-2' }} DH</span>
                      </div>
                    </div>

                    <div class="pt-3 border-t border-ortho-navy/5 space-y-2">
                      <button (click)="saveDraftSession()" class="w-full py-2 bg-ortho-navy text-white text-xs font-bold rounded-xl hover:bg-ortho-navy/90 transition shadow-sm">
                        Save Session Draft
                      </button>
                      <button (click)="finalizeSessionFromModal()" class="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm">
                        Finalize & Deduct Stock
                      </button>
                    </div>

                  </div>

                </div>
              }

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
export class TreatmentSessionsComponent implements OnInit {
  private stockService = inject(StockService);
  private patientService = inject(PatientApiService);

  readonly invoices = signal<TreatmentInvoice[]>([]);
  readonly patients = signal<Patient[]>([]);
  readonly treatments = signal<Treatment[]>([]);
  readonly catalogItems = signal<StockItem[]>([]);

  // Modal control
  readonly showLogModal = signal(false);
  readonly editDraftMode = signal(false);
  
  // Selection
  logPatientId: string | null = null;
  logTreatmentId: string | null = null;

  // Active Draft Session
  readonly activeDraft = signal<TreatmentInvoice | null>(null);
  draftConsumables: TreatmentInvoiceConsumable[] = [];
  draftDiscounts: InvoiceDiscount[] = [];

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.stockService.getTreatmentInvoices().subscribe(data => {
      this.invoices.set(data.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
    });
    this.patientService.getPatients().subscribe(data => this.patients.set(data));
    this.stockService.getTreatments().subscribe(data => this.treatments.set(data));
    this.stockService.getStockItems().subscribe(data => this.catalogItems.set(data));
  }

  openLogModal() {
    this.editDraftMode.set(false);
    this.logPatientId = null;
    this.logTreatmentId = null;
    this.activeDraft.set(null);
    this.draftConsumables = [];
    this.draftDiscounts = [];
    this.showLogModal.set(true);
  }

  openDraftEditModal(inv: TreatmentInvoice) {
    this.editDraftMode.set(true);
    this.activeDraft.set(inv);
    this.draftConsumables = inv.consumablesUsed ? inv.consumablesUsed.map(c => ({ ...c })) : [];
    this.draftDiscounts = inv.discounts ? inv.discounts.map(d => ({ ...d })) : [];
    this.showLogModal.set(true);
  }

  closeLogModal() {
    this.showLogModal.set(false);
  }

  initializeDraft() {
    if (!this.logPatientId || !this.logTreatmentId) {
      return;
    }

    this.stockService.createDraftTreatmentInvoice(this.logPatientId, this.logTreatmentId, '00000000-0000-0000-0000-000000000000').subscribe(draft => {
      this.activeDraft.set(draft);
      this.draftConsumables = draft.consumablesUsed ? draft.consumablesUsed.map(c => ({ ...c })) : [];
      this.draftDiscounts = draft.discounts ? draft.discounts.map(d => ({ ...d })) : [];
    });
  }

  addExtraConsumable() {
    this.draftConsumables.push({
      stockItem: null as any,
      defaultQuantity: 1,
      actualQuantity: 1,
      pricePerUnit: 0,
      totalCost: 0,
      modified: true
    });
  }

  removeDraftConsumable(idx: number) {
    this.draftConsumables.splice(idx, 1);
    this.recalculateDraftTotals();
  }

  onConsumableItemChange(idx: number) {
    const line = this.draftConsumables[idx];
    if (line.stockItem) {
      line.pricePerUnit = line.stockItem.pricePerUse;
    }
    this.recalculateDraftTotals();
  }

  addDiscountLine() {
    this.draftDiscounts.push({
      type: 'PERCENTAGE',
      target: 'INVOICE',
      value: 10,
      reason: ''
    });
    this.recalculateDraftTotals();
  }

  removeDiscountLine(idx: number) {
    this.draftDiscounts.splice(idx, 1);
    this.recalculateDraftTotals();
  }

  recalculateDraftTotals() {
    const draft = this.activeDraft();
    if (!draft) return;

    // 1. Recalculate consumable cost
    let consumablesTotal = 0;
    this.draftConsumables.forEach(c => {
      c.totalCost = c.actualQuantity * c.pricePerUnit;
      consumablesTotal += c.totalCost;
    });

    draft.consumablesCost = consumablesTotal;
    draft.subtotal = draft.treatmentPrice + consumablesTotal;

    // 2. Recalculate discounts
    let discountSum = 0;
    this.draftDiscounts.forEach(d => {
      let base = 0;
      if (d.target === 'INVOICE') {
        base = draft.subtotal!;
      } else if (d.target === 'TREATMENT') {
        base = draft.treatmentPrice;
      }

      if (d.type === 'PERCENTAGE') {
        discountSum += (base * d.value) / 100;
      } else {
        discountSum += d.value;
      }
    });

    draft.discountAmount = discountSum;
    draft.total = draft.subtotal! - discountSum;

    // Update draft signal
    this.activeDraft.set({ ...draft });
  }

  saveDraftSession() {
    const draft = this.activeDraft();
    if (!draft) return;

    draft.consumablesUsed = this.draftConsumables.map(c => ({
      ...c,
      stockItem: { id: c.stockItem.id, pricePerUse: c.stockItem.pricePerUse } as StockItem
    }));
    draft.discounts = this.draftDiscounts;

    this.stockService.saveTreatmentInvoice(draft).subscribe(() => {
      this.loadAllData();
      this.closeLogModal();
    });
  }

  finalizeSessionFromModal() {
    const draft = this.activeDraft();
    if (!draft) return;

    draft.consumablesUsed = this.draftConsumables.map(c => ({
      ...c,
      stockItem: { id: c.stockItem.id, pricePerUse: c.stockItem.pricePerUse } as StockItem
    }));
    draft.discounts = this.draftDiscounts;

    this.stockService.saveTreatmentInvoice(draft).subscribe(savedInvoice => {
      this.stockService.finalizeTreatmentInvoice(savedInvoice.id!, '00000000-0000-0000-0000-000000000000').subscribe(() => {
        this.loadAllData();
        this.closeLogModal();
      });
    });
  }

  finalizeInvoice(inv: TreatmentInvoice) {
    this.stockService.finalizeTreatmentInvoice(inv.id!, '00000000-0000-0000-0000-000000000000').subscribe(() => {
      this.loadAllData();
    });
  }

  cancelInvoice(inv: TreatmentInvoice) {
    if (confirm("Are you sure you want to cancel this treatment session? Consumed materials will be refunded to stock.")) {
      this.stockService.cancelTreatmentInvoice(inv.id!, '00000000-0000-0000-0000-000000000000').subscribe(() => {
        this.loadAllData();
      });
    }
  }

  deleteInvoice(inv: TreatmentInvoice) {
    if (confirm("Are you sure you want to delete this draft treatment session?")) {
      this.stockService.deleteTreatmentInvoice(inv.id!).subscribe(() => {
        this.loadAllData();
      });
    }
  }

  getInvoiceStatusClasses(status: TreatmentInvoiceStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      case 'FINALIZED':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-500 border-red-200';
      case 'REFUNDED':
        return 'bg-amber-50 text-amber-500 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  }
}
