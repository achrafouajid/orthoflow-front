import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PracticeSettings {
  workingHoursStart: number;
  workingHoursEnd: number;
}

const DEFAULT_SETTINGS: PracticeSettings = { workingHoursStart: 8, workingHoursEnd: 19 };

/**
 * The schedule's working hours used to be hardcoded (8 AM-7 PM) with no way
 * for a clinic to configure its own (audit VIII.6 / P2 #29). Backed by
 * GET/PUT /settings/practice; the signal defaults to the old hardcoded
 * values so the schedule still renders something sane before the first
 * response lands.
 */
@Injectable({ providedIn: 'root' })
export class PracticeSettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/settings/practice`;

  private settingsSignal = signal<PracticeSettings>(DEFAULT_SETTINGS);
  settings = this.settingsSignal.asReadonly();

  load() {
    return this.http.get<PracticeSettings>(this.apiUrl).pipe(
      tap(settings => this.settingsSignal.set(settings))
    );
  }

  update(settings: PracticeSettings) {
    return this.http.put<PracticeSettings>(this.apiUrl, settings).pipe(
      tap(saved => this.settingsSignal.set(saved))
    );
  }
}
