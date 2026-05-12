import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, CommonModule],
  template: `
    <main class="flex min-h-screen bg-[#f8fafc] relative">
      <!-- Sidebar with responsive classes -->
      <app-sidebar 
        class="hidden md:block" 
        [class.mobile-open]="isMobileMenuOpen()"
      />

      <!-- Overlay for mobile menu -->
      @if (isMobileMenuOpen()) {
        <div 
          class="fixed inset-0 bg-black/50 z-10 md:hidden" 
          (click)="toggleMobileMenu()"
        ></div>
      }

      <section class="flex flex-1 flex-col overflow-hidden w-full">
        <app-header (menuToggle)="toggleMobileMenu()" />
        <main class="flex-1 overflow-y-auto p-4 md:p-8">
          <div class="mx-auto max-w-7xl">
            <router-outlet />
          </div>
        </main>
      </section>
    </main>
  `,
  styles: [`
    :host ::ng-deep .mobile-open {
      display: block !important;
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 30;
      width: 260px;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
  `]
})
export class MainLayoutComponent {
  isMobileMenuOpen = signal(false);

  toggleMobileMenu() {
    this.isMobileMenuOpen.set(!this.isMobileMenuOpen());
  }
}
