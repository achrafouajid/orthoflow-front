import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScheduleService } from '../../core/services/schedule.service';
import { PatientService } from '../../core/services/patient.service';
import { Appointment } from '../../core/models/patient.model';

type CalendarView = 'day' | 'week' | 'month' | 'year';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="schedule-container">
      <header class="schedule-header">
        <div class="header-left">
          <h1>Schedule</h1>
          <div class="view-switcher">
            <button [class.active]="view() === 'day'" (click)="view.set('day')">Day</button>
            <button [class.active]="view() === 'month'" (click)="view.set('month')">Month</button>
            <button [class.active]="view() === 'year'" (click)="view.set('year')">Year</button>
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
            <button class="btn-ghost" (click)="goToToday()">Today</button>
          </div>
          <div class="filters">
            <div class="search-box">
              <span class="material-icons">search</span>
              <input type="text" placeholder="Filter by patient..." (input)="onPatientFilter($event)" />
            </div>
            <button class="btn-primary">
              <span class="material-icons">add</span>
              New Appointment
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
                  <div class="weekday">{{ day }}</div>
                }
              </div>
              <div class="calendar-grid">
                @for (day of calendarDays(); track day.date.toISOString()) {
                  <div 
                    class="calendar-day" 
                    [class.other-month]="!day.isCurrentMonth"
                    [class.today]="day.isToday"
                  >
                    <span class="day-number">{{ day.date.getDate() }}</span>
                    <div class="day-events">
                      @for (event of day.events; track event.id) {
                        <div class="event-pill" [class]="event.type.toLowerCase()">
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
                  <div class="hour-row"></div>
                }
                @for (event of dayEvents(); track event.id) {
                  <div 
                    class="day-event-card" 
                    [style.top.px]="getEventTop(event)"
                    [style.height.px]="60"
                    [class]="event.type.toLowerCase()"
                  >
                    <div class="card-time">{{ formatTime(event.dateTime) }}</div>
                    <div class="card-content">
                      <span class="patient">{{ getPatientName(event.patientId) }}</span>
                      <span class="type">{{ event.type }}</span>
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
                    <h3>{{ month.name }}</h3>
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
    }

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
      min-height: 100px;
      transition: background 0.2s;
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
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      gap: 0.25rem;
      font-weight: 600;
    }

    .event-pill.checkup { background: #e0e7ff; color: #4338ca; }
    .event-pill.initial { background: #dcfce7; color: #166534; }
    .event-pill.emergency { background: #fee2e2; color: #b91c1c; }

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
    }

    .day-event-card {
      position: absolute;
      left: 10px;
      right: 10px;
      background: white;
      border-left: 4px solid var(--primary);
      border-radius: 8px;
      padding: 0.5rem 1rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      display: flex;
      gap: 1rem;
      z-index: 1;
    }

    .day-event-card.checkup { border-left-color: #4f46e5; background: #f5f3ff; }
    .day-event-card.emergency { border-left-color: #ef4444; background: #fef2f2; }

    .card-time { font-weight: 700; color: #4f46e5; font-size: 0.9rem; }
    .card-content .patient { display: block; font-weight: 700; color: #1e293b; }
    .card-content .type { font-size: 0.75rem; color: #64748b; }
    .card-content .notes { font-size: 0.75rem; color: #94a3b8; margin: 0.25rem 0 0 0; }

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

  view = signal<CalendarView>('month');
  currentDate = signal(new Date());

  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  yearMonths = [
    { name: 'January', index: 0, days: 31 },
    { name: 'February', index: 1, days: 28 },
    { name: 'March', index: 2, days: 31 },
    { name: 'April', index: 3, days: 30 },
    { name: 'May', index: 4, days: 31 },
    { name: 'June', index: 5, days: 30 },
    { name: 'July', index: 6, days: 31 },
    { name: 'August', index: 7, days: 31 },
    { name: 'September', index: 8, days: 30 },
    { name: 'October', index: 9, days: 31 },
    { name: 'November', index: 10, days: 30 },
    { name: 'December', index: 11, days: 31 },
  ];

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
    if (v === 'day') return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (v === 'month') return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return date.getFullYear().toString();
  });

  navigate(dir: number) {
    const date = this.currentDate();
    const v = this.view();
    if (v === 'day') this.currentDate.set(new Date(date.setDate(date.getDate() + dir)));
    else if (v === 'month') this.currentDate.set(new Date(date.setMonth(date.getMonth() + dir)));
    else this.currentDate.set(new Date(date.setFullYear(date.getFullYear() + dir)));
  }

  goToToday() {
    this.currentDate.set(new Date());
  }

  getPatientName(id: string) {
    const p = this.patientService.patients().find(p => p.id === id);
    return p ? `${p.firstName} ${p.lastName}` : 'Unknown Patient';
  }

  formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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
    // Implement filter logic if needed, or just let signals handle it
  }
}
