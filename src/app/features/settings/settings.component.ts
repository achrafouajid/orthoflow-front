import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';
import { CabinetService, CabinetInfo } from '../../core/services/cabinet.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight" translate>COMMON.SETTINGS</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure your personal workspace and localization options.</p>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="flex border-b border-slate-200 dark:border-slate-700">
        <button 
          (click)="activeTab.set('general')"
          [class]="tabClass(activeTab() === 'general')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          <span translate>COMMON.LOCALIZATION</span>
        </button>
        <button 
          (click)="activeTab.set('enterprise')"
          [class]="tabClass(activeTab() === 'enterprise')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          Cabinet &amp; Enterprise
        </button>
      </div>

      <!-- General Tab Content -->
      @if (activeTab() === 'general') {
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6 space-y-6">
          <div>
            <h2 class="text-xl font-bold text-slate-800 dark:text-white" translate>COMMON.LOCALIZATION</h2>
            <p class="text-xs text-slate-400 mt-0.5">Adjust the language and regional layout of the interface.</p>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3" translate>COMMON.LANGUAGE</label>
              <div class="flex flex-wrap gap-3">
                <button 
                  (click)="setLang('fr')"
                  [class]="btnClass(langService.currentLang() === 'fr')"
                >
                  Français
                </button>
                <button 
                  (click)="setLang('en')"
                  [class]="btnClass(langService.currentLang() === 'en')"
                >
                  English
                </button>
                <button 
                  (click)="setLang('ar')"
                  [class]="btnClass(langService.currentLang() === 'ar')"
                >
                  العربية
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Enterprise / Cabinet Tab Content -->
      @if (activeTab() === 'enterprise') {
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6 space-y-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-xl font-bold text-slate-800 dark:text-white">Cabinet Branding &amp; Corporate Identity</h2>
              <p class="text-xs text-slate-400 mt-0.5">Customize how your clinic is presented. These details automatically pre-fill patient invoices and receipts.</p>
            </div>
            
            @if (showSuccess()) {
              <div class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Changes Saved!
              </div>
            }
          </div>

          <form (ngSubmit)="saveEnterpriseSettings()" class="space-y-6">
            <!-- Part 1: Branding -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100 dark:border-slate-700/50">
              <!-- Cabinet Logo -->
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">Cabinet Logo</label>
                <div class="flex flex-col items-center p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                  <div class="relative group h-24 w-24 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shadow-sm mb-3">
                    @if (logoUrl()) {
                      <img [src]="logoUrl()" alt="Logo Preview" class="h-full w-full object-contain" />
                      <button 
                        (click)="removeLogo()" 
                        type="button"
                        class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    } @else {
                      <span class="text-xs text-slate-400 font-bold">No Logo</span>
                    }
                  </div>
                  
                  <label class="cursor-pointer px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all">
                    Browse Logo
                    <input 
                      type="file" 
                      accept="image/*" 
                      class="hidden" 
                      (change)="onFileSelected($event)" 
                    />
                  </label>
                </div>
              </div>

              <!-- Cabinet Name -->
              <div class="md:col-span-2 space-y-2">
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">Cabinet Name <span class="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  [(ngModel)]="cabinetName"
                  name="cabinetName"
                  required
                  placeholder="e.g. Jenkins Ortho Clinic"
                  class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 outline-none transition-all focus:border-ortho-teal focus:ring-4 focus:ring-ortho-teal/5 text-slate-900 dark:text-white" 
                />
                <p class="text-xs text-slate-400">Used as the core title branding in the application header and sidebar menu.</p>
              </div>
            </div>

            <!-- Part 2: Credentials -->
            <div class="space-y-4">
              <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">Enterprise Invoicing Credentials (Optional)</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- ICE -->
                <div class="space-y-2">
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">ICE (Morocco Corporate ID)</label>
                  <input 
                    type="text" 
                    [(ngModel)]="ice"
                    name="ice"
                    placeholder="0012345678900088"
                    class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none transition-all focus:border-ortho-teal focus:ring-4 focus:ring-ortho-teal/5 text-slate-900 dark:text-white font-mono" 
                  />
                </div>

                <!-- VAT -->
                <div class="space-y-2">
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">VAT / TVA</label>
                  <input 
                    type="text" 
                    [(ngModel)]="vat"
                    name="vat"
                    placeholder="MA-98765"
                    class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none transition-all focus:border-ortho-teal focus:ring-4 focus:ring-ortho-teal/5 text-slate-900 dark:text-white font-mono" 
                  />
                </div>

                <!-- Patente -->
                <div class="space-y-2">
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Patente (Tax ID)</label>
                  <input 
                    type="text" 
                    [(ngModel)]="patente"
                    name="patente"
                    placeholder="34567890"
                    class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none transition-all focus:border-ortho-teal focus:ring-4 focus:ring-ortho-teal/5 text-slate-900 dark:text-white font-mono" 
                  />
                </div>

                <!-- Tel -->
                <div class="space-y-2">
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Telephone</label>
                  <input 
                    type="tel" 
                    [(ngModel)]="tel"
                    name="tel"
                    placeholder="+212 522-000000"
                    class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none transition-all focus:border-ortho-teal focus:ring-4 focus:ring-ortho-teal/5 text-slate-900 dark:text-white" 
                  />
                </div>

                <!-- Address -->
                <div class="col-span-1 md:col-span-2 space-y-2">
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Address</label>
                  <textarea 
                    [(ngModel)]="address"
                    name="address"
                    rows="2"
                    placeholder="12, Boulevard Anfa, Casablanca, Morocco"
                    class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none transition-all focus:border-ortho-teal focus:ring-4 focus:ring-ortho-teal/5 text-slate-900 dark:text-white resize-none" 
                  ></textarea>
                </div>

                <!-- RIB -->
                <div class="col-span-1 md:col-span-2 space-y-2">
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">RIB (Bank Account Details)</label>
                  <input 
                    type="text" 
                    [(ngModel)]="rib"
                    name="rib"
                    placeholder="022 123 4567890123456789 01"
                    class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none transition-all focus:border-ortho-teal focus:ring-4 focus:ring-ortho-teal/5 text-slate-900 dark:text-white font-mono text-center" 
                  />
                </div>
              </div>
            </div>

            <!-- Form Submit -->
            <div class="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
              <button 
                type="submit" 
                [disabled]="!cabinetName.trim()"
                class="btn-primary flex items-center gap-2 px-6 py-3 font-semibold text-white bg-ortho-teal hover:bg-ortho-teal/90 disabled:opacity-50 disabled:pointer-events-none rounded-xl active:scale-95 duration-200 shimmer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Save Cabinet Details
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class SettingsComponent {
  public langService = inject(LanguageService);
  private cabinetService = inject(CabinetService);

  // Tabs state
  readonly activeTab = signal<'general' | 'enterprise'>('general');
  readonly showSuccess = signal<boolean>(false);

  // Form bindings
  cabinetName = '';
  logoUrl = signal<string>('');
  ice = '';
  vat = '';
  patente = '';
  address = '';
  tel = '';
  rib = '';

  constructor() {
    // Populate form fields based on current CabinetService state
    effect(() => {
      const info = this.cabinetService.cabinetInfo();
      if (info) {
        this.cabinetName = info.name || '';
        this.logoUrl.set(info.logoUrl || '');
        this.ice = info.ice || '';
        this.vat = info.vat || '';
        this.patente = info.patente || '';
        this.address = info.address || '';
        this.tel = info.tel || '';
        this.rib = info.rib || '';
      }
    }, { allowSignalWrites: true });
  }

  setLang(lang: string) {
    this.langService.setLanguage(lang);
  }

  tabClass(isActive: boolean): string {
    const base = "px-6 py-3 font-semibold text-sm border-b-2 -mb-[2px] transition-all duration-200 flex items-center ";
    return isActive 
      ? base + "border-ortho-teal text-ortho-teal"
      : base + "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white";
  }

  btnClass(isActive: boolean) {
    const base = "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ";
    return isActive 
      ? base + "bg-ortho-navy text-white border-ortho-navy shadow-md"
      : base + "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600";
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.logoUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(): void {
    this.logoUrl.set('');
  }

  saveEnterpriseSettings(): void {
    const updatedInfo: CabinetInfo = {
      name: this.cabinetName.trim(),
      logoUrl: this.logoUrl() || undefined,
      ice: this.ice.trim() || undefined,
      vat: this.vat.trim() || undefined,
      patente: this.patente.trim() || undefined,
      address: this.address.trim() || undefined,
      tel: this.tel.trim() || undefined,
      rib: this.rib.trim() || undefined
    };

    // Save to LocalStorage / Service State
    this.cabinetService.saveCabinetInfo(updatedInfo);

    // Show temporary success feedback
    this.showSuccess.set(true);
    setTimeout(() => {
      this.showSuccess.set(false);
    }, 3000);
  }
}
