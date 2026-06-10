import { Component, Input, Output, EventEmitter, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ThreeDentalViewerComponent } from '../../shared/components/three-dental-viewer/three-dental-viewer.component';
import { ThreeDentalSyncService, ViewType } from '../../core/services/three-dental-sync.service';
import { ToothState, ToothStatus } from '../../core/models/patient.model';
import { DentalChartService } from '../../core/services/dental-chart.service';
import { DentalAuditLogComponent } from './components/dental-audit-log.component';

@Component({
  selector: 'app-dental-3d-canvas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ThreeDentalViewerComponent,
    DentalAuditLogComponent
  ],
  template: `
    <div class="canvas-3d-wrapper">
      <div class="canvas-toolbar">
        <div class="toolbar-left">
          <span class="view-mode-title">
            <span class="material-icons text-indigo-500">3d_rotation</span>
            3D Multi-View Dental Canvas
          </span>
        </div>
        <div class="toolbar-right">
          <button 
            class="layout-btn" 
            [class.active]="gridMode() === 'grid'" 
            (click)="gridMode.set('grid')"
            title="Grid Layout (2x2)"
          >
            <span class="material-icons">grid_view</span>
          </button>
          <button 
            class="layout-btn" 
            [class.active]="gridMode() === 'single'" 
            (click)="gridMode.set('single')"
            title="Single Focus Layout"
          >
            <span class="material-icons">crop_square</span>
          </button>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="main-layout-container">
        <!-- 3D Views Grid/Panel -->
        <div class="views-section" [class.single-view]="gridMode() === 'single'">
          @if (gridMode() === 'grid') {
            <div class="grid-2x2">
              @for (v of views; track v.type) {
                <div class="view-quadrant" [class.focused]="focusedView() === v.type">
                  <header class="quadrant-header">
                    <span class="quadrant-title">
                      <span class="material-icons text-xs mr-1">{{ v.icon }}</span>
                      {{ v.label }}
                    </span>
                    <div class="quadrant-actions">
                      @if (v.type !== 'roots') {
                        <span class="sync-badge" title="Automatically synchronized with Top, Frontal, and Internal views">
                          <span class="material-icons spin-pulse">sync</span>
                          Sync
                        </span>
                      } @else {
                        <span class="sync-badge isolated" title="Roots view is fully isolated from automatic synchronization">
                          <span class="material-icons">sync_disabled</span>
                          Isolated
                        </span>
                      }
                      <button class="icon-btn-sm" (click)="maximizeView(v.type)">
                        <span class="material-icons">fullscreen</span>
                      </button>
                    </div>
                  </header>
                  <div class="quadrant-body">
                    <app-three-dental-viewer
                      [viewType]="v.type"
                      [teethStatus]="teethStates()[v.type]"
                      [highlightedTooth]="hoveredTooth()"
                      (toothClicked)="onToothClick($event, v.type)"
                      (toothHovered)="onToothHover($event)"
                    />
                  </div>
                </div>
              }
            </div>
          } @else {
            <!-- Single View Mode -->
            <div class="focused-view-container">
              <header class="quadrant-header">
                <div class="flex items-center gap-4">
                  <span class="quadrant-title">
                    <span class="material-icons text-xs mr-1">{{ getActiveViewInfo().icon }}</span>
                    {{ getActiveViewInfo().label }}
                  </span>
                  <div class="view-tabs">
                    @for (v of views; track v.type) {
                      <button 
                        class="view-tab-btn" 
                        [class.active]="focusedView() === v.type" 
                        (click)="focusedView.set(v.type)"
                      >
                        {{ v.label }}
                      </button>
                    }
                  </div>
                </div>
                <div class="quadrant-actions">
                  <button class="icon-btn-sm" (click)="gridMode.set('grid')">
                    <span class="material-icons">grid_view</span>
                  </button>
                </div>
              </header>
              <div class="focused-view-body">
                <app-three-dental-viewer
                  [viewType]="focusedView()"
                  [teethStatus]="teethStates()[focusedView()]"
                  [highlightedTooth]="hoveredTooth()"
                  (toothClicked)="onToothClick($event, focusedView())"
                  (toothHovered)="onToothHover($event)"
                />
              </div>
            </div>
          }
        </div>

        <!-- Selected Tooth Side Panel -->
        <div class="tooth-side-panel" [class.open]="selectedTooth()">
          @if (selectedTooth(); as toothId) {
            <header class="panel-header">
              <div class="flex items-center gap-2">
                <span class="tooth-fdi-badge">#{{ toothId }}</span>
                <h3>Tooth Details</h3>
              </div>
              <button class="close-btn" (click)="selectedTooth.set(null)">
                <span class="material-icons">close</span>
              </button>
            </header>

            <div class="panel-content">
              <div class="info-card">
                <span class="label">Anatomical Name</span>
                <span class="value">{{ getToothName(toothId) }}</span>
              </div>

              <!-- Status Selection -->
              <div class="status-section-3d">
                <span class="section-title">Assign Status (View: {{ getActiveViewLabel() }})</span>
                <div class="status-chips-grid">
                  @for (opt of statusOptions; track opt.value) {
                    <button
                      class="status-chip"
                      [class.active]="getCurrentToothStatus(toothId) === opt.value"
                      (click)="updateToothStatus(toothId, opt.value)"
                    >
                      <span class="status-dot" [style.background]="opt.color"></span>
                      {{ opt.label | translate }}
                    </button>
                  }
                </div>
              </div>

              <!-- Notes field -->
              <div class="notes-field">
                <label>Clinical Notes</label>
                <textarea 
                  [(ngModel)]="currentToothNotes"
                  placeholder="Record observations, fractures, or treatment planning details..."
                  (ngModelChange)="saveToothNotes()"
                ></textarea>
              </div>

              <!-- History/Audit per tooth -->
              <div class="tooth-audit-mini">
                <span class="section-title">Tooth Audit Trail</span>
                <div class="audit-mini-list">
                  @for (entry of getToothAuditLogs(toothId); track entry.timestamp) {
                    <div class="audit-mini-item">
                      <div class="flex justify-between text-xs font-semibold">
                        <span [class.text-indigo-600]="!entry.autoSyncTriggered" [class.text-amber-600]="entry.autoSyncTriggered">
                          {{ entry.autoSyncTriggered ? 'System (Sync)' : entry.user }}
                        </span>
                        <span class="text-slate-400">{{ entry.timestamp | date:'shortTime' }}</span>
                      </div>
                      <div class="text-[11px] text-slate-600 mt-1">
                        Changed status in <strong>{{ entry.viewModified | uppercase }}</strong> view: 
                        <span class="font-bold">{{ entry.previousStatus }}</span> → <span class="font-bold">{{ entry.newStatus }}</span>
                      </div>
                    </div>
                  } @empty {
                    <div class="text-xs text-slate-400 italic">No history modifications logged yet.</div>
                  }
                </div>
              </div>

              <!-- Action button -->
              <button class="btn-primary w-full justify-center mt-4" (click)="triggerTreatmentAssign(toothId)">
                <span class="material-icons mr-1">add</span>
                Assign Treatment to #{{ toothId }}
              </button>
            </div>
          } @else {
            <div class="panel-empty-state">
              <span class="material-icons large text-slate-300">touch_app</span>
              <p>Click any tooth inside a 3D viewport to inspect properties or update status.</p>
            </div>
          }
        </div>
      </div>

      <!-- Combined Audit Trail Panel -->
      <app-dental-audit-log 
        [auditLog]="syncService.getAuditLog()()"
      />
    </div>
  `,
  styleUrl: './dental-3d-canvas.component.css',
})
export class Dental3DCanvasComponent implements OnInit {
  @Input() patientId: string = '';
  @Input() initialTeeth: Record<string, ToothState> = {};

  @Output() toothSelected = new EventEmitter<string>();
  @Output() openAssignModal = new EventEmitter<string>();

  syncService = inject(ThreeDentalSyncService);
  private translate = inject(TranslateService);

  gridMode = signal<'grid' | 'single'>('grid');
  focusedView = signal<ViewType>('frontal');

  selectedTooth = signal<string | null>(null);
  hoveredTooth = signal<string | null>(null);

  currentToothNotes = '';

  views: { type: ViewType; label: string; icon: string }[] = [
    { type: 'top', label: 'Top (Occlusal)', icon: 'visibility' },
    { type: 'frontal', label: 'Frontal (Labial)', icon: 'face' },
    { type: 'internal', label: 'Internal (Palatal)', icon: 'vertical_align_bottom' },
    { type: 'roots', label: 'Roots (Apical)', icon: 'blur_on' },
  ];

  statusOptions = [
    { value: 'present' as ToothStatus, label: 'DENTAL_CHART.STATUS.PRESENT', color: '#10b981' },
    { value: 'extracted' as ToothStatus, label: 'DENTAL_CHART.STATUS.EXTRACTED', color: '#ef4444' },
    { value: 'composite' as ToothStatus, label: 'DENTAL_CHART.STATUS.COMPOSITE', color: '#3b82f6' },
    { value: 'amalgam' as ToothStatus, label: 'DENTAL_CHART.STATUS.AMALGAM', color: '#6b7280' },
    { value: 'crown' as ToothStatus, label: 'DENTAL_CHART.STATUS.CROWN', color: '#f59e0b' },
    { value: 'bridge' as ToothStatus, label: 'DENTAL_CHART.STATUS.BRIDGE', color: '#f97316' },
    { value: 'implant' as ToothStatus, label: 'DENTAL_CHART.STATUS.IMPLANT', color: '#8b5cf6' },
    { value: 'veneer' as ToothStatus, label: 'DENTAL_CHART.STATUS.VENEER', color: '#06b6d4' },
    { value: 'root_canal' as ToothStatus, label: 'DENTAL_CHART.STATUS.ROOT_CANAL', color: '#ec4899' },
    { value: 'caries' as ToothStatus, label: 'DENTAL_CHART.STATUS.CARIES', color: '#dc2626' },
    { value: 'fracture' as ToothStatus, label: 'DENTAL_CHART.STATUS.FRACTURE', color: '#991b1b' },
    { value: 'impacted' as ToothStatus, label: 'DENTAL_CHART.STATUS.IMPACTED', color: '#a855f7' },
    { value: 'missing' as ToothStatus, label: 'DENTAL_CHART.STATUS.MISSING', color: '#d1d5db' },
    { value: 'post' as ToothStatus, label: 'DENTAL_CHART.STATUS.POST', color: '#94a3b8' },
  ];

  teethStates = this.syncService.getAllTeethStates();

  ngOnInit() {
    if (this.patientId) {
      this.syncService.initPatientState(this.patientId, this.initialTeeth);
    }
  }

  maximizeView(view: ViewType) {
    this.focusedView.set(view);
    this.gridMode.set('single');
  }

  getActiveViewInfo() {
    return this.views.find((v) => v.type === this.focusedView()) || this.views[1];
  }

  getActiveViewLabel() {
    return this.getActiveViewInfo().label;
  }

  getCurrentToothStatus(toothId: string): ToothStatus {
    const activeView = this.focusedView();
    return this.teethStates()[activeView][toothId]?.status || 'present';
  }

  onToothClick(toothId: string, view: ViewType) {
    this.focusedView.set(view);
    this.selectedTooth.set(toothId);
    this.toothSelected.emit(toothId);

    const activeState = this.teethStates()[view][toothId];
    this.currentToothNotes = activeState?.notes || '';
  }

  onToothHover(toothId: string | null) {
    this.hoveredTooth.set(toothId);
  }

  updateToothStatus(toothId: string, status: ToothStatus) {
    const view = this.focusedView();
    this.syncService.setToothStatus(
      this.patientId,
      toothId,
      status,
      view,
      this.currentToothNotes,
      'Doctor'
    );
  }

  saveToothNotes() {
    const toothId = this.selectedTooth();
    if (!toothId) return;

    const view = this.focusedView();
    const currentStatus = this.getCurrentToothStatus(toothId);
    this.syncService.setToothStatus(
      this.patientId,
      toothId,
      currentStatus,
      view,
      this.currentToothNotes,
      'Doctor'
    );
  }

  getToothAuditLogs(toothId: string) {
    return this.syncService.getAuditLog()().filter((e) => e.toothId === toothId);
  }

  triggerTreatmentAssign(toothId: string) {
    this.openAssignModal.emit(toothId);
  }

  getToothName(toothId: string): string {
    const id = parseInt(toothId);
    const names: Record<number, string> = {
      11: 'Upper Right Central Incisor', 12: 'Upper Right Lateral Incisor', 13: 'Upper Right Canine',
      14: 'Upper Right 1st Premolar', 15: 'Upper Right 2nd Premolar', 16: 'Upper Right 1st Molar',
      17: 'Upper Right 2nd Molar', 18: 'Upper Right 3rd Molar',
      21: 'Upper Left Central Incisor', 22: 'Upper Left Lateral Incisor', 23: 'Upper Left Canine',
      24: 'Upper Left 1st Premolar', 25: 'Upper Left 2nd Premolar', 26: 'Upper Left 1st Molar',
      27: 'Upper Left 2nd Molar', 28: 'Upper Left 3rd Molar',
      31: 'Lower Left Central Incisor', 32: 'Lower Left Lateral Incisor', 33: 'Lower Left Canine',
      34: 'Lower Left 1st Premolar', 35: 'Lower Left 2nd Premolar', 36: 'Lower Left 1st Molar',
      37: 'Lower Left 2nd Molar', 38: 'Lower Left 3rd Molar',
      41: 'Lower Right Central Incisor', 42: 'Lower Right Lateral Incisor', 43: 'Lower Right Canine',
      44: 'Lower Right 1st Premolar', 45: 'Lower Right 2nd Premolar', 46: 'Lower Right 1st Molar',
      47: 'Lower Right 2nd Molar', 48: 'Lower Right 3rd Molar'
    };
    return names[id] || 'Unknown Tooth';
  }
}
