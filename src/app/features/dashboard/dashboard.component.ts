import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexGrid,
  ApexTooltip,
  ApexLegend,
  ApexFill
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  colors: string[];
  legend: ApexLegend;
  fill: ApexFill;
};

@Component({
  standalone: true,
  imports: [RouterLink, NgApexchartsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <!-- Stats Grid -->
      <section class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <article class="tile p-6 tile-hover group">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-ortho-navy/50">Active Patients</p>
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-ortho-ice text-ortho-navy group-hover:bg-ortho-teal group-hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </span>
          </div>
          <div class="mt-4">
            <strong class="text-3xl font-bold text-ortho-navy">1,284</strong>
            <p class="mt-1 text-xs text-green-600 font-semibold flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              +12.5%
            </p>
          </div>
        </article>

        <article class="tile p-6 tile-hover group">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-ortho-navy/50">Patients / Month</p>
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-ortho-ice text-ortho-navy group-hover:bg-ortho-teal group-hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
            </span>
          </div>
          <div class="mt-4">
            <strong class="text-3xl font-bold text-ortho-navy">142</strong>
            <p class="mt-1 text-xs text-green-600 font-semibold flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              +5.2%
            </p>
          </div>
        </article>

        <article class="tile p-6 tile-hover group">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-ortho-navy/50">Finalised Patients</p>
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-ortho-ice text-ortho-navy group-hover:bg-ortho-teal group-hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </span>
          </div>
          <div class="mt-4">
            <strong class="text-3xl font-bold text-ortho-navy">89</strong>
            <p class="mt-1 text-xs text-ortho-navy/40 font-semibold flex items-center gap-1">
              92% completion rate
            </p>
          </div>
        </article>

        <article class="tile p-6 tile-hover group">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-ortho-navy/50">Today's Visits</p>
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-ortho-ice text-ortho-navy group-hover:bg-ortho-teal group-hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </span>
          </div>
          <div class="mt-4">
            <strong class="text-3xl font-bold text-ortho-navy">24</strong>
            <p class="mt-1 text-xs text-red-500 font-semibold">6 slots remaining</p>
          </div>
        </article>
      </section>

      <!-- Analytics Section -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Main Chart -->
        <section class="lg:col-span-2 tile p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 class="text-xl font-bold text-ortho-navy">Patient Analytics</h3>
              <p class="text-sm text-ortho-navy/50">Comparison between new admissions and finalised treatments</p>
            </div>
            <div class="flex items-center gap-4 bg-ortho-ice/50 p-1 rounded-lg">
              <button class="px-3 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-ortho-navy">Monthly</button>
              <button class="px-3 py-1.5 text-xs font-semibold text-ortho-navy/40 hover:text-ortho-navy transition-colors">Quarterly</button>
            </div>
          </div>
          <div class="h-[320px] w-full">
            <apx-chart
              [series]="chartOptions.series"
              [chart]="chartOptions.chart"
              [xaxis]="chartOptions.xaxis"
              [stroke]="chartOptions.stroke"
              [colors]="chartOptions.colors"
              [dataLabels]="chartOptions.dataLabels"
              [grid]="chartOptions.grid"
              [tooltip]="chartOptions.tooltip"
              [legend]="chartOptions.legend"
              [fill]="chartOptions.fill"
            ></apx-chart>
          </div>
        </section>

        <!-- Quick Actions -->
        <div class="space-y-6">
          <section class="space-y-4">
            <h3 class="text-xl font-bold text-ortho-navy">Quick Actions</h3>
            <div class="tile p-2 space-y-1">
              <button 
                routerLink="/patients/register"
                class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-ortho-navy hover:bg-ortho-ice transition-colors"
              >
                <span class="flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm text-ortho-teal font-bold">+</span>
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

          <section class="tile p-6">
            <h4 class="text-sm font-bold text-ortho-navy uppercase tracking-wider mb-4">Practice Efficiency</h4>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-xs font-bold text-ortho-navy/60 mb-1.5">
                  <span>TREATMENT SUCCESS</span>
                  <span>94%</span>
                </div>
                <div class="h-1.5 w-full bg-ortho-ice rounded-full overflow-hidden">
                  <div class="h-full bg-ortho-teal rounded-full" style="width: 94%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-bold text-ortho-navy/60 mb-1.5">
                  <span>APPOINTMENT ATTENDANCE</span>
                  <span>88%</span>
                </div>
                <div class="h-1.5 w-full bg-ortho-ice rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 rounded-full" style="width: 88%"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- Core Modules -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-ortho-navy">Practice Management</h3>
          <button class="text-sm font-semibold text-ortho-teal hover:underline">Customize Dashboard</button>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (item of modules; track item.title) {
            <article class="tile p-5 tile-hover flex gap-4 items-start border-l-4 border-l-transparent hover:border-l-ortho-teal transition-all">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ortho-ice text-ortho-navy">
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

  public chartOptions: ChartOptions = {
    series: [
      {
        name: "New Patients",
        data: [45, 52, 38, 24, 33, 26, 21, 20, 6, 8, 15, 10]
      },
      {
        name: "Finalised",
        data: [35, 41, 62, 42, 13, 18, 29, 37, 36, 51, 32, 35]
      }
    ],
    chart: {
      height: 350,
      type: "area",
      toolbar: {
        show: false
      },
      fontFamily: 'Inter, sans-serif'
    },
    colors: ["#008080", "#1e293b"], // ortho-teal and ortho-navy
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: "smooth",
      width: 3
    },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    grid: {
      borderColor: "#f1f5f9",
      strokeDashArray: 4
    },
    tooltip: {
      theme: 'light',
      x: {
        show: false
      }
    },
    legend: {
      show: false
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100]
      }
    }
  };
}
