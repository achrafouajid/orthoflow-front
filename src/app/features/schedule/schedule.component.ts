import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ScheduleService } from '../../core/services/schedule.service';
import { PatientService } from '../../core/services/patient.service';
import { Appointment } from '../../core/models/patient.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

type CalendarView = 'day' | 'week' | 'month' | 'year';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="schedule-container" [class.rtl]="translate.currentLang === 'ar'">
      <header class="schedule-header">
        <div class="header-left">
          <h1>{{ 'SCHEDULE.TITLE' | translate }}</h1>
          <div class="view-switcher">
            <button [class.active]="view() === 'day'" (click)="view.set('day')">{{ 'SCHEDULE.DAY' | translate }}</button>
            <button [class.active]="view() === 'month'" (click)="view.set('month')">{{ 'SCHEDULE.MONTH' | translate }}</button>
            <button [class.active]="view() === 'year'" (click)="view.set('year')">{{ 'SCHEDULE.YEAR' | translate }}</button>
          </div>
        </div>

        <div class="header-right">
          <div class="date-nav">
            <button class="icon-btn" (click)="navigate(-1)">
              <span class="material-icons">chevron_left</span>
            </button>
            <span class="current-date">{{ formattedCurrentDate() }}</span>
            <button class="icon-btn" (click)="navigate(1)">
              <span class="material-icons">chevron_right</span>
            </button>
            <button class="btn-ghost" (click)="goToToday()">{{ 'SCHEDULE.TODAY' | translate }}</button>
          </div>
          <div class="filters">
            <div class="search-box">
              <span class="material-icons">search</span>
              <input type="text" [placeholder]="'SCHEDULE.FILTER_PLACEHOLDER' | translate" (input)="onPatientFilter($event)" />
            </div>
            <button class="btn-primary" (click)="openAddModal()">
              <span class="material-icons">add</span>
              {{ 'SCHEDULE.NEW_APPOINTMENT' | translate }}
            </button>
          </div>
        </div>
      </header>

      <main class="calendar-body">
        @switch (view()) {
          @case ('month') {
            <div class="month-view">
              <div class="weekday-header">
                @for (day of weekdays; track day) {
                  <div class="weekday">{{ 'SCHEDULE.WEEKDAYS.' + day | translate }}</div>
                }
              </div>
              <div class="calendar-grid">
                @for (day of calendarDays(); track day.date.toISOString()) {
                  <div 
                    class="calendar-day" 
                    [class.other-month]="!day.isCurrentMonth"
                    [class.today]="day.isToday"
                    (click)="openAddModal(day.date)"
                  >
                    <span class="day-number">{{ day.date.getDate() }}</span>
                    <div class="day-events">
                      @for (event of day.events; track event.id) {
                        <div class="event-pill" [class]="event.type.toLowerCase()" (click)="openEditModal(event); $event.stopPropagation()">
                          <span class="event-time">{{ formatTime(event.dateTime) }}</span>
                          <span class="event-patient">{{ getPatientName(event.patientId) }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
          @case ('day') {
            <div class="day-view">
              <div class="time-column">
                @for (hour of hours; track hour) {
                  <div class="time-slot">{{ hour }}:00</div>
                }
              </div>
              <div class="events-column">
                @for (hour of hours; track hour) {
                  <div class="hour-row" (click)="openAddModalWithTime(hour)"></div>
                }
                @for (event of dayEvents(); track event.id) {
                  <div 
                    class="day-event-card" 
                    [style.top.px]="getEventTop(event)"
                    [style.height.px]="60"
                    [class]="event.type.toLowerCase()"
                    (click)="openEditModal(event)"
                  >
                    <div class="card-time">{{ formatTime(event.dateTime) }}</div>
                    <div class="card-content">
                      <span class="patient">{{ getPatientName(event.patientId) }}</span>
                      <span class="type">{{ 'SCHEDULE.TYPES.' + event.type.toUpperCase() | translate }}</span>
                      @if (event.notes) {
                        <p class="notes">{{ event.notes }}</p>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
          @case ('year') {
             <div class="year-view">
                @for (month of yearMonths; track month.index) {
                  <div class="year-month-card">
                    <h3>{{ month.date | date:'MMMM':undefined:translate.currentLang }}</h3>
                    <div class="mini-grid">
                      @for (d of month.days; track d) {
                        <div class="mini-day" [class.has-event]="monthHasEvent(month.index, d)">
                          {{ d }}
                        </div>
                      }
                    </div>
                  </div>
                }
             </div>
          }
        }
      </main>

      <!-- Appointment Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <header class="modal-header">
              <h2>{{ (editingAppointment() ? 'SCHEDULE.FORM.TITLE_EDIT' : 'SCHEDULE.FORM.TITLE_ADD') | translate }}</h2>
              <button class="icon-btn" (click)="closeModal()">
                <span class="material-icons">close</span>
              </button>
            </header>
            
            <form [formGroup]="appointmentForm" (ngSubmit)="saveAppointment()">
              <div class="form-group">
                <label>{{ 'SCHEDULE.FORM.PATIENT' | translate }}</label>
                <select formControlName="patientId">
                  <option value="">{{ 'SCHEDULE.FORM.SELECT_PATIENT' | translate }}</option>
                  @for (p of patientService.patients(); track p.id) {
                    <option [value]="p.id">{{ p.firstName }} {{ p.lastName }}</option>
                  }
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>{{ 'SCHEDULE.FORM.DATE_TIME' | translate }}</label>
                  <input type="datetime-local" formControlName="dateTime">
                </div>
                <div class="form-group">
                  <label>{{ 'SCHEDULE.FORM.TYPE' | translate }}</label>
                  <select formControlName="type">
                    @for (type of appointmentTypes; track type) {
                      <option [value]="type">{{ 'SCHEDULE.TYPES.' + type.toUpperCase() | translate }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>{{ 'SCHEDULE.FORM.STATUS' | translate }}</label>
                  <select formControlName="status">
                    @for (status of appointmentStatuses; track status) {
                      <option [value]="status">{{ 'SCHEDULE.STATUS.' + status.toUpperCase() | translate }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>{{ 'SCHEDULE.FORM.APPLIANCE_STEP' | translate }}</label>
                  <input type="number" formControlName="applianceStep">
                </div>
              </div>

              <div class="form-group">
                <label>{{ 'SCHEDULE.FORM.NOTES' | translate }}</label>
                <textarea formControlName="notes" rows="3"></textarea>
              </div>

              <footer class="modal-footer">
                @if (editingAppointment()) {
                  <button type="button" class="btn-danger" (click)="deleteAppointment()">
                    <span class="material-icons">delete</span>
                    {{ 'COMMON.DELETE' | translate }}
                  </button>
                }
                <div class="footer-right">
                  <button type="button" class="btn-ghost" (click)="closeModal()">{{ 'COMMON.CANCEL' | translate }}</button>
                  <button type="submit" class="btn-primary" [disabled]="appointmentForm.invalid">
                    {{ 'COMMON.SAVE' | translate }}
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .schedule-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 120px);
      background: white;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      overflow: hidden;
      position: relative;
    }

    .rtl { direction: rtl; }

    .schedule-header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
    }

    .header-left h1 {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
    }

    .view-switcher {
      display: flex;
      background: #f1f5f9;
      padding: 0.25rem;
      border-radius: 10px;
    }

    .view-switcher button {
      border: none;
      background: transparent;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .view-switcher button.active {
      background: white;
      color: var(--primary);
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 1rem;
    }

    .date-nav {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .current-date {
      font-weight: 700;
      font-size: 1.1rem;
      min-width: 150px;
      text-align: center;
    }

    .filters {
      display: flex;
      gap: 1rem;
    }

    .search-box {
      position: relative;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      display: flex;
      align-items: center;
      padding: 0 0.75rem;
    }

    .search-box input {
      border: none;
      background: transparent;
      padding: 0.5rem;
      outline: none;
      font-size: 0.9rem;
    }

    .search-box .material-icons { font-size: 1.2rem; color: #94a3b8; }

    .calendar-body {
      flex: 1;
      overflow: auto;
    }

    /* Month View */
    .month-view {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .weekday-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: #f8fafc;
      border-bottom: 1px solid var(--border-color);
    }

    .weekday {
      padding: 0.75rem;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      grid-auto-rows: 1fr;
      flex: 1;
    }

    .calendar-day {
      border-right: 1px solid #f1f5f9;
      border-bottom: 1px solid #f1f5f9;
      padding: 0.5rem;
      min-height: 120px;
      transition: background 0.2s;
      cursor: pointer;
    }

    .calendar-day:hover { background: #fdfdfd; }
    .calendar-day.other-month { background: #fafafa; opacity: 0.5; }
    .calendar-day.today { background: #f5f3ff; }
    .calendar-day.today .day-number {
      background: var(--primary);
      color: white;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
    }

    .day-number {
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 0.5rem;
      display: inline-block;
    }

    .day-events {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .event-pill {
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      gap: 0.25rem;
      font-weight: 600;
      transition: transform 0.1s;
    }
    .event-pill:hover { transform: scale(1.02); }

    .event-pill.checkup { background: #e0e7ff; color: #4338ca; }
    .event-pill.initial { background: #dcfce7; color: #166534; }
    .event-pill.emergency { background: #fee2e2; color: #b91c1c; }
    .event-pill.consultation { background: #fef9c3; color: #854d0e; }
    .event-pill.braces_fit { background: #fae8ff; color: #86198f; }
    .event-pill.aligner_fit { background: #f1f5f9; color: #334155; }
    .event-pill.retainer { background: #dcfce7; color: #15803d; }

    /* Day View */
    .day-view {
      display: flex;
      height: 100%;
    }

    .time-column {
      width: 80px;
      border-right: 1px solid var(--border-color);
      background: #f8fafc;
    }

    .time-slot {
      height: 60px;
      padding: 0.5rem;
      font-size: 0.75rem;
      color: #94a3b8;
      text-align: right;
    }

    .events-column {
      flex: 1;
      position: relative;
      background: white;
    }

    .hour-row {
      height: 60px;
      border-bottom: 1px solid #f1f5f9;
      cursor: cell;
    }
    .hour-row:hover { background: #f8fafc; }

    .day-event-card {
      position: absolute;
      left: 10px;
      right: 10px;
      background: white;
      border-left: 4px solid var(--primary);
      border-radius: 8px;
      padding: 0.5rem 1rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      display: flex;
      gap: 1rem;
      z-index: 1;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .day-event-card:hover { transform: translateY(-2px); }

    .day-event-card.checkup { border-left-color: #4f46e5; background: #f5f3ff; }
    .day-event-card.emergency { border-left-color: #ef4444; background: #fef2f2; }

    .card-time { font-weight: 700; color: #4f46e5; font-size: 0.9rem; }
    .card-content .patient { display: block; font-weight: 700; color: #1e293b; }
    .card-content .type { font-size: 0.75rem; color: #64748b; }
    .card-content .notes { font-size: 0.75rem; color: #94a3b8; margin: 0.25rem 0 0 0; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      width: 100%;
      max-width: 500px;
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .modal-header h2 { margin: 0; font-size: 1.25rem; }

    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; color: #64748b; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      outline: none;
      font-size: 0.95rem;
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .footer-right { display: flex; gap: 1rem; }

    .btn-danger {
      background: #fee2e2;
      color: #b91c1c;
      border: none;
      padding: 0.6rem 1rem;
      border-radius: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    /* Year View */
    .year-view {
      padding: 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 2rem;
    }

    .year-month-card h3 { font-size: 1rem; margin-bottom: 1rem; }
    .mini-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }
    .mini-day {
      font-size: 0.6rem;
      padding: 2px;
      text-align: center;
      color: #94a3b8;
    }
    .mini-day.has-event {
      background: var(--primary);
      color: white;
      border-radius: 2px;
    }

    /* Buttons */
    .btn-primary {
      background: var(--primary);
      color: white;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .icon-btn {
      background: #f1f5f9;
      border: none;
      padding: 0.4rem;
      border-radius: 8px;
      cursor: pointer;
      color: #64748b;
    }

    .btn-ghost {
      background: transparent;
      border: 1px solid var(--border-color);
      padding: 0.5rem 1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .schedule-header {
        flex-direction: column;
        padding: 1rem;
      }
      .header-right {
        align-items: center;
        width: 100%;
      }
      .filters {
        width: 100%;
        flex-direction: column;
      }
      .search-box { width: 100%; }
      .btn-primary { width: 100%; justify-content: center; }
      .calendar-grid { grid-template-columns: repeat(1, 1fr); }
      .weekday-header { display: none; }
      .calendar-day { min-height: auto; }
    }
  `]
})
export class ScheduleComponent {
  scheduleService = inject(ScheduleService);
  patientService = inject(PatientService);
  translate = inject(TranslateService);
  fb = inject(FormBuilder);

  view = signal<CalendarView>('month');
  currentDate = signal(new Date());
  showModal = signal(false);
  editingAppointment = signal<Appointment | null>(null);

  appointmentForm: FormGroup;
  appointmentTypes = ['Checkup', 'Initial', 'Emergency', 'Consultation', 'Braces_Fit', 'Aligner_Fit', 'Retainer'];
  appointmentStatuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

  weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  constructor() {
    this.appointmentForm = this.fb.group({
      patientId: ['', Validators.required],
      dateTime: ['', Validators.required],
      type: ['Checkup', Validators.required],
      status: ['SCHEDULED', Validators.required],
      notes: [''],
      applianceStep: [null]
    });
  }

  yearMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), i, 1);
    const lastDay = new Date(new Date().getFullYear(), i + 1, 0).getDate();
    return {
      date: d,
      index: i,
      days: Array.from({ length: lastDay }, (_, k) => k + 1)
    };
  });

  calendarDays = computed(() => {
    const date = this.currentDate();
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const days = [];

    // Previous month filler
    const prevMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0);
    for (let i = start.getDay(); i > 0; i--) {
      days.push({
        date: new Date(date.getFullYear(), date.getMonth() - 1, prevMonthEnd.getDate() - i + 1),
        isCurrentMonth: false,
        isToday: false,
        events: []
      });
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= end.getDate(); i++) {
      const d = new Date(date.getFullYear(), date.getMonth(), i);
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: d.toDateString() === today.toDateString(),
        events: this.scheduleService.appointments().filter(app =>
          new Date(app.dateTime).toDateString() === d.toDateString()
        )
      });
    }

    return days;
  });

  dayEvents = computed(() => {
    return this.scheduleService.appointments().filter(app =>
      new Date(app.dateTime).toDateString() === this.currentDate().toDateString()
    );
  });

  formattedCurrentDate = computed(() => {
    const date = this.currentDate();
    const v = this.view();
    const locale = this.translate.currentLang || 'en';
    
    if (v === 'day') return date.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });
    if (v === 'month') return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    return date.getFullYear().toString();
  });

  navigate(dir: number) {
    const date = new Date(this.currentDate());
    const v = this.view();
    if (v === 'day') date.setDate(date.getDate() + dir);
    else if (v === 'month') date.setMonth(date.getMonth() + dir);
    else date.setFullYear(date.getFullYear() + dir);
    this.currentDate.set(date);
  }

  goToToday() {
    this.currentDate.set(new Date());
  }

  getPatientName(id: string) {
    const p = this.patientService.patients().find(p => p.id === id);
    return p ? `${p.firstName} ${p.lastName}` : (this.translate.instant('SCHEDULE.UNKNOWN_PATIENT'));
  }

  formatTime(iso: string) {
    const locale = this.translate.currentLang || 'en';
    return new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  getEventTop(event: Appointment) {
    const date = new Date(event.dateTime);
    const hours = date.getHours() + date.getMinutes() / 60;
    return (hours - 8) * 60; // 60px per hour, starting at 8 AM
  }

  monthHasEvent(monthIndex: number, day: number) {
    const year = this.currentDate().getFullYear();
    return this.scheduleService.appointments().some(app => {
      const d = new Date(app.dateTime);
      return d.getFullYear() === year && d.getMonth() === monthIndex && d.getDate() === day;
    });
  }

  onPatientFilter(event: any) {
    // Implement filter logic if needed
  }

  openAddModal(date?: Date) {
    this.editingAppointment.set(null);
    this.appointmentForm.reset({
      patientId: '',
      dateTime: this.formatDateForInput(date || new Date()),
      type: 'Checkup',
      status: 'Scheduled',
      notes: '',
      applianceStep: null
    });
    this.showModal.set(true);
  }

  openAddModalWithTime(hour: number) {
    const date = new Date(this.currentDate());
    date.setHours(hour, 0, 0, 0);
    this.openAddModal(date);
  }

  openEditModal(appointment: Appointment) {
    this.editingAppointment.set(appointment);
    this.appointmentForm.patchValue({
      patientId: appointment.patientId,
      dateTime: this.formatDateForInput(new Date(appointment.dateTime)),
      type: appointment.type,
      status: appointment.status,
      notes: appointment.notes,
      applianceStep: appointment.applianceStep
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingAppointment.set(null);
  }

  saveAppointment() {
    if (this.appointmentForm.invalid) return;

    const data = this.appointmentForm.value;
    const obs = this.editingAppointment() 
      ? this.scheduleService.updateAppointment(this.editingAppointment()!.id, data)
      : this.scheduleService.addAppointment(data);

    obs.subscribe({
      next: () => {
        this.closeModal();
      },
      error: (err) => console.error('Error saving appointment', err)
    });
  }

  deleteAppointment() {
    const app = this.editingAppointment();
    if (!app) return;

    if (confirm(this.translate.instant('COMMON.DELETE_CONFIRM') || 'Are you sure?')) {
      this.scheduleService.deleteAppointment(app.id).subscribe({
        next: () => this.closeModal(),
        error: (err) => console.error('Error deleting appointment', err)
      });
    }
  }

  private formatDateForInput(date: Date): string {
    const tzoffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
  }
}
