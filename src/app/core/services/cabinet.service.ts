import { Injectable, signal, computed } from '@angular/core';

export interface CabinetInfo {
  name: string;
  logoUrl?: string; // base64 or local URL
  role?: 'doctor' | 'assistant';
  ice?: string;
  vat?: string;
  patente?: string;
  address?: string;
  rib?: string;
  tel?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CabinetService {
  private readonly STORAGE_KEY = 'orthoflow_cabinet_info';

  // Core cabinet info signal
  readonly cabinetInfo = signal<CabinetInfo | null>(this.loadCabinetInfo());

  // Computed helper to check if cabinet is onboarded (has at least a name)
  readonly isOnboarded = computed(() => {
    const info = this.cabinetInfo();
    return !!(info && info.name.trim().length > 0);
  });

  // Load from localStorage
  private loadCabinetInfo(): CabinetInfo | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Failed to load cabinet info from localStorage', e);
      return null;
    }
  }

  // Save to localStorage and update signal
  saveCabinetInfo(info: CabinetInfo): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(info));
      this.cabinetInfo.set(info);
    } catch (e) {
      console.error('Failed to save cabinet info to localStorage', e);
    }
  }

  // Clear cabinet info (for resets or testing)
  clearCabinetInfo(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.cabinetInfo.set(null);
    } catch (e) {
      console.error('Failed to clear cabinet info', e);
    }
  }
}
