import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { StockService } from '../../../../core/services/stock.service';
import { Treatment, TreatmentConsumable, StockItem } from '../../../../core/models/stock.model';

@Component({
  selector: 'app-treatments-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      
      <!-- Top Title Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-ortho-navy">Clinical Treatments & Procedures</h1>
          <p class="text-sm text-ortho-navy/60">Configure practice orthodontic procedures, set standard fees, and map default consumable templates.</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="openAddModal()" class="flex items-center gap-2 px-4 py-2.5 bg-ortho-navy text-white font-medium rounded-xl hover:bg-ortho-navy/90 transition shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New Treatment
          </button>
        </div>
      </div>

      <!-- Treatments Grid / Catalog -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (t of treatments(); track t.id) {
          <div class="bg-white rounded-2xl border border-ortho-navy/5 shadow-sm p-6 hover:shadow-md transition duration-300 flex flex-col justify-between space-y-4">
            
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 bg-ortho-navy/5 text-ortho-navy font-mono text-xs font-bold rounded-lg border border-ortho-navy/10 uppercase">{{ t.code }}</span>
                <div class="flex items-center gap-1.5">
                  <button (click)="openEditModal(t)" class="p-1 hover:bg-ortho-navy/5 text-ortho-navy/50 hover:text-ortho-navy rounded transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                  </button>
                  <button (click)="deleteTreatment(t)" class="p-1 hover:bg-red-50 text-red-500/60 hover:text-red-500 rounded transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>

              <h3 class="font-bold text-lg text-ortho-navy tracking-tight leading-tight">{{ t.name }}</h3>
              
              <div class="flex items-baseline gap-1.5 pt-1">
                <span class="text-xs text-ortho-navy/40 font-semibold uppercase tracking-wide">Base Fee:</span>
                <span class="text-lg font-extrabold text-ortho-navy">{{ t.basePrice | number:'1.2-2' }} DH</span>
              </div>
            </div>

            <!-- Consumables list summary -->
            <div class="border-t border-ortho-navy/5 pt-4 space-y-2 flex-1">
              <span class="text-[10px] font-bold text-ortho-navy/40 uppercase tracking-wider block">Default Consumables ({{ t.consumables?.length || 0 }})</span>
              
              <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                @for (c of t.consumables; track $index) {
                  <div class="flex items-center justify-between text-xs font-semibold text-ortho-navy/80 bg-gray-50 border border-gray-100 rounded-lg p-2">
                    <span class="truncate max-w-[150px]">{{ c.stockItem?.name }}</span>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="font-bold text-ortho-navy/40">x{{ c.quantityUsed }}</span>
                      <span class="text-emerald-600 font-extrabold">{{ (c.quantityUsed * c.stockItem.pricePerUse) | number:'1.2-2' }} DH</span>
                    </div>
                  </div>
                } @empty {
                  <span class="text-xs text-ortho-navy/30 block py-1">No default consumables configured.</span>
                }
              </div>
            </div>

            <!-- Cumulative cost summary -->
            <div class="border-t border-ortho-navy/5 pt-3 flex justify-between items-center text-xs">
              <span class="text-ortho-navy/40 font-bold uppercase tracking-wider">Materials Cost</span>
              <span class="font-bold text-emerald-600">{{ getConsumablesTotal(t) | number:'1.2-2' }} DH</span>
            </div>

          </div>
        } @empty {
          <div class="col-span-full bg-white rounded-2xl border border-ortho-navy/5 shadow-sm p-12 text-center text-ortho-navy/40">
            No clinical treatments configured.
          </div>
        }
      </div>

      <!-- Add/Edit Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ortho-navy/60 backdrop-blur-sm">
          <div class="bg-white rounded-2xl max-w-xl w-full overflow-hidden border border-ortho-navy/5 shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
            <div class="px-6 py-4 border-b border-ortho-navy/5 flex items-center justify-between bg-ortho-navy/[0.01] shrink-0">
              <h3 class="text-lg font-bold text-ortho-navy">{{ editMode() ? 'Edit Treatment Procedure' : 'Add Treatment Procedure' }}</h3>
              <button (click)="closeModal()" class="p-1 text-ortho-navy/40 hover:text-ortho-navy hover:bg-ortho-navy/5 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Procedure Code *</label>
                  <input type="text" [(ngModel)]="form.code" placeholder="e.g. TR-001" required class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition font-mono uppercase bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Base Price (DH) *</label>
                  <input type="number" [(ngModel)]="form.basePrice" required min="0" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Procedure Name *</label>
                <input type="text" [(ngModel)]="form.name" required class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" />
              </div>

              <!-- Consumables Configurator -->
              <div class="space-y-3">
                <div class="flex items-center justify-between border-b border-ortho-navy/5 pb-2">
                  <span class="text-xs font-bold text-ortho-navy/60 uppercase tracking-wide">Standard Material Template</span>
                  <button type="button" (click)="addConsumableLine()" class="px-2.5 py-1 text-xs font-semibold bg-ortho-navy text-white hover:bg-ortho-navy/90 transition rounded-lg">
                    + Add Material
                  </button>
                </div>

                <div class="space-y-3">
                  @for (c of formConsumables; track $index; let idx = $index) {
                    <div class="grid grid-cols-12 gap-3 items-end bg-gray-50/50 p-3 rounded-xl border border-gray-100 font-semibold text-xs text-ortho-navy">
                      <div class="col-span-6">
                        <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Stock Item</label>
                        <select [(ngModel)]="c.stockItem" (change)="onItemChange(idx)" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white focus:outline-none">
                          <option [value]="null">Select item...</option>
                          @for (item of catalogItems(); track item.id) {
                            <option [ngValue]="item">{{ item.name }} (SKU: {{ item.sku }})</option>
                          }
                        </select>
                      </div>
                      <div class="col-span-2">
                        <label class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Qty Used</label>
                        <input type="number" [(ngModel)]="c.quantityUsed" min="0.0001" step="any" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-xs bg-white text-center focus:outline-none font-mono" />
                      </div>
                      <div class="col-span-3 text-right">
                        <span class="block text-[10px] font-bold text-ortho-navy/50 uppercase mb-1">Material Cost</span>
                        <span class="font-bold text-emerald-600 block py-1.5 text-xs">{{ (c.quantityUsed * (c.stockItem?.pricePerUse || 0)) | number:'1.2-2' }} DH</span>
                      </div>
                      <div class="col-span-1 text-center">
                        <button type="button" (click)="removeConsumableLine(idx)" class="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    </div>
                  }
                </div>

                <div class="flex justify-end pt-3 border-t border-ortho-navy/5">
                  <div class="text-right">
                    <span class="text-xs font-bold text-ortho-navy/40 uppercase tracking-wider block">Cumulative Material Cost</span>
                    <span class="text-lg font-bold text-emerald-600">{{ formCumulativeCost() | number:'1.2-2' }} DH</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="px-6 py-4 border-t border-ortho-navy/5 flex items-center justify-end gap-3 bg-ortho-navy/[0.01] shrink-0">
              <button type="button" (click)="closeModal()" class="px-4 py-2 border border-ortho-navy/10 rounded-xl text-sm font-semibold hover:bg-gray-50 transition text-ortho-navy/70">Cancel</button>
              <button type="button" (click)="saveTreatment()" [disabled]="!form.code || !form.name || !form.basePrice" class="px-5 py-2 bg-ortho-navy text-white rounded-xl text-sm font-semibold hover:bg-ortho-navy/90 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Save Treatment</button>
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
export class TreatmentsListComponent implements OnInit {
  private stockService = inject(StockService);

  readonly treatments = signal<Treatment[]>([]);
  readonly catalogItems = signal<StockItem[]>([]);

  // Modal controls
  readonly showModal = signal(false);
  readonly editMode = signal(false);
  form: Partial<Treatment> = {};
  formConsumables: TreatmentConsumable[] = [];

  // Compute total material cost for active form lines
  readonly formCumulativeCost = computed(() => {
    return this.formConsumables.reduce((acc, curr) => {
      const p = curr.stockItem?.pricePerUse || 0;
      return acc + (curr.quantityUsed * p);
    }, 0);
  });

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.stockService.getTreatments().subscribe(data => this.treatments.set(data));
    this.stockService.getStockItems().subscribe(data => this.catalogItems.set(data));
  }

  getConsumablesTotal(t: Treatment): number {
    if (!t.consumables) return 0;
    return t.consumables.reduce((acc, curr) => acc + (curr.quantityUsed * curr.stockItem.pricePerUse), 0);
  }

  openAddModal() {
    this.editMode.set(false);
    this.form = {
      code: '',
      name: '',
      basePrice: 0
    };
    this.formConsumables = [];
    this.addConsumableLine();
    this.showModal.set(true);
  }

  openEditModal(t: Treatment) {
    this.editMode.set(true);
    this.form = { ...t };
    // Clone lines so edits don't affect original data instantly
    this.formConsumables = t.consumables ? t.consumables.map(c => ({ ...c })) : [];
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  addConsumableLine() {
    this.formConsumables.push({
      stockItem: null as any,
      quantityUsed: 1
    });
  }

  removeConsumableLine(idx: number) {
    this.formConsumables.splice(idx, 1);
  }

  onItemChange(idx: number) {
    // Optional callbacks if needed
  }

  saveTreatment() {
    if (!this.form.code || !this.form.name || !this.form.basePrice) {
      return;
    }

    // Attach mapped lines
    this.form.consumables = this.formConsumables
      .filter(c => c.stockItem && c.stockItem.id)
      .map(c => ({
        stockItem: { id: c.stockItem.id, pricePerUse: c.stockItem.pricePerUse } as StockItem,
        quantityUsed: c.quantityUsed
      }));

    if (this.editMode()) {
      this.stockService.updateTreatment(this.form.id!, this.form).subscribe(() => {
        this.loadAllData();
        this.closeModal();
      });
    } else {
      this.stockService.createTreatment(this.form).subscribe(() => {
        this.loadAllData();
        this.closeModal();
      });
    }
  }

  deleteTreatment(t: Treatment) {
    if (confirm(`Are you sure you want to delete treatment procedure '${t.name}'?`)) {
      this.stockService.deleteTreatment(t.id!).subscribe(() => {
        this.loadAllData();
      });
    }
  }
}
