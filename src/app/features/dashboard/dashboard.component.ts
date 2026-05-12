import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-8">
      <!-- Stats Grid -->
      <section class="grid gap-6 sm:grid-cols-3">
        <article class="tile p-6 tile-hover">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-ortho-navy/50">Active Patients</p>
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-ortho-ice text-ortho-navy">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </span>
          </div>
          <strong class="mt-4 block text-3xl font-bold text-ortho-navy">1,284</strong>
          <p class="mt-2 text-xs text-green-600 font-medium">+12% from last month</p>
        </article>

        <article class="tile p-6 tile-hover">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-ortho-navy/50">Today's Visits</p>
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-ortho-ice text-ortho-navy">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </span>
          </div>
          <strong class="mt-4 block text-3xl font-bold text-ortho-navy">24</strong>
          <p class="mt-2 text-xs text-ortho-navy/40 font-medium">6 slots remaining</p>
        </article>

        <article class="tile p-6 tile-hover">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-ortho-navy/50">Pending Tasks</p>
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-ortho-ice text-ortho-navy">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </span>
          </div>
          <strong class="mt-4 block text-3xl font-bold text-ortho-navy">9</strong>
          <p class="mt-2 text-xs text-red-500 font-medium">3 high priority</p>
        </article>
      </section>

      <!-- Main Sections -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Modules -->
        <section class="lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold text-ortho-navy">Core Modules</h3>
            <button class="text-sm font-semibold text-ortho-teal hover:underline">View all</button>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            @for (item of modules; track item.title) {
              <article class="tile p-5 tile-hover flex gap-4">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f9] text-ortho-navy">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.89 21.66c-.1.03-.2.05-.3.05a1 1 0 0 1-.72-.3L7.14 16.68a1 1 0 0 1-.16-1.15l1.6-3.15-1.6-3.15a1 1 0 0 1 .16-1.15l4.73-4.73a1 1 0 0 1 1.42 0l4.73 4.73a1 1 0 0 1 .16 1.15l-1.6 3.15 1.6 3.15a1 1 0 0 1-.16 1.15l-4.73 4.73a1 1 0 0 1-.46.23Z"></path></svg>
                </div>
                <div>
                  <h4 class="font-bold text-ortho-navy">{{ item.title }}</h4>
                  <p class="mt-1 text-sm text-ortho-navy/60 leading-relaxed">{{ item.body }}</p>
                </div>
              </article>
            }
          </div>
        </section>

        <!-- Quick Actions -->
        <section class="space-y-4">
          <h3 class="text-xl font-bold text-ortho-navy">Quick Actions</h3>
          <div class="tile p-2 space-y-1">
            <button 
              routerLink="/patients/register"
              class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-ortho-navy hover:bg-ortho-ice transition-colors"
            >
              <span class="flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm text-ortho-teal">+</span>
              New Patient Registration
            </button>
            <button 
              routerLink="/schedule"
              class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-ortho-navy hover:bg-ortho-ice transition-colors"
            >
              <span class="flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm text-ortho-teal">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </span>
              Schedule Appointment
            </button>
            <button class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-ortho-navy hover:bg-ortho-ice transition-colors">
              <span class="flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm text-ortho-teal">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </span>
              Generate Invoice
            </button>
          </div>

        </section>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  readonly modules = [
    { title: 'Patients', body: 'Dossiers, notes, and treatment plans.' },
    { title: 'Schedule', body: 'Appointments and reminders.' },
    { title: 'Billing', body: 'Invoices and payment tracking.' },
    { title: 'Analytics', body: 'Practice summary metrics.' },
    { title: 'Staff', body: 'Permissions and role access.' },
    { title: 'Settings', body: 'Practice configuration.' },
  ];
}
