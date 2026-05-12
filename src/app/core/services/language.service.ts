import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly LANG_KEY = 'orthoflow_lang';
  currentLang = signal<string>('fr');

  constructor(private translate: TranslateService) {
    const savedLang = localStorage.getItem(this.LANG_KEY);
    const browserLang = translate.getBrowserLang();
    const match = browserLang?.match(/fr|en|ar/);
    const initialLang = savedLang || (match ? match[0] : 'fr');
    
    this.setLanguage(initialLang);
  }

  setLanguage(lang: string) {
    this.translate.use(lang);
    this.currentLang.set(lang);
    localStorage.setItem(this.LANG_KEY, lang);
    this.updateDirection(lang);
  }

  private updateDirection(lang: string) {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }
}
