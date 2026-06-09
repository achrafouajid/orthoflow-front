import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { StockService } from '../../../../core/services/stock.service';
import {
  StockItem, Supplier, StockMovement, MovementType,
  STOCK_CATEGORIES, MOVEMENT_TYPES
} from '../../../../core/models/stock.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-stock-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      
      <!-- Top Title Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-ortho-navy">Stock & Inventory</h1>
          <p class="text-sm text-ortho-navy/60">Monitor surgical and orthodontic consumables, track item usage, and automate purchase ordering.</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="openAddModal()" class="flex items-center gap-2 px-4 py-2.5 bg-ortho-navy text-white font-medium rounded-xl hover:bg-ortho-navy/90 transition shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New Item
          </button>
        </div>
      </div>

      <!-- Module Navigation Pills -->
      <div class="flex flex-wrap gap-2 bg-ortho-navy/[0.03] p-1.5 rounded-xl border border-ortho-navy/5 max-w-max font-semibold text-xs">
        <a routerLink="/stock" class="px-4 py-2 rounded-lg transition bg-white text-ortho-navy shadow-sm">
          Stock Catalog
        </a>
        <a routerLink="/stock/procurement" class="px-4 py-2 rounded-lg transition text-ortho-navy/60 hover:text-ortho-navy hover:bg-white/50">
          Procurement & Receipts (PO/DN)
        </a>
        <a routerLink="/stock/direct-sales" class="px-4 py-2 rounded-lg transition text-ortho-navy/60 hover:text-ortho-navy hover:bg-white/50">
          Patient OTC Sales (SO)
        </a>
        <a routerLink="/stock/treatment-sessions" class="px-4 py-2 rounded-lg transition text-ortho-navy/60 hover:text-ortho-navy hover:bg-white/50">
          Treatment Sessions Logger
        </a>
      </div>

      <!-- KPI Summary Dashboard -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <!-- Total Items -->
        <div class="bg-white p-5 rounded-2xl border border-ortho-navy/5 shadow-sm hover:shadow transition flex items-center gap-4">
          <div class="p-3 bg-ortho-navy/5 text-ortho-navy rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <div>
            <div class="text-xs text-ortho-navy/40 font-semibold uppercase tracking-wider">Total Items</div>
            <div class="text-2xl font-bold text-ortho-navy">{{ kpiTotalItems() }}</div>
          </div>
        </div>

        <!-- Out of Stock -->
        <div class="bg-white p-5 rounded-2xl border border-ortho-navy/5 shadow-sm hover:shadow transition flex items-center gap-4">
          <div class="p-3 bg-red-50 text-red-500 rounded-xl" [class.animate-pulse]="kpiOutOfStock() > 0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <div>
            <div class="text-xs text-ortho-navy/40 font-semibold uppercase tracking-wider">Out of Stock</div>
            <div class="text-2xl font-bold" [class.text-red-500]="kpiOutOfStock() > 0" [class.text-ortho-navy]="kpiOutOfStock() === 0">{{ kpiOutOfStock() }}</div>
          </div>
        </div>

        <!-- Low Stock -->
        <div class="bg-white p-5 rounded-2xl border border-ortho-navy/5 shadow-sm hover:shadow transition flex items-center gap-4">
          <div class="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <div>
            <div class="text-xs text-ortho-navy/40 font-semibold uppercase tracking-wider">Low Stock</div>
            <div class="text-2xl font-bold" [class.text-amber-500]="kpiLowStock() > 0" [class.text-ortho-navy]="kpiLowStock() === 0">{{ kpiLowStock() }}</div>
          </div>
        </div>

        <!-- Valuation -->
        <div class="bg-white p-5 rounded-2xl border border-ortho-navy/5 shadow-sm hover:shadow transition flex items-center gap-4">
          <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div>
            <div class="text-xs text-ortho-navy/40 font-semibold uppercase tracking-wider">Valuation (Cost)</div>
            <div class="text-2xl font-bold text-emerald-600">{{ kpiValuation() | number:'1.2-2' }} DH</div>
          </div>
        </div>

      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-ortho-navy/10 flex gap-6">
        <button (click)="activeTab.set('catalog')" class="pb-3 text-sm font-semibold transition" [class.text-ortho-navy]="activeTab() === 'catalog'" [class.border-b-2]="activeTab() === 'catalog'" [class.border-ortho-navy]="activeTab() === 'catalog'" [class.text-ortho-navy/40]="activeTab() !== 'catalog'">
          Stock Catalog
        </button>
        <button (click)="activeTab.set('movements')" class="pb-3 text-sm font-semibold transition" [class.text-ortho-navy]="activeTab() === 'movements'" [class.border-b-2]="activeTab() === 'movements'" [class.border-ortho-navy]="activeTab() === 'movements'" [class.text-ortho-navy/40]="activeTab() !== 'movements'">
          Audit Ledger
        </button>
        <button (click)="activeTab.set('suppliers')" class="pb-3 text-sm font-semibold transition" [class.text-ortho-navy]="activeTab() === 'suppliers'" [class.border-b-2]="activeTab() === 'suppliers'" [class.border-ortho-navy]="activeTab() === 'suppliers'" [class.text-ortho-navy/40]="activeTab() !== 'suppliers'">
          Suppliers Directory
        </button>
        <button (click)="activeTab.set('reconciliation')" class="pb-3 text-sm font-semibold transition" [class.text-ortho-navy]="activeTab() === 'reconciliation'" [class.border-b-2]="activeTab() === 'reconciliation'" [class.border-ortho-navy]="activeTab() === 'reconciliation'" [class.text-ortho-navy/40]="activeTab() !== 'reconciliation'">
          Physical Count (Reconciliation)
        </button>
      </div>

      <!-- Content Views -->
      @if (activeTab() === 'catalog') {
        
        <!-- Catalog Tab -->
        <div class="bg-white rounded-2xl border border-ortho-navy/5 shadow-sm overflow-hidden">
          
                <!-- Filters & Search Bar -->
          <div class="p-4 border-b border-ortho-navy/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-ortho-navy/[0.01]">
            <div class="relative max-w-md w-full">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-ortho-navy/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input
                id="catalog-search"
                type="text"
                [ngModel]="catalogSearchValue"
                (ngModelChange)="onCatalogSearchChange($event)"
                placeholder="Search by name or SKU..."
                class="w-full pl-10 pr-4 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition"
              />
            </div>

            <div class="flex items-center gap-3 self-end">
              <select
                id="catalog-category"
                [ngModel]="catalogCategory()"
                (ngModelChange)="onCatalogCategoryChange($event)"
                class="px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm bg-white focus:outline-none focus:border-ortho-navy transition"
              >
                @for (cat of stockCategories; track cat.value) {
                  <option [value]="cat.value">{{ cat.label }}</option>
                }
              </select>
            </div>
          </div>

                    <!-- Catalog Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="bg-ortho-navy/[0.02] text-ortho-navy/60 font-semibold border-b border-ortho-navy/5">
                  <th class="p-4 cursor-pointer select-none hover:text-ortho-navy transition group" (click)="sortCatalog('sku')">
                    <span class="flex items-center gap-1">SKU / Code <span class="opacity-50 group-hover:opacity-100">{{ getSortIcon('catalog','sku') }}</span></span>
                  </th>
                  <th class="p-4 cursor-pointer select-none hover:text-ortho-navy transition group" (click)="sortCatalog('name')">
                    <span class="flex items-center gap-1">Item Name <span class="opacity-50 group-hover:opacity-100">{{ getSortIcon('catalog','name') }}</span></span>
                  </th>
                  <th class="p-4 cursor-pointer select-none hover:text-ortho-navy transition group" (click)="sortCatalog('category')">
                    <span class="flex items-center gap-1">Category <span class="opacity-50 group-hover:opacity-100">{{ getSortIcon('catalog','category') }}</span></span>
                  </th>
                  <th class="p-4 text-center cursor-pointer select-none hover:text-ortho-navy transition group" (click)="sortCatalog('currentStock')">
                    <span class="flex items-center justify-center gap-1">Available Stock <span class="opacity-50 group-hover:opacity-100">{{ getSortIcon('catalog','currentStock') }}</span></span>
                  </th>
                  <th class="p-4 text-right cursor-pointer select-none hover:text-ortho-navy transition group" (click)="sortCatalog('purchasePrice')">
                    <span class="flex items-center justify-end gap-1">Unit cost <span class="opacity-50 group-hover:opacity-100">{{ getSortIcon('catalog','purchasePrice') }}</span></span>
                  </th>
                  <th class="p-4 text-right cursor-pointer select-none hover:text-ortho-navy transition group" (click)="sortCatalog('pricePerUse')">
                    <span class="flex items-center justify-end gap-1">Usage Cost <span class="opacity-50 group-hover:opacity-100">{{ getSortIcon('catalog','pricePerUse') }}</span></span>
                  </th>
                  <th class="p-4">Supplier</th>
                  <th class="p-4">Location</th>
                  <th class="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-ortho-navy/5">
                @for (item of items(); track item.id) {
                  <tr class="hover:bg-ortho-navy/[0.01] transition">
                    <td class="p-4 font-mono text-xs font-semibold text-ortho-navy/70">{{ item.sku }}</td>
                    <td class="p-4">
                      <div class="font-bold text-ortho-navy">{{ item.name }}</div>
                      @if (item.batchNumber) {
                        <div class="text-[10px] text-ortho-navy/40">Batch: {{ item.batchNumber }} @if (item.expiryDate) { | Exp: {{ item.expiryDate }} }</div>
                      }
                    </td>
                    <td class="p-4">
                      <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-ortho-navy/5 text-ortho-navy">
                        {{ item.category }}
                      </span>
                    </td>
                    <td class="p-4 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <span class="font-bold" [class.text-red-500]="item.currentStock === 0" [class.text-amber-500]="item.currentStock > 0 && item.currentStock <= item.minimumStock" [class.text-emerald-600]="item.currentStock > item.minimumStock">
                          {{ item.currentStock }} {{ item.unit || 'units' }}
                        </span>
                        @if (item.currentStock === 0) {
                          <span class="px-1.5 py-0.5 text-[9px] font-bold bg-red-50 text-red-500 rounded border border-red-200 uppercase">Empty</span>
                        } @else if (item.currentStock <= item.minimumStock) {
                          <span class="px-1.5 py-0.5 text-[9px] font-bold bg-amber-50 text-amber-600 rounded border border-amber-200 uppercase">Low</span>
                        }
                      </div>
                    </td>
                    <td class="p-4 text-right font-medium text-ortho-navy/80">{{ item.purchasePrice | number:'1.2-2' }} DH <span class="text-[10px] text-ortho-navy/40">/{{ item.unitSize }}</span></td>
                    <td class="p-4 text-right font-medium text-emerald-600">{{ item.pricePerUse | number:'1.4-4' }} DH</td>
                    <td class="p-4 text-ortho-navy/60 font-medium">{{ item.supplier?.name || 'N/A' }}</td>
                    <td class="p-4 text-ortho-navy/60 font-medium"><span class="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-xs">{{ item.location || 'N/A' }}</span></td>
                    <td class="p-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button (click)="openAdjustmentModal(item)" class="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition border border-emerald-100">
                          Adjust
                        </button>
                        <button (click)="openEditModal(item)" class="p-1 hover:bg-ortho-navy/5 text-ortho-navy/60 hover:text-ortho-navy rounded-lg transition">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                        </button>
                        <button (click)="deleteItem(item)" class="p-1 hover:bg-red-50 text-red-500/60 hover:text-red-500 rounded-lg transition">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="p-8 text-center text-ortho-navy/40">No stock catalog items found.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      } @else if (activeTab() === 'movements') {

        <!-- Movements Audit Ledger -->
        <div class="bg-white rounded-2xl border border-ortho-navy/5 shadow-sm overflow-hidden">

          <!-- Movements filter bar -->
          <div class="p-4 border-b border-ortho-navy/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-ortho-navy/[0.01]">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-ortho-navy">Stock Audit Ledger</h3>
              <span class="text-xs text-ortho-navy/40 font-medium hidden md:inline">Real-time consumption &amp; inventory additions log.</span>
            </div>
            <div class="flex flex-col sm:flex-row items-center gap-3">
              <div class="relative w-full sm:w-64">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-ortho-navy/40">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </span>
                <input
                  id="movements-search"
                  type="text"
                  [ngModel]="movSearchValue"
                  (ngModelChange)="onMovSearchChange($event)"
                  placeholder="Search item name, SKU, ref..."
                  class="w-full pl-9 pr-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition"
                />
              </div>
              <select
                id="movements-type"
                [ngModel]="movType()"
                (ngModelChange)="onMovTypeChange($event)"
                class="px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm bg-white focus:outline-none focus:border-ortho-navy transition w-full sm:w-auto"
              >
                @for (t of movementTypes; track t.value) {
                  <option [value]="t.value">{{ t.label }}</option>
                }
              </select>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="bg-ortho-navy/[0.02] text-ortho-navy/60 font-semibold border-b border-ortho-navy/5">
                  <th class="p-4 cursor-pointer select-none hover:text-ortho-navy transition group" (click)="sortMovements('createdAt')">
                    <span class="flex items-center gap-1">Timestamp <span class="opacity-50 group-hover:opacity-100">{{ getSortIcon('mov','createdAt') }}</span></span>
                  </th>
                  <th class="p-4 cursor-pointer select-none hover:text-ortho-navy transition group" (click)="sortMovements('stockItem')">
                    <span class="flex items-center gap-1">Item Name / SKU <span class="opacity-50 group-hover:opacity-100">{{ getSortIcon('mov','stockItem') }}</span></span>
                  </th>
                  <th class="p-4 cursor-pointer select-none hover:text-ortho-navy transition group" (click)="sortMovements('movementType')">
                    <span class="flex items-center gap-1">Type <span class="opacity-50 group-hover:opacity-100">{{ getSortIcon('mov','movementType') }}</span></span>
                  </th>
                  <th class="p-4 text-center cursor-pointer select-none hover:text-ortho-navy transition group" (click)="sortMovements('quantity')">
                    <span class="flex items-center justify-center gap-1">Qty Delta <span class="opacity-50 group-hover:opacity-100">{{ getSortIcon('mov','quantity') }}</span></span>
                  </th>
                  <th class="p-4 text-center cursor-pointer select-none hover:text-ortho-navy transition group" (click)="sortMovements('quantityBefore')">
                    <span class="flex items-center justify-center gap-1">Before <span class="opacity-50 group-hover:opacity-100">{{ getSortIcon('mov','quantityBefore') }}</span></span>
                  </th>
                  <th class="p-4 text-center cursor-pointer select-none hover:text-ortho-navy transition group" (click)="sortMovements('quantityAfter')">
                    <span class="flex items-center justify-center gap-1">After <span class="opacity-50 group-hover:opacity-100">{{ getSortIcon('mov','quantityAfter') }}</span></span>
                  </th>
                  <th class="p-4 cursor-pointer select-none hover:text-ortho-navy transition group" (click)="sortMovements('sourceReference')">
                    <span class="flex items-center gap-1">Source Reference <span class="opacity-50 group-hover:opacity-100">{{ getSortIcon('mov','sourceReference') }}</span></span>
                  </th>
                  <th class="p-4">Notes</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-ortho-navy/5">
                @for (mov of movements(); track mov.id) {
                  <tr class="hover:bg-ortho-navy/[0.01] transition">
                    <td class="p-4 text-xs font-mono text-ortho-navy/50">{{ mov.createdAt | date:'yyyy-MM-dd HH:mm:ss' }}</td>
                    <td class="p-4">
                      <div class="font-bold text-ortho-navy">{{ mov.stockItem?.name }}</div>
                      <div class="text-[10px] text-ortho-navy/40">SKU: {{ mov.stockItem?.sku }}</div>
                    </td>
                    <td class="p-4">
                      <span class="px-2.5 py-1 text-[11px] font-semibold rounded-full border" [ngClass]="getMovementTypeClasses(mov.movementType)">
                        {{ mov.movementType }}
                      </span>
                    </td>
                    <td class="p-4 text-center font-bold" [class.text-emerald-600]="isAddition(mov.movementType)" [class.text-red-500]="!isAddition(mov.movementType)">
                      {{ isAddition(mov.movementType) ? '+' : '-' }}{{ mov.quantity }}
                    </td>
                    <td class="p-4 text-center text-ortho-navy/50 font-medium">{{ mov.quantityBefore }}</td>
                    <td class="p-4 text-center text-ortho-navy/80 font-bold">{{ mov.quantityAfter }}</td>
                    <td class="p-4">
                      <div class="flex items-center gap-1.5">
                        <span class="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[11px] font-bold text-ortho-navy/60 font-mono">{{ mov.sourceType }}</span>
                        <span class="font-semibold text-xs text-ortho-navy/80">{{ mov.sourceReference }}</span>
                      </div>
                    </td>
                    <td class="p-4 text-ortho-navy/60 max-w-xs truncate" [title]="mov.notes">{{ mov.notes || '-' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="p-8 text-center text-ortho-navy/40">No stock movement logs found.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      } @else if (activeTab() === 'suppliers') {
        
        <!-- Suppliers Directory Tab -->
        <div class="bg-white rounded-2xl border border-ortho-navy/5 shadow-sm overflow-hidden">
          
          <div class="p-4 border-b border-ortho-navy/5 flex items-center justify-between bg-ortho-navy/[0.01]">
            <div>
              <h3 class="text-base font-bold text-ortho-navy">Suppliers Directory</h3>
              <p class="text-xs text-ortho-navy/40">Manage dental equipment suppliers and wholesale providers.</p>
            </div>
            <button (click)="openAddSupplierModal()" class="px-3.5 py-1.5 text-xs font-semibold bg-ortho-navy text-white hover:bg-ortho-navy/90 transition rounded-xl shadow-sm">
              Add Supplier
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="bg-ortho-navy/[0.02] text-ortho-navy/60 font-semibold border-b border-ortho-navy/5">
                  <th class="p-4">Company Name</th>
                  <th class="p-4">Contact Person</th>
                  <th class="p-4">Email</th>
                  <th class="p-4">Phone Number</th>
                  <th class="p-4">Corporate Address</th>
                  <th class="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-ortho-navy/5">
                @for (sup of suppliers(); track sup.id) {
                  <tr class="hover:bg-ortho-navy/[0.01] transition">
                    <td class="p-4 font-bold text-ortho-navy">{{ sup.name }}</td>
                    <td class="p-4 text-ortho-navy/80 font-medium">{{ sup.contactName || '-' }}</td>
                    <td class="p-4 text-ortho-navy/60 font-medium">{{ sup.email || '-' }}</td>
                    <td class="p-4 text-ortho-navy/60 font-medium">{{ sup.phone || '-' }}</td>
                    <td class="p-4 text-ortho-navy/60 max-w-xs truncate" [title]="sup.address">{{ sup.address || '-' }}</td>
                    <td class="p-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button (click)="openEditSupplierModal(sup)" class="p-1 hover:bg-ortho-navy/5 text-ortho-navy/60 hover:text-ortho-navy rounded-lg transition">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                        </button>
                        <button (click)="deleteSupplier(sup)" class="p-1 hover:bg-red-50 text-red-500/60 hover:text-red-500 rounded-lg transition">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="p-8 text-center text-ortho-navy/40">No suppliers registered.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      } @else if (activeTab() === 'reconciliation') {

        <!-- Physical Count & Reconciliation Tab (BR08) -->
        <div class="space-y-6">
          
          @if (activeCountSession()) {
            
            <!-- Active Count Session Form -->
            <div class="bg-white rounded-2xl border border-ortho-navy/5 shadow-sm overflow-hidden animate-fade-in">
              <div class="p-6 border-b border-ortho-navy/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-ortho-navy/[0.01]">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 font-mono text-xs font-bold rounded-lg uppercase">
                      {{ activeCountSession().status }}
                    </span>
                    <h3 class="text-lg font-bold text-ortho-navy leading-none">Active Physical Counting Session</h3>
                  </div>
                  <p class="text-xs text-ortho-navy/40 font-semibold">Theoretical stock snapshot frozen on: <span class="font-bold text-ortho-navy/60">{{ activeCountSession().createdAt | date:'yyyy-MM-dd HH:mm' }}</span></p>
                </div>
                
                <div class="flex items-center gap-2">
                  <button (click)="cancelReconciliation()" class="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 font-semibold rounded-xl text-xs transition">
                    Cancel Session
                  </button>
                  <button (click)="saveDraftCounts()" class="px-4 py-2 border border-ortho-navy/10 hover:bg-gray-50 text-ortho-navy/70 font-semibold rounded-xl text-xs transition">
                    Save Draft
                  </button>
                  <button (click)="postReconciliation()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition shadow-sm">
                    Post Count & Reconcile
                  </button>
                </div>
              </div>

              <!-- Lines Table -->
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr class="bg-ortho-navy/[0.02] text-ortho-navy/60 font-semibold border-b border-ortho-navy/5">
                      <th class="p-4">SKU</th>
                      <th class="p-4">Item Name</th>
                      <th class="p-4 text-center">Theoretical Qty</th>
                      <th class="p-4 text-center" style="width: 150px;">Physical Count</th>
                      <th class="p-4 text-center">Qty Variance</th>
                      <th class="p-4 text-right">Unit Price</th>
                      <th class="p-4 text-right">Cost Variance</th>
                      <th class="p-4">Notes / Remarks</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-ortho-navy/5 font-medium">
                    @for (line of activeCountSession().lines; track line.id) {
                      <tr class="hover:bg-ortho-navy/[0.01] transition">
                        <td class="p-4 font-mono text-xs text-ortho-navy/70">{{ line.stockItem.sku }}</td>
                        <td class="p-4 text-ortho-navy font-bold">{{ line.stockItem.name }}</td>
                        <td class="p-4 text-center font-mono text-ortho-navy/60">{{ line.theoreticalQuantity }}</td>
                        <td class="p-4 text-center">
                          <input type="number" [(ngModel)]="physicalCountsMap[line.stockItem.id].physicalQuantity" min="0" step="any" class="w-full px-2.5 py-1.5 border border-ortho-navy/10 rounded-lg text-center font-mono text-xs focus:outline-none focus:border-ortho-navy bg-white" />
                        </td>
                        <td class="p-4 text-center font-mono">
                          @let qVar = calculateLineVariance(line.theoreticalQuantity, line.stockItem.id);
                          <span class="px-2 py-0.5 rounded text-xs font-bold" [ngClass]="qVar > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : qVar < 0 ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-gray-50 text-gray-400 border border-gray-100'">
                            {{ qVar > 0 ? '+' : '' }}{{ qVar }}
                          </span>
                        </td>
                        <td class="p-4 text-right text-ortho-navy/60">{{ line.stockItem.purchasePrice | number:'1.2-2' }} DH</td>
                        <td class="p-4 text-right font-bold font-mono">
                          @let cVar = calculateLineCostVariance(line.theoreticalQuantity, line.stockItem.purchasePrice, line.stockItem.id);
                          <span [ngClass]="cVar > 0 ? 'text-emerald-600' : cVar < 0 ? 'text-red-500' : 'text-ortho-navy/40'">
                            {{ cVar > 0 ? '+' : '' }}{{ cVar | number:'1.2-2' }} DH
                          </span>
                        </td>
                        <td class="p-4">
                          <input type="text" [(ngModel)]="physicalCountsMap[line.stockItem.id].notes" placeholder="Reason for variance..." class="w-full px-2 py-1 border border-ortho-navy/10 rounded text-xs bg-white" />
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Cumulative Impact Bar -->
              <div class="p-4 bg-gray-50 border-t border-ortho-navy/5 flex items-center justify-between font-bold text-xs text-ortho-navy uppercase tracking-wider">
                <span>Running Session Variance Summaries</span>
                <div class="flex items-center gap-6 font-mono normal-case">
                  <div>
                    <span class="text-ortho-navy/40 uppercase text-[10px] tracking-wide block">Total Quantity Variance</span>
                    <span class="text-sm font-extrabold" [ngClass]="getRunningVarianceSum().qty > 0 ? 'text-emerald-600' : getRunningVarianceSum().qty < 0 ? 'text-red-500' : 'text-ortho-navy'">
                      {{ getRunningVarianceSum().qty > 0 ? '+' : '' }}{{ getRunningVarianceSum().qty }}
                    </span>
                  </div>
                  <div>
                    <span class="text-ortho-navy/40 uppercase text-[10px] tracking-wide block">Financial Cost Impact</span>
                    <span class="text-sm font-extrabold" [ngClass]="getRunningVarianceSum().cost > 0 ? 'text-emerald-600' : getRunningVarianceSum().cost < 0 ? 'text-red-500' : 'text-ortho-navy'">
                      {{ getRunningVarianceSum().cost > 0 ? '+' : '' }}{{ getRunningVarianceSum().cost | number:'1.2-2' }} DH
                    </span>
                  </div>
                </div>
              </div>
            </div>

          @} @else {
            
            <!-- Create Count Session (BR08 counting session setup) -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <!-- Setup session card -->
              <div class="bg-white p-6 rounded-2xl border border-ortho-navy/5 shadow-sm space-y-4">
                <div>
                  <h3 class="text-lg font-bold text-ortho-navy">New Counting Session</h3>
                  <p class="text-xs text-ortho-navy/40">Freezes active theoretical quantities and starts physical inventory entry.</p>
                </div>

                <div class="space-y-2">
                  <label class="block text-[10px] font-bold text-ortho-navy/60 uppercase">Session Notes / Instructions</label>
                  <textarea [(ngModel)]="reconciliationNotes" placeholder="e.g. Q2 Physical count & shrinkage reconciliation..." rows="3" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-xs bg-white focus:outline-none focus:border-ortho-navy transition"></textarea>
                </div>

                <button (click)="startCountSession()" class="w-full py-2.5 bg-ortho-navy text-white hover:bg-ortho-navy/90 font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                  Freeze Stock & Start Counting
                </button>
              </div>

              <!-- Past Sessions List -->
              <div class="lg:col-span-2 bg-white rounded-2xl border border-ortho-navy/5 shadow-sm overflow-hidden flex flex-col">
                <div class="p-4 border-b border-ortho-navy/5 bg-ortho-navy/[0.01]">
                  <h3 class="text-base font-bold text-ortho-navy">Reconciliation Session History</h3>
                  <p class="text-xs text-ortho-navy/40">View past counting logs, physical audit histories, and accounting posting details.</p>
                </div>

                <div class="overflow-x-auto flex-1">
                  <table class="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr class="bg-ortho-navy/[0.02] text-ortho-navy/60 font-semibold border-b border-ortho-navy/5">
                        <th class="p-4">Session ID</th>
                        <th class="p-4">Status</th>
                        <th class="p-4">Frozen Date</th>
                        <th class="p-4 text-center">Qty Variance</th>
                        <th class="p-4 text-right">Cost Variance</th>
                        <th class="p-4">Validated By</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-ortho-navy/5 font-semibold">
                      @for (sess of countSessions(); track sess.id) {
                        <tr class="hover:bg-ortho-navy/[0.01] transition text-xs font-semibold">
                          <td class="p-4 font-mono text-ortho-navy">{{ sess.sessionNumber || sess.id.substring(0,8) }}</td>
                          <td class="p-4">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold border" [ngClass]="sess.status === 'VALIDATED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'">
                              {{ sess.status }}
                            </span>
                          </td>
                          <td class="p-4 text-ortho-navy/60">{{ sess.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
                          <td class="p-4 text-center font-mono" [ngClass]="sess.totalQuantityVariance > 0 ? 'text-emerald-600' : sess.totalQuantityVariance < 0 ? 'text-red-500' : 'text-ortho-navy/40'">
                            {{ sess.totalQuantityVariance > 0 ? '+' : '' }}{{ sess.totalQuantityVariance || 0 }}
                          </td>
                          <td class="p-4 text-right font-bold font-mono" [ngClass]="sess.totalCostVariance > 0 ? 'text-emerald-600' : sess.totalCostVariance < 0 ? 'text-red-500' : 'text-ortho-navy/40'">
                            {{ sess.totalCostVariance > 0 ? '+' : '' }}{{ (sess.totalCostVariance || 0) | number:'1.2-2' }} DH
                          </td>
                          <td class="p-4 text-ortho-navy/60">{{ sess.validatedBy || '-' }}</td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="6" class="p-8 text-center text-ortho-navy/40">No physical count sessions found.</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          }

        </div>

      }

      <!-- Add/Edit Stock Item Modal -->
      @if (showItemModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ortho-navy/60 backdrop-blur-sm">
          <div class="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-ortho-navy/5 shadow-2xl animate-fade-in">
            <div class="px-6 py-4 border-b border-ortho-navy/5 flex items-center justify-between bg-ortho-navy/[0.01]">
              <h3 class="text-lg font-bold text-ortho-navy">{{ editMode() ? 'Edit Stock Item' : 'Add Stock Item' }}</h3>
              <button (click)="closeItemModal()" class="p-1 text-ortho-navy/40 hover:text-ortho-navy hover:bg-ortho-navy/5 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form (submit)="saveItem()" class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Item Name *</label>
                  <input type="text" [(ngModel)]="itemForm.name" name="name" required class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">SKU Code *</label>
                  <input type="text" [(ngModel)]="itemForm.sku" name="sku" required class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition font-mono uppercase bg-white" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Category *</label>
                  <select [(ngModel)]="itemForm.category" name="category" required class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white">
                    @for (cat of stockCategoriesNoAll; track cat.value) {
                      <option [value]="cat.value">{{ cat.label }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Supplier *</label>
                  <select [(ngModel)]="selectedSupplierId" name="supplierId" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white">
                    <option [value]="null">No Supplier</option>
                    @for (sup of suppliers(); track sup.id) {
                      <option [value]="sup.id">{{ sup.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Current Stock *</label>
                  <input type="number" [(ngModel)]="itemForm.currentStock" name="currentStock" required min="0" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Minimum Alert Qty *</label>
                  <input type="number" [(ngModel)]="itemForm.minimumStock" name="minimumStock" required min="0" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Bulk Purchase Price (DH) *</label>
                  <input type="number" step="0.01" [(ngModel)]="itemForm.purchasePrice" name="purchasePrice" required min="0" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Units per Pack Size *</label>
                  <input type="number" [(ngModel)]="itemForm.unitSize" name="unitSize" required min="1" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Unit of Measurement (UOM) *</label>
                  <select [(ngModel)]="itemForm.unit" name="unit" required class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white">
                    <option value="Unit(s)">Unit(s)</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="Box">Box</option>
                    <option value="Pack">Pack</option>
                  </select>
                </div>
                <div class="flex items-center pt-5">
                  <label class="flex items-center gap-2 text-xs font-bold text-ortho-navy/60 uppercase tracking-wide cursor-pointer select-none">
                    <input type="checkbox" [(ngModel)]="itemForm.decimalSupported" name="decimalSupported" class="w-4 h-4 rounded border-gray-300 text-ortho-navy focus:ring-ortho-navy" />
                    Decimal Qty Support
                  </label>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Cabinet Storage Location</label>
                  <input type="text" [(ngModel)]="itemForm.location" placeholder="e.g. Cabinet A, Cabinet B" name="location" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Batch Number</label>
                  <input type="text" [(ngModel)]="itemForm.batchNumber" name="batchNumber" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" />
                </div>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-ortho-navy/5">
                <button type="button" (click)="closeItemModal()" class="px-4 py-2 border border-ortho-navy/10 rounded-xl text-sm font-semibold hover:bg-gray-50 transition text-ortho-navy/70">Cancel</button>
                <button type="submit" class="px-5 py-2 bg-ortho-navy text-white rounded-xl text-sm font-semibold hover:bg-ortho-navy/90 transition shadow-sm">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Manual Stock Adjustment Modal -->
      @if (showAdjustmentModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ortho-navy/60 backdrop-blur-sm">
          <div class="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-ortho-navy/5 shadow-2xl animate-fade-in">
            <div class="px-6 py-4 border-b border-ortho-navy/5 flex items-center justify-between bg-ortho-navy/[0.01]">
              <h3 class="text-lg font-bold text-ortho-navy">Stock Adjustment</h3>
              <button (click)="closeAdjustmentModal()" class="p-1 text-ortho-navy/40 hover:text-ortho-navy hover:bg-ortho-navy/5 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form (submit)="saveAdjustment()" class="p-6 space-y-4">
              <div>
                <span class="text-xs text-ortho-navy/40 font-bold block mb-1 uppercase tracking-wider">Stock Item</span>
                <span class="font-bold text-ortho-navy block text-base">{{ selectedItem()?.name }}</span>
                <span class="text-xs text-ortho-navy/60 block font-medium">Current Stock: {{ selectedItem()?.currentStock }} {{ selectedItem()?.unit || 'units' }}</span>
              </div>
              
              <div>
                <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Adjustment Delta (Positive to add, Negative to deduct) *</label>
                <input type="number" [(ngModel)]="adjustmentQty" name="adjustmentQty" required class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" placeholder="e.g. 10 or -5" />
              </div>

              <div>
                <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Reason for adjustment *</label>
                <textarea [(ngModel)]="adjustmentReason" required rows="3" name="reason" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white placeholder-ortho-navy/30" placeholder="e.g. Correcting inventory count discrepancies, manual correction..."></textarea>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-ortho-navy/5">
                <button type="button" (click)="closeAdjustmentModal()" class="px-4 py-2 border border-ortho-navy/10 rounded-xl text-sm font-semibold hover:bg-gray-50 transition text-ortho-navy/70">Cancel</button>
                <button type="submit" class="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm">Confirm Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Add/Edit Supplier Modal -->
      @if (showSupplierModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ortho-navy/60 backdrop-blur-sm">
          <div class="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-ortho-navy/5 shadow-2xl animate-fade-in">
            <div class="px-6 py-4 border-b border-ortho-navy/5 flex items-center justify-between bg-ortho-navy/[0.01]">
              <h3 class="text-lg font-bold text-ortho-navy">{{ editSupplierMode() ? 'Edit Supplier' : 'Register Supplier' }}</h3>
              <button (click)="closeSupplierModal()" class="p-1 text-ortho-navy/40 hover:text-ortho-navy hover:bg-ortho-navy/5 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form (submit)="saveSupplier()" class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Company Name *</label>
                <input type="text" [(ngModel)]="supplierForm.name" name="name" required class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" />
              </div>

              <div>
                <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Contact Name</label>
                <input type="text" [(ngModel)]="supplierForm.contactName" name="contactName" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Email</label>
                  <input type="email" [(ngModel)]="supplierForm.email" name="email" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Phone Number</label>
                  <input type="text" [(ngModel)]="supplierForm.phone" name="phone" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-ortho-navy/60 uppercase tracking-wide mb-1">Corporate Address</label>
                <textarea [(ngModel)]="supplierForm.address" name="address" rows="2" class="w-full px-3 py-2 border border-ortho-navy/10 rounded-xl text-sm focus:outline-none focus:border-ortho-navy transition bg-white"></textarea>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-ortho-navy/5">
                <button type="button" (click)="closeSupplierModal()" class="px-4 py-2 border border-ortho-navy/10 rounded-xl text-sm font-semibold hover:bg-gray-50 transition text-ortho-navy/70">Cancel</button>
                <button type="submit" class="px-5 py-2 bg-ortho-navy text-white rounded-xl text-sm font-semibold hover:bg-ortho-navy/90 transition shadow-sm">Save Supplier</button>
              </div>
            </form>
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
export class StockDashboardComponent implements OnInit, OnDestroy {
  private stockService = inject(StockService);

  readonly activeTab = signal<'catalog' | 'movements' | 'suppliers' | 'reconciliation'>('catalog');

  // Data Signals
  readonly items = signal<StockItem[]>([]);
  readonly movements = signal<StockMovement[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly countSessions = signal<any[]>([]);
  readonly activeCountSession = signal<any | null>(null);
  physicalCountsMap: { [itemId: string]: { physicalQuantity: number; notes: string } } = {};
  reconciliationNotes = '';

  // ── Catalog tab sort/filter state ─────────────────────────────────────────
  readonly catalogSortBy = signal<string>('name');
  readonly catalogSortDir = signal<'ASC' | 'DESC'>('ASC');
  readonly catalogCategory = signal<string>('ALL');
  /** Raw input value, not debounced — bound via (ngModelChange) */
  catalogSearchValue = '';
  private readonly catalogSearch$ = new Subject<string>();

  // ── Movements tab sort/filter state ───────────────────────────────────────
  readonly movSortBy = signal<string>('createdAt');
  readonly movSortDir = signal<'ASC' | 'DESC'>('DESC');
  readonly movType = signal<string>('ALL');
  movSearchValue = '';
  private readonly movSearch$ = new Subject<string>();

  // ── Constant option lists (driven by backend enum values) ─────────────────
  readonly stockCategories = STOCK_CATEGORIES;
  /** Same as stockCategories but without the 'ALL' entry — for the item form modal. */
  readonly stockCategoriesNoAll = STOCK_CATEGORIES.filter(c => c.value !== 'ALL');
  readonly movementTypes = MOVEMENT_TYPES;

  // ── Destroy notifier ──────────────────────────────────────────────────────
  private readonly destroy$ = new Subject<void>();

  // Modal controls
  readonly showItemModal = signal(false);
  readonly editMode = signal(false);
  itemForm: Partial<StockItem> = {};
  selectedSupplierId: string | null = null;

  // Manual Adjustment Modal
  readonly showAdjustmentModal = signal(false);
  readonly selectedItem = signal<StockItem | null>(null);
  adjustmentQty = 0;
  adjustmentReason = '';

  // Supplier Modal controls
  readonly showSupplierModal = signal(false);
  readonly editSupplierMode = signal(false);
  supplierForm: Partial<Supplier> = {};

  // Computed KPIs
  readonly kpiTotalItems = computed(() => this.items().length);
  readonly kpiOutOfStock = computed(() => this.items().filter(i => i.currentStock === 0).length);
  readonly kpiLowStock = computed(() => this.items().filter(i => i.currentStock > 0 && i.currentStock <= i.minimumStock).length);
  readonly kpiValuation = computed(() =>
    this.items().reduce((acc, curr) => acc + (curr.currentStock * curr.purchasePrice), 0)
  );



  ngOnInit() {
    // Wire debounced search for catalog
    this.catalogSearch$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(q => {
        this.catalogSearchValue = q;
        this.reloadCatalog();
      });

    // Wire debounced search for movements
    this.movSearch$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(q => {
        this.movSearchValue = q;
        this.reloadMovements();
      });

    this.loadAllData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData() {
    this.reloadCatalog();
    this.reloadMovements();
    this.stockService.getSuppliers().subscribe(data => this.suppliers.set(data));
    this.loadReconciliationData();
  }

  /** Fetches stock items using current catalog sort/filter signals. */
  private reloadCatalog() {
    this.stockService.getStockItems({
      search: this.catalogSearchValue.trim() || undefined,
      category: this.catalogCategory() !== 'ALL' ? this.catalogCategory() : undefined,
      sortBy: this.catalogSortBy(),
      sortDir: this.catalogSortDir(),
    }).subscribe(data => this.items.set(data));
  }

  /** Fetches movements using current movements sort/filter signals. */
  private reloadMovements() {
    this.stockService.getAllMovements({
      search: this.movSearchValue.trim() || undefined,
      movementType: this.movType() !== 'ALL' ? this.movType() : undefined,
      sortBy: this.movSortBy(),
      sortDir: this.movSortDir(),
    }).subscribe(data => this.movements.set(data));
  }

  // ── Sort helpers ───────────────────────────────────────────────────────────

  /**
   * Toggle sort on the Catalog table.
   * Clicking the same column flips direction; clicking a new column resets to ASC.
   */
  sortCatalog(column: string) {
    if (this.catalogSortBy() === column) {
      this.catalogSortDir.set(this.catalogSortDir() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.catalogSortBy.set(column);
      this.catalogSortDir.set('ASC');
    }
    this.reloadCatalog();
  }

  /** Toggle sort on the Movements audit ledger. */
  sortMovements(column: string) {
    if (this.movSortBy() === column) {
      this.movSortDir.set(this.movSortDir() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.movSortBy.set(column);
      this.movSortDir.set('ASC');
    }
    this.reloadMovements();
  }

  /**
   * Returns the sort icon character for a given table + column.
   * Active column shows solid arrow; inactive shows neutral double-arrow.
   */
  getSortIcon(table: 'catalog' | 'mov', column: string): string {
    const activeCol = table === 'catalog' ? this.catalogSortBy() : this.movSortBy();
    const activeDir = table === 'catalog' ? this.catalogSortDir() : this.movSortDir();
    if (activeCol !== column) return '↕';
    return activeDir === 'ASC' ? '↑' : '↓';
  }

  // ── Search & filter change handlers ───────────────────────────────────────

  onCatalogSearchChange(value: string) {
    this.catalogSearchValue = value;
    this.catalogSearch$.next(value);
  }

  onCatalogCategoryChange(value: string) {
    this.catalogCategory.set(value);
    this.reloadCatalog();
  }

  onMovSearchChange(value: string) {
    this.movSearchValue = value;
    this.movSearch$.next(value);
  }

  onMovTypeChange(value: string) {
    this.movType.set(value);
    this.reloadMovements();
  }

  loadReconciliationData() {
    this.stockService.getCountSessions().subscribe(data => {
      const sorted = (data || []).sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
      this.countSessions.set(sorted);

      const active = sorted.find(s => s.status === 'OPEN' || s.status === 'IN_PROGRESS');
      if (active) {
        this.activeCountSession.set(active);
        this.physicalCountsMap = {};
        if (active.lines) {
          active.lines.forEach((l: any) => {
            this.physicalCountsMap[l.stockItem.id] = {
              physicalQuantity: l.physicalQuantity !== undefined && l.physicalQuantity !== null ? l.physicalQuantity : l.theoreticalQuantity,
              notes: l.notes || ''
            };
          });
        }
      } else {
        this.activeCountSession.set(null);
        this.physicalCountsMap = {};
      }
    });
  }

  startCountSession() {
    this.stockService.createCountSession(this.reconciliationNotes).subscribe(() => {
      this.reconciliationNotes = '';
      this.loadReconciliationData();
    });
  }

  saveDraftCounts() {
    const session = this.activeCountSession();
    if (!session) return;

    const payload = Object.keys(this.physicalCountsMap).map(itemId => ({
      stockItemId: itemId,
      physicalQuantity: this.physicalCountsMap[itemId].physicalQuantity,
      notes: this.physicalCountsMap[itemId].notes
    }));

    this.stockService.updateCountSessionLines(session.id, payload).subscribe(() => {
      alert('Draft counts saved successfully!');
      this.loadReconciliationData();
    });
  }

  postReconciliation() {
    const session = this.activeCountSession();
    if (!session) return;

    if (!confirm('Are you sure you want to validate and POST these physical counts? This will adjust your inventory balances immediately.')) {
      return;
    }

    const payload = Object.keys(this.physicalCountsMap).map(itemId => ({
      stockItemId: itemId,
      physicalQuantity: this.physicalCountsMap[itemId].physicalQuantity,
      notes: this.physicalCountsMap[itemId].notes
    }));

    this.stockService.updateCountSessionLines(session.id, payload).subscribe(() => {
      this.stockService.validateCountSession(session.id, 'Admin User').subscribe(() => {
        alert('Physical count reconciliation validated and posted successfully! Stock balances updated.');
        this.loadAllData();
      });
    });
  }

  cancelReconciliation() {
    const session = this.activeCountSession();
    if (!session) return;

    if (confirm('Are you sure you want to cancel this physical count session? All entered counts will be lost.')) {
      this.stockService.cancelCountSession(session.id).subscribe(() => {
        this.loadReconciliationData();
      });
    }
  }

  calculateLineVariance(theoretical: number, itemId: string): number {
    const entry = this.physicalCountsMap[itemId];
    if (!entry) return 0;
    return entry.physicalQuantity - theoretical;
  }

  calculateLineCostVariance(theoretical: number, purchasePrice: number, itemId: string): number {
    const qtyVar = this.calculateLineVariance(theoretical, itemId);
    return qtyVar * purchasePrice;
  }

  getRunningVarianceSum(): { qty: number; cost: number } {
    let qty = 0;
    let cost = 0;
    const session = this.activeCountSession();
    if (session && session.lines) {
      session.lines.forEach((l: any) => {
        const lineQtyVar = this.calculateLineVariance(l.theoreticalQuantity, l.stockItem.id);
        const lineCostVar = lineQtyVar * l.stockItem.purchasePrice;
        qty += lineQtyVar;
        cost += lineCostVar;
      });
    }
    return { qty, cost };
  }

  // --- Stock Item Operations ---

  openAddModal() {
    this.editMode.set(false);
    this.selectedSupplierId = null;
    this.itemForm = {
      name: '',
      sku: '',
      category: 'CONSUMABLES',
      unit: 'Unit(s)',
      unitLabel: 'Unit(s)',
      decimalSupported: false,
      currentStock: 0,
      minimumStock: 5,
      purchasePrice: 0,
      unitSize: 1,
      location: '',
      batchNumber: ''
    };
    this.showItemModal.set(true);
  }

  openEditModal(item: StockItem) {
    this.editMode.set(true);
    this.selectedSupplierId = item.supplier?.id || null;
    this.itemForm = { ...item };
    this.showItemModal.set(true);
  }

  closeItemModal() {
    this.showItemModal.set(false);
  }

  saveItem() {
    if (!this.itemForm.name || !this.itemForm.sku || !this.itemForm.purchasePrice || !this.itemForm.unitSize) {
      return;
    }

    // Set unitLabel to match unit value
    if (this.itemForm.unit) {
      this.itemForm.unitLabel = this.itemForm.unit;
    }

    // Find and attach supplier if selected
    if (this.selectedSupplierId && this.selectedSupplierId !== 'null') {
      const sup = this.suppliers().find(s => s.id === this.selectedSupplierId);
      if (sup) {
        this.itemForm.supplier = sup;
      }
    } else {
      this.itemForm.supplier = undefined;
    }

    if (this.editMode()) {
      this.stockService.updateStockItem(this.itemForm.id!, this.itemForm).subscribe(() => {
        // Reload catalog preserving active sort/filter state
        this.reloadCatalog();
        this.closeItemModal();
      });
    } else {
      this.stockService.createStockItem(this.itemForm).subscribe(() => {
        this.reloadCatalog();
        this.closeItemModal();
      });
    }
  }

  deleteItem(item: StockItem) {
    if (confirm(`Are you sure you want to delete '${item.name}' from the catalog?`)) {
      this.stockService.deleteStockItem(item.id).subscribe(() => {
        // Reload catalog preserving active sort/filter state
        this.reloadCatalog();
      });
    }
  }

  // --- Manual Adjustment Operations ---

  openAdjustmentModal(item: StockItem) {
    this.selectedItem.set(item);
    this.adjustmentQty = 0;
    this.adjustmentReason = '';
    this.showAdjustmentModal.set(true);
  }

  closeAdjustmentModal() {
    this.showAdjustmentModal.set(false);
  }

  saveAdjustment() {
    const item = this.selectedItem();
    if (!item || this.adjustmentQty === 0 || !this.adjustmentReason.trim()) {
      return;
    }

    this.stockService.adjustStock(item.id, this.adjustmentQty, this.adjustmentReason).subscribe(() => {
      // Reload both catalog (updated stock level) and movements (new ledger entry)
      // while preserving the active sort/filter state on each table.
      this.reloadCatalog();
      this.reloadMovements();
      this.closeAdjustmentModal();
    });
  }

  // --- Supplier Operations ---

  openAddSupplierModal() {
    this.editSupplierMode.set(false);
    this.supplierForm = {
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: ''
    };
    this.showSupplierModal.set(true);
  }

  openEditSupplierModal(supplier: Supplier) {
    this.editSupplierMode.set(true);
    this.supplierForm = { ...supplier };
    this.showSupplierModal.set(true);
  }

  closeSupplierModal() {
    this.showSupplierModal.set(false);
  }

  saveSupplier() {
    if (!this.supplierForm.name) {
      return;
    }

    if (this.editSupplierMode()) {
      this.stockService.updateSupplier(this.supplierForm.id!, this.supplierForm).subscribe(() => {
        this.loadAllData();
        this.closeSupplierModal();
      });
    } else {
      this.stockService.createSupplier(this.supplierForm).subscribe(() => {
        this.loadAllData();
        this.closeSupplierModal();
      });
    }
  }

  deleteSupplier(supplier: Supplier) {
    if (confirm(`Are you sure you want to delete supplier '${supplier.name}'?`)) {
      this.stockService.deleteSupplier(supplier.id).subscribe(() => {
        this.loadAllData();
      });
    }
  }

  // --- Movement Log helpers ---

  isAddition(type: MovementType): boolean {
    return type === 'IN' || type === 'RETURN';
  }

  getMovementTypeClasses(type: MovementType): string {
    switch (type) {
      case 'IN':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'OUT':
        return 'bg-red-50 text-red-500 border-red-200';
      case 'ADJUSTMENT':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'RETURN':
        return 'bg-amber-50 text-amber-500 border-amber-200';
      case 'WRITE_OFF':
        return 'bg-gray-50 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  }
}
