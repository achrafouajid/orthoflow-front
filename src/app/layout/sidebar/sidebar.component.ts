import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CabinetService } from '../../core/services/cabinet.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  template: `
    <aside 
      class="sidebar sticky top-0 flex h-screen flex-col border-r border-ortho-navy/5 bg-white shadow-sm z-20"
      [class.sidebar-collapsed]="isCollapsed()"
    >
      <!-- Sidebar Header -->
      <div class="flex h-16 items-center px-6 border-b border-ortho-navy/5 overflow-hidden">
        <div class="flex items-center gap-3 shrink-0">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ortho-navy text-white font-bold overflow-hidden border border-ortho-navy/10">
            @if (cabinetService.cabinetInfo()?.logoUrl) {
              <img [src]="cabinetService.cabinetInfo()?.logoUrl" alt="Logo" class="h-full w-full object-contain bg-white" />
            } @else {
              {{ (cabinetService.cabinetInfo()?.name ? cabinetService.cabinetInfo()?.name!.charAt(0).toUpperCase() : 'O') }}
            }
          </div>
          <span 
            class="text-lg font-bold tracking-tight text-ortho-navy transition-all duration-300 truncate max-w-[150px]"
            [class.opacity-0]="isCollapsed()"
            [class.w-0]="isCollapsed()"
            [class.translate-x-[-10px]]="isCollapsed()"
          >
            {{ cabinetService.cabinetInfo()?.name || 'OrthoFlow' }}
          </span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 space-y-1 px-3 py-6 overflow-x-hidden">
        @for (item of navItems; track item.key) {
          <a 
            [routerLink]="item.path"
            routerLinkActive="nav-link-active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-link flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 group nav-link-inactive"
            [title]="isCollapsed() ? (item.key | translate) : ''"
          >
            <span class="shrink-0 text-current flex items-center justify-center">
              @switch (item.key) {
                @case ('COMMON.OVERVIEW') { <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> }
                @case ('COMMON.PATIENTS') { <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> }
                @case ('COMMON.SCHEDULE') { <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> }
                @case ('COMMON.BILLING') { <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg> }
                @case ('COMMON.STOCK') { <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08"></polygon><polygon points="12 12 21 6.92 21 17.08 12 22.08"></polygon><polygon points="12 12 3 6.92 12 1.84 21 6.92 12 12"></polygon></svg> }
                @case ('COMMON.TREATMENTS') { <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> }
                @case ('COMMON.ANALYTICS') { <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path></svg> }
                @case ('COMMON.SETTINGS') { <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"></path></svg> }
              }
            </span>
            
            <span 
              class="font-medium transition-all duration-300"
              [class.opacity-0]="isCollapsed()"
              [class.w-0]="isCollapsed()"
              [class.translate-x-[-10px]]="isCollapsed()"
            >
              {{ item.key | translate }}
            </span>
          </a>
        }
      </nav>
 
      <!-- Sidebar Footer / Collapse Toggle -->
      <div class="border-t border-ortho-navy/5 p-3">
        <button 
          (click)="toggleCollapse()"
          class="flex w-full items-center justify-center rounded-lg py-2 text-ortho-navy/40 hover:bg-ortho-navy/5 hover:text-ortho-navy transition-colors group"
        >
          <div 
            class="transition-transform duration-500"
            [class.rotate-180]="isCollapsed()"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
          </div>
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly isCollapsed = signal(false);
  public cabinetService = inject(CabinetService);
 
  readonly navItems = [
    { key: 'COMMON.OVERVIEW', path: '/' },
    { key: 'COMMON.PATIENTS', path: '/patients' },
    { key: 'COMMON.SCHEDULE', path: '/schedule' },
    { key: 'COMMON.BILLING', path: '/billing' },
    { key: 'COMMON.STOCK', path: '/stock' },
    { key: 'COMMON.TREATMENTS', path: '/treatments' },
    { key: 'COMMON.ANALYTICS', path: '/analytics' },
    { key: 'COMMON.SETTINGS', path: '/settings' },
  ];

  toggleCollapse() {
    this.isCollapsed.set(!this.isCollapsed());
  }
}
