import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditEntry } from '../../../core/services/three-dental-sync.service';

@Component({
  selector: 'app-dental-audit-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="audit-container" [class.expanded]="isExpanded()">
      <header class="audit-header" (click)="toggleExpand()">
        <span class="title">
          <span class="material-icons text-ortho-sky">history</span>
          System Dental Canvas Audit Logs
          <span class="badge" *ngIf="auditLog.length > 0">{{ auditLog.length }}</span>
        </span>
        <button type="button" class="expand-btn">
          <span class="material-icons">
            {{ isExpanded() ? 'keyboard_arrow_down' : 'keyboard_arrow_up' }}
          </span>
        </button>
      </header>

      <div class="audit-body" *ngIf="isExpanded()">
        <div class="table-wrapper">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Tooth #</th>
                <th>View</th>
                <th>Previous Status</th>
                <th>New Status</th>
                <th>Trigger Type</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of auditLog; track entry.timestamp) {
                <tr [class.auto-trigger]="entry.autoSyncTriggered">
                  <td class="timestamp">{{ entry.timestamp | date:'medium' }}</td>
                  <td>
                    <span class="tooth-badge">#{{ entry.toothId }}</span>
                  </td>
                  <td class="view-type">{{ entry.viewModified | uppercase }}</td>
                  <td>
                    <span class="status-lbl prev">{{ entry.previousStatus }}</span>
                  </td>
                  <td>
                    <span class="status-lbl new">{{ entry.newStatus }}</span>
                  </td>
                  <td>
                    <span class="trigger-badge" [class.auto]="entry.autoSyncTriggered">
                      {{ entry.autoSyncTriggered ? 'Auto Sync' : 'Manual Change' }}
                    </span>
                  </td>
                  <td class="user">{{ entry.user }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="empty-state">
                    No canvas status changes have been audit logged yet.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .audit-container {
      background: rgb(var(--ink-900));
      border-top: 1px solid rgb(var(--ink-700));
      display: flex;
      flex-direction: column;
      max-height: 50px;
      transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .audit-container.expanded {
      max-height: 250px;
    }
    .audit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      cursor: pointer;
      background: rgb(var(--ink-900));
      user-select: none;
    }
    .audit-header .title {
      font-size: 0.85rem;
      font-weight: 700;
      color: rgb(var(--ink-500));
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .badge {
      background: rgb(var(--petrol-900));
      color: #ffffff;
      font-size: 0.7rem;
      padding: 0.1rem 0.35rem;
      border-radius: 10px;
      font-weight: 700;
    }
    .expand-btn {
      background: transparent;
      border: none;
      color: rgb(var(--ink-500));
      cursor: pointer;
      display: flex;
    }
    .audit-body {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }
    .table-wrapper {
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgb(var(--ink-700));
      background: rgb(var(--ink-900));
    }
    .audit-table {
      width: 100%;
      border-collapse: collapse;
      text-align: start;
      font-size: 0.75rem;
    }
    .audit-table th, .audit-table td {
      padding: 0.65rem 1rem;
      border-bottom: 1px solid rgb(var(--ink-900));
    }
    .audit-table th {
      background: rgb(var(--ink-900));
      color: rgb(var(--ink-500));
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.65rem;
      letter-spacing: 0.05em;
    }
    .audit-table tr:last-child td {
      border-bottom: none;
    }
    .audit-table tr.auto-trigger {
      background: rgba(3, 4, 94, 0.02);
    }
    .timestamp {
      color: rgb(var(--ink-500));
    }
    .tooth-badge {
      background: rgb(var(--ink-700));
      color: rgb(var(--ink-50));
      font-weight: 700;
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
    }
    .view-type {
      font-weight: 600;
      color: rgb(var(--petrol-400));
    }
    .status-lbl {
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.7rem;
    }
    .status-lbl.prev {
      background: rgba(239, 68, 68, 0.1);
      color: rgb(var(--critical-500));
    }
    .status-lbl.new {
      background: rgba(16, 185, 129, 0.1);
      color: rgb(var(--positive-500));
    }
    .trigger-badge {
      display: inline-block;
      font-weight: 700;
      font-size: 0.65rem;
      color: rgb(var(--petrol-400));
      background: rgba(56, 189, 248, 0.1);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }
    .trigger-badge.auto {
      color: rgb(var(--caution-300));
      background: rgba(251, 191, 36, 0.1);
    }
    .user {
      color: rgb(var(--ink-200));
      font-weight: 600;
    }
    .empty-state {
      text-align: center;
      color: rgb(var(--ink-500));
      padding: 2rem !important;
      font-style: italic;
    }
  `],
})
export class DentalAuditLogComponent {
  @Input() auditLog: AuditEntry[] = [];

  isExpanded = signal<boolean>(false);

  toggleExpand() {
    this.isExpanded.update((e) => !e);
  }
}
