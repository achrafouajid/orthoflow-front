import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DentalChartService } from '../../core/services/dental-chart.service';
import { ToothState, ToothStatus, DentalChartType } from '../../core/models/patient.model';
import { ADULT_SVG, CHILD_SVG } from './dental-chart-svg-data';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-dental-chart',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="dental-chart-wrapper" (click)="closeStatusMenu()">
      <div class="chart-header">
        <div class="header-left">
          <span class="chart-type-badge" [class.adult]="chartType === 'adult'" [class.child]="chartType === 'child'">
            <span class="material-icons">{{ chartType === 'adult' ? 'person' : 'child_care' }}</span>
            {{ (chartType === 'adult' ? 'DENTAL_CHART.ADULT_TITLE' : 'DENTAL_CHART.CHILD_TITLE') | translate }}
          </span>
          <span class="tooth-info">
            @if (hoveredTooth) {
              <span class="tooth-num">#{{ hoveredTooth }}</span>
              <span class="tooth-name">{{ getToothName(hoveredTooth) }}</span>
              <span class="tooth-status-label" [style.color]="getStatusColor(hoveredTooth)">{{ getToothStatusLabel(hoveredTooth) | translate }}</span>
            } @else {
              <span class="placeholderText">{{ 'DENTAL_CHART.HOVER_PROMPT' | translate }}</span>
            }
          </span>
        </div>
        <div class="header-right" *ngIf="interactive">
          <button class="btn-icon-sm" (click)="copyStateString($event)" [title]="'DENTAL_CHART.COPY_STATE' | translate">
            <span class="material-icons">content_copy</span>
          </button>
        </div>
      </div>

      <div class="svg-container" #chartContainer [innerHTML]="svgContent"></div>

      <!-- Status selection popup -->
      @if (selectedTooth && interactive) {
      <div class="status-menu-overlay" (click)="closeStatusMenu()">
        <div class="status-menu" (click)="$event.stopPropagation()">
          <header class="menu-header">
            <div class="menu-title">
              <span class="material-icons">toll</span>
              {{ 'DENTAL_CHART.TOOTH_NUMBER' | translate }} {{ selectedTooth }}
            </div>
            <button class="close-btn" (click)="closeStatusMenu()">
              <span class="material-icons">close</span>
            </button>
          </header>
          
          <div class="status-sections">
            <div class="status-grid">
              @for (opt of statusOptions; track opt.value) {
                <button
                  class="status-option"
                  [class.active]="(teeth && teeth[selectedTooth!]?.status) === opt.value"
                  (click)="selectStatus(selectedTooth!, opt.value)"
                >
                  <span class="status-dot" [style.background]="opt.color"></span>
                  {{ opt.label | translate }}
                </button>
              }
            </div>
          </div>
          
          <div class="menu-footer">
            <button class="btn-reset" (click)="selectStatus(selectedTooth!, 'present')">
              {{ 'DENTAL_CHART.RESET_PRESENT' | translate }}
            </button>
          </div>
        </div>
      </div>
      }

      <div class="chart-footer">
        <div class="legend">
          @for (opt of statusOptions; track opt.value) {
            @if (opt.value !== 'present') {
              <span class="legend-item">
                <span class="legend-dot" [style.background]="opt.color"></span>
                {{ opt.label | translate }}
              </span>
            }
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './dental-chart.component.css'
})
export class DentalChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() chartType: DentalChartType = 'adult';
  @Input() patientId = '';
  @Input() teeth: Record<string, ToothState> = {};
  @Input() interactive = true;

  @Output() toothSelected = new EventEmitter<ToothState>();
  @Output() toothHovered = new EventEmitter<ToothState | null>();
  @Output() chartUpdated = new EventEmitter<string>();

  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef<HTMLDivElement>;

  chartService = inject(DentalChartService);
  private sanitizer = inject(DomSanitizer);
  private translate = inject(TranslateService);

  svgContent: SafeHtml = '';
  hoveredTooth: string | null = null;
  selectedTooth: string | null = null;
  private listenersAttached = false;

  statusOptions: { value: ToothStatus; label: string; color: string }[] = [
    { value: 'extracted', label: 'DENTAL_CHART.STATUS.EXTRACTED', color: '#ef4444' },
    { value: 'composite', label: 'DENTAL_CHART.STATUS.COMPOSITE', color: '#3b82f6' },
    { value: 'amalgam', label: 'DENTAL_CHART.STATUS.AMALGAM', color: '#6b7280' },
    { value: 'crown', label: 'DENTAL_CHART.STATUS.CROWN', color: '#f59e0b' },
    { value: 'bridge', label: 'DENTAL_CHART.STATUS.BRIDGE', color: '#f97316' },
    { value: 'implant', label: 'DENTAL_CHART.STATUS.IMPLANT', color: '#8b5cf6' },
    { value: 'veneer', label: 'DENTAL_CHART.STATUS.VENEER', color: '#06b6d4' },
    { value: 'root_canal', label: 'DENTAL_CHART.STATUS.ROOT_CANAL', color: '#ec4899' },
    { value: 'caries', label: 'DENTAL_CHART.STATUS.CARIES', color: '#dc2626' },
    { value: 'fracture', label: 'DENTAL_CHART.STATUS.FRACTURE', color: '#991b1b' },
    { value: 'impacted', label: 'DENTAL_CHART.STATUS.IMPACTED', color: '#a855f7' },
    { value: 'missing', label: 'DENTAL_CHART.STATUS.MISSING', color: '#d1d5db' },
    { value: 'post', label: 'DENTAL_CHART.STATUS.POST', color: '#94a3b8' },
  ];

  constructor() {
    this.updateSvgContent();
  }

  ngAfterViewInit() {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chartType']) {
      this.updateSvgContent();
      this.initChart();
    }
    if (changes['teeth'] && this.chartContainer) {
      setTimeout(() => this.applyAllToothColors(), 0);
    }
  }

  ngOnDestroy() { }

  private initChart() {
    this.listenersAttached = false;
    setTimeout(() => {
      this.attachToothListeners();
      this.applyAllToothColors();
    }, 150); // Increased delay for SVG rendering
  }

  private updateSvgContent() {
    const raw = this.chartType === 'adult' ? ADULT_SVG : CHILD_SVG;
    this.svgContent = this.sanitizer.bypassSecurityTrustHtml(raw);
  }


  private getToothPrefix(): string {
    return this.chartType === 'adult' ? 'tooth-' : 'child-tooth-';
  }

  private attachToothListeners() {
    if (!this.chartContainer) return;
    const container = this.chartContainer.nativeElement;
    const prefix = this.getToothPrefix();

    // Select all paths that represent a tooth
    const allToothPaths = container.querySelectorAll(`path[class*="${prefix}"]`);

    allToothPaths.forEach((path: any) => {
      const classes = path.getAttribute('class') || '';
      const regex = new RegExp(`${prefix}(\\d+)`);
      const match = classes.match(regex);
      if (!match) return;

      const toothId = match[1];
      const el = path as HTMLElement;

      el.addEventListener('mouseenter', () => this.onToothHover(toothId));
      el.addEventListener('mouseleave', () => this.onToothLeave(toothId));

      if (this.interactive) {
        el.addEventListener('click', (e: MouseEvent) => {
          e.stopPropagation();
          this.onToothClick(toothId);
        });
        el.style.cursor = 'pointer';
      }
    });

    this.listenersAttached = true;
  }

  onToothHover(toothId: string) {
    this.hoveredTooth = toothId;
    this.highlightTooth(toothId, true);
    const state = (this.teeth && this.teeth[toothId]) || { id: toothId, status: 'present' };
    this.toothHovered.emit(state);
  }

  onToothLeave(toothId: string) {
    this.hoveredTooth = null;
    this.highlightTooth(toothId, false);
    this.toothHovered.emit(null);
  }

  private highlightTooth(toothId: string, active: boolean) {
    const prefix = this.getToothPrefix();
    const parentEl = this.chartContainer?.nativeElement.querySelector(`.${prefix}${toothId}-parent`) as HTMLElement;
    if (!parentEl) return;

    if (active) {
      parentEl.style.stroke = '#4f46e5';
      parentEl.style.strokeWidth = '2px';
      parentEl.style.filter = 'drop-shadow(0 0 2px rgba(79,70,229,0.5))';
    } else {
      parentEl.style.stroke = '#000';
      parentEl.style.strokeWidth = '1px';
      parentEl.style.filter = 'none';
    }
  }

  onToothClick(toothId: string) {
    this.selectedTooth = toothId;
    const state = (this.teeth && this.teeth[toothId]) || { id: toothId, status: 'present' };
    this.toothSelected.emit(state);
  }

  selectStatus(toothId: string, status: ToothStatus) {
    if (this.patientId) {
      this.chartService.updateToothStatus(this.patientId, toothId, status);
      this.teeth = { ...this.teeth, [toothId]: { id: toothId, status } };
      const serialized = this.chartService.exportAsCompactString(this.patientId);
      this.chartUpdated.emit(serialized);
    }
    this.applyToothColor(toothId);
    this.selectedTooth = null;
  }

  closeStatusMenu() {
    this.selectedTooth = null;
  }

  private applyAllToothColors() {
    if (!this.chartContainer) return;
    const prefix = this.getToothPrefix();
    const allParents = this.chartContainer.nativeElement.querySelectorAll(`[class*="${prefix}"][class*="-parent"]`);
    allParents.forEach((el: any) => {
      el.style.fill = 'none';
      el.style.opacity = '1';
    });

    if (this.teeth) {
      Object.keys(this.teeth).forEach(id => this.applyToothColor(id));
    }
  }

  private applyToothColor(toothId: string) {
    const prefix = this.getToothPrefix();
    const el = this.chartContainer?.nativeElement.querySelector(`.${prefix}${toothId}-parent`) as HTMLElement;
    if (!el) return;

    const status = (this.teeth && this.teeth[toothId])?.status || 'present';
    const color = DentalChartService.STATUS_COLORS[status];

    if (status === 'present' || color === 'none') {
      el.style.fill = 'none';
      el.style.opacity = '1';
    } else {
      el.style.fill = color;
      el.style.opacity = (status === 'extracted' || status === 'missing') ? '0.2' : '0.6';
    }
  }

  getToothStatusLabel(toothId: string): string {
    const status = (this.teeth && this.teeth[toothId])?.status || 'present';
    return `DENTAL_CHART.STATUS.${status.toUpperCase()}`;
  }

  getStatusColor(toothId: string): string {
    const status = (this.teeth && this.teeth[toothId])?.status || 'present';
    const color = DentalChartService.STATUS_COLORS[status];
    return color === 'none' ? '#64748b' : color;
  }

  getToothName(toothId: string): string {
    const id = parseInt(toothId);
    const names: Record<number, string> = {
      11: 'Upper Right Central Incisor', 12: 'Upper Right Lateral Incisor', 13: 'Upper Right Canine',
      14: 'Upper Right 1st Premolar', 15: 'Upper Right 2nd Premolar', 16: 'Upper Right 1st Molar',
      17: 'Upper Right 2nd Molar', 18: 'Upper Right 3rd Molar (Wisdom)',
      21: 'Upper Left Central Incisor', 22: 'Upper Left Lateral Incisor', 23: 'Upper Left Canine',
      24: 'Upper Left 1st Premolar', 25: 'Upper Left 2nd Premolar', 26: 'Upper Left 1st Molar',
      27: 'Upper Left 2nd Molar', 28: 'Upper Left 3rd Molar (Wisdom)',
      31: 'Lower Left Central Incisor', 32: 'Lower Left Lateral Incisor', 33: 'Lower Left Canine',
      34: 'Lower Left 1st Premolar', 35: 'Lower Left 2nd Premolar', 36: 'Lower Left 1st Molar',
      37: 'Lower Left 2nd Molar', 38: 'Lower Left 3rd Molar (Wisdom)',
      41: 'Lower Right Central Incisor', 42: 'Lower Right Lateral Incisor', 43: 'Lower Right Canine',
      44: 'Lower Right 1st Premolar', 45: 'Lower Right 2nd Premolar', 46: 'Lower Right 1st Molar',
      47: 'Lower Right 2nd Molar', 48: 'Lower Right 3rd Molar (Wisdom)',
      51: 'Upper Right Primary Central', 52: 'Upper Right Primary Lateral', 53: 'Upper Right Primary Canine',
      54: 'Upper Right Primary 1st Molar', 55: 'Upper Right Primary 2nd Molar',
      61: 'Upper Left Primary Central', 62: 'Upper Left Primary Lateral', 63: 'Upper Left Primary Canine',
      64: 'Upper Left Primary 1st Molar', 65: 'Upper Left Primary 2nd Molar',
      71: 'Lower Left Primary Central', 72: 'Lower Left Primary Lateral', 73: 'Lower Left Primary Canine',
      74: 'Lower Left Primary 1st Molar', 75: 'Lower Left Primary 2nd Molar',
      81: 'Lower Right Primary Central', 82: 'Lower Right Primary Lateral', 83: 'Lower Right Primary Canine',
      84: 'Lower Right Primary 1st Molar', 85: 'Lower Right Primary 2nd Molar'
    };
    return names[id] || 'Unknown Tooth';
  }

  copyStateString(event: MouseEvent) {
    event.stopPropagation();
    if (this.patientId) {
      const state = this.chartService.exportAsCompactString(this.patientId);
      if (state) {
        navigator.clipboard.writeText(state).then(() => {
          this.translate.get('DENTAL_CHART.STATE_COPIED').subscribe(msg => {
            alert(msg);
          });
        });
      }
    }
  }
}
