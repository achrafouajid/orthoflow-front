import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { jsPDF } from 'jspdf';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  template: `
    <header class="flex h-16 items-center justify-between bg-white px-4 md:px-8 border-b border-ortho-navy/5">
      <div class="flex items-center gap-3">
        <button 
          (click)="menuToggle.emit()"
          class="p-2 text-ortho-navy md:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <div>
          <h2 class="text-[10px] md:text-xs font-semibold text-ortho-navy/40 uppercase tracking-wider">{{ featureName | translate }}</h2>
          <p class="text-sm md:text-lg font-bold text-ortho-navy truncate max-w-[150px] md:max-w-none">{{ welcomeMessage | translate }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 md:gap-4">
        <button 
          (click)="generateDailyReport()"
          class="btn-secondary hidden sm:flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span class="hidden lg:inline">{{ 'COMMON.DAILY_REPORT' | translate }}</span>
        </button>
        <a routerLink="/login" class="btn-primary text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2">{{ 'COMMON.LOGOUT' | translate }}</a>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  @Input() featureName = 'Dashboard';
  @Input() welcomeMessage = 'Welcome back, Dr. Smith';
  @Output() menuToggle = new EventEmitter<void>();

  generateDailyReport() {
    const doc = new jsPDF();
    const now = new Date();
    const timestamp = now.toLocaleString();
    const dateStr = now.toISOString().split('T')[0];

    // Styling
    doc.setFontSize(22);
    doc.setTextColor(0, 128, 128); // ortho-teal
    doc.text('OrthoFlow Daily Practice Report', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${timestamp}`, 20, 30);
    
    doc.setDrawColor(0, 128, 128);
    doc.line(20, 35, 190, 35);

    // Summary Section
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // ortho-navy
    doc.text('Today\'s Performance Summary', 20, 50);

    doc.setFontSize(12);
    doc.text('• Total Patients Seen: 24', 25, 60);
    doc.text('• New Registrations: 5', 25, 68);
    doc.text('• Treatments Finalised: 3', 25, 76);
    doc.text('• Total Revenue Generated: $4,250.00', 25, 84);

    // Schedule Section
    doc.setFontSize(16);
    doc.text('Appointment Statistics', 20, 100);
    doc.setFontSize(12);
    doc.text('• Scheduled Slots: 30', 25, 110);
    doc.text('• Occupancy Rate: 80%', 25, 118);
    doc.text('• No-shows: 2', 25, 126);

    // Tasks Section
    doc.setFontSize(16);
    doc.text('Operational Tasks', 20, 142);
    doc.setFontSize(12);
    doc.text('• Pending Lab Orders: 8', 25, 152);
    doc.text('• Follow-up Calls: 12', 25, 160);
    doc.text('• Urgent Notifications: 3', 25, 168);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('© 2026 OrthoFlow - Clinical Management System', 20, 280);

    // Save PDF
    doc.save(`OrthoFlow_DailyReport_${dateStr}.pdf`);
  }
}
