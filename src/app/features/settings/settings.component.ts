import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6 text-slate-800 dark:text-white" translate>COMMON.SETTINGS</h1>
      
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 class="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200" translate>COMMON.LOCALIZATION</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2" translate>COMMON.LANGUAGE</label>
            <div class="flex gap-3">
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
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class SettingsComponent {
  constructor(public langService: LanguageService) {}

  setLang(lang: string) {
    this.langService.setLanguage(lang);
  }

  btnClass(isActive: boolean) {
    const base = "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ";
    return isActive 
      ? base + "bg-blue-600 text-white border-blue-600 shadow-md"
      : base + "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600";
  }
}
