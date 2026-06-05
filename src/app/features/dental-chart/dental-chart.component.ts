import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DentalChartService } from '../../core/services/dental-chart.service';
import { ToothState, ToothStatus, DentalChartType } from '../../core/models/patient.model';
import { PatientTreatment } from '../../core/models/patient-treatment.model';
import { ADULT_SVG, CHILD_SVG } from './dental-chart-svg-data';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-dental-chart',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
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

            <div class="note-section">
              <label class="note-label">
                <span class="material-icons">edit_note</span>
                {{ 'DENTAL_CHART.NOTE_LABEL' | translate }}
              </label>
              <textarea 
                class="note-textarea"
                [placeholder]="'DENTAL_CHART.NOTE_PLACEHOLDER' | translate"
                [(ngModel)]="currentToothNote"
                (ngModelChange)="saveToothNote()"
              ></textarea>
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

      <!-- Report Section -->
      <div class="report-container" [class.open]="showReport">
        <button class="report-toggle" (click)="showReport = !showReport">
          <div class="toggle-left">
            <span class="material-icons">{{ showReport ? 'expand_less' : 'description' }}</span>
            <span class="report-title">{{ 'DENTAL_CHART.REPORT_TITLE' | translate }}</span>
            <span class="note-count" *ngIf="teethWithNotes.length > 0">{{ teethWithNotes.length }}</span>
          </div>
          <div class="toggle-right">
            <button class="btn-export-sm" (click)="exportReport($event)" [title]="'DENTAL_CHART.EXPORT_REPORT' | translate">
              <span class="material-icons">picture_as_pdf</span>
            </button>
            <span class="material-icons toggle-arrow">{{ showReport ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</span>
          </div>
        </button>
        
        <div class="report-content" *ngIf="showReport">
          @if (teethWithNotes.length > 0) {
            <div class="report-list">
              @for (tooth of teethWithNotes; track tooth.id) {
                <div class="report-item" (mouseenter)="highlightTooth(tooth.id, true)" (mouseleave)="highlightTooth(tooth.id, false)">
                  <div class="item-header">
                    <span class="tooth-badge">#{{ tooth.id }}</span>
                    <span class="tooth-name-sm">{{ getToothName(tooth.id) }}</span>
                    <span class="status-indicator" [style.background]="getStatusColor(tooth.id)"></span>
                    <span class="status-text-sm">{{ getToothStatusLabel(tooth.id) | translate }}</span>
                  </div>
                  <div class="item-note">{{ tooth.notes }}</div>
                </div>
              }
            </div>
          } @else {
            <div class="no-notes-state">
              <span class="material-icons">notes</span>
              <p>{{ 'DENTAL_CHART.NO_NOTES' | translate }}</p>
            </div>
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
  @Input() patientTreatments: PatientTreatment[] = [];

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
  currentToothNote: string = '';
  showReport: boolean = false;
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
    if ((changes['teeth'] || changes['patientTreatments']) && this.chartContainer) {
      setTimeout(() => {
        this.applyAllToothColors();
        this.applyTreatmentIndicators();
      }, 0);
    }
  }

  ngOnDestroy() { }

  private initChart() {
    this.listenersAttached = false;
    setTimeout(() => {
      this.attachToothListeners();
      this.applyAllToothColors();
      this.applyTreatmentIndicators();
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
    this.currentToothNote = state.notes || '';
    this.toothSelected.emit(state);
  }

  saveToothNote() {
    if (this.selectedTooth && this.patientId) {
      const status = this.teeth[this.selectedTooth]?.status || 'present';
      this.chartService.updateToothStatus(this.patientId, this.selectedTooth, status, this.currentToothNote);
      this.teeth = { 
        ...this.teeth, 
        [this.selectedTooth]: { 
          ...this.teeth[this.selectedTooth],
          id: this.selectedTooth, 
          status, 
          notes: this.currentToothNote 
        } 
      };
      const serialized = this.chartService.exportAsCompactString(this.patientId);
      this.chartUpdated.emit(serialized);
    }
  }

  async exportReport(event: MouseEvent) {
    event.stopPropagation();
    const container = this.chartContainer.nativeElement;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text('ORTHOFLOW', pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text('DENTAL CLINICAL REPORT', pageWidth / 2, y, { align: 'center' });
    y += 12;

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Patient ID: ${this.patientId || 'N/A'}`, 20, y);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, y, { align: 'right' });
    y += 5;
    doc.text(`Chart Type: ${this.chartType.toUpperCase()}`, 20, y);
    y += 10;

    // Capture Chart
    try {
      const chartCanvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      const chartImgData = chartCanvas.toDataURL('image/png');
      const chartWidth = 120; // mm
      const chartHeight = (chartCanvas.height * chartWidth) / chartCanvas.width;
      doc.addImage(chartImgData, 'PNG', (pageWidth - chartWidth) / 2, y, chartWidth, chartHeight);
      y += chartHeight + 15;
    } catch (err) {
      console.error('Failed to capture dental chart SVG', err);
      doc.setTextColor(239, 68, 68);
      doc.text('Error: Could not render dental chart figure.', 20, y);
      y += 10;
    }

    // Legend Section
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('EXPLANATORY LEGEND', 20, y);
    doc.setDrawColor(79, 70, 229);
    doc.line(20, y + 2, 60, y + 2);
    y += 10;

    doc.setFontSize(8);
    let x = 20;
    const colWidth = 45;
    this.statusOptions.forEach((opt) => {
      if (opt.value === 'present') return;
      
      if (x + colWidth > pageWidth - 10) {
        x = 20;
        y += 6;
      }
      
      // Color dot
      doc.setFillColor(opt.color);
      doc.circle(x + 2, y - 1, 1.5, 'F');
      
      // Label
      doc.setTextColor(71, 85, 105);
      doc.text(this.translate.instant(opt.label), x + 6, y);
      x += colWidth;
    });
    y += 15;

    // Observations Section
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('CLINICAL OBSERVATIONS', 20, y);
    doc.line(20, y + 2, 70, y + 2);
    y += 10;

    if (this.teethWithNotes.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text('No specific observations recorded for this patient.', 20, y);
    } else {
      for (const t of this.teethWithNotes) {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(10);
        doc.setTextColor(79, 70, 229);
        doc.text(`TOOTH #${t.id} - ${this.getToothName(t.id).toUpperCase()}`, 20, y);
        y += 5;
        
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`STATUS: ${this.translate.instant(this.getToothStatusLabel(t.id))}`, 20, y);
        y += 5;

        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        const splitNote = doc.splitTextToSize(t.notes || '', pageWidth - 40);
        doc.text(splitNote, 20, y);
        y += (splitNote.length * 5) + 8;
      }
    }

    // Treatments Section
    if (this.patientTreatments && this.patientTreatments.length > 0) {
      if (y > 230) {
        doc.addPage();
        y = 20;
      } else {
        y += 10;
      }
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('CLINICAL TREATMENTS HISTORY', 20, y);
      doc.setDrawColor(79, 70, 229);
      doc.line(20, y + 2, 90, y + 2);
      y += 10;

      for (const t of this.patientTreatments) {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(79, 70, 229);
        doc.text(`${t.treatment.name} (Teeth: ${t.teeth})`, 20, y);
        y += 5;

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Status: ${t.status} | Progress: ${t.progress}% | Doctor: ${t.doctorName || 'N/A'}`, 20, y);
        y += 4;

        if (t.notes) {
          doc.setTextColor(30, 41, 59);
          const splitNote = doc.splitTextToSize(`Notes: ${t.notes}`, pageWidth - 40);
          doc.text(splitNote, 20, y);
          y += (splitNote.length * 4.5);
        }

        if (t.consumables && t.consumables.length > 0) {
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          const materials = t.consumables.map(c => `${c.stockItem.name} (${c.quantityUsed} ${c.stockItem.unitLabel || 'Units'})`).join(', ');
          const splitMaterials = doc.splitTextToSize(`Materials Consumed: ${materials}`, pageWidth - 40);
          doc.text(splitMaterials, 20, y);
          y += (splitMaterials.length * 4.5);
        }

        y += 5;
      }
    }

    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated by OrthoFlow Dental Management System', pageWidth / 2, 285, { align: 'center' });

    doc.save(`dental_report_${this.patientId || 'patient'}_${new Date().getTime()}.pdf`);
  }

  get teethWithNotes(): ToothState[] {
    return Object.values(this.teeth || {}).filter(t => t.notes && t.notes.trim() !== '');
  }

  selectStatus(toothId: string, status: ToothStatus) {
    if (this.patientId) {
      this.chartService.updateToothStatus(this.patientId, toothId, status, this.currentToothNote);
      this.teeth = { ...this.teeth, [toothId]: { id: toothId, status, notes: this.currentToothNote } };
      const serialized = this.chartService.exportAsCompactString(this.patientId);
      this.chartUpdated.emit(serialized);
    }
    this.applyToothColor(toothId);
  }

  closeStatusMenu() {
    this.selectedTooth = null;
  }

  private applyAllToothColors() {
    if (!this.chartContainer) return;
    const prefix = this.getToothPrefix();
    const allParents = this.chartContainer.nativeElement.querySelectorAll(`[class*="${prefix}"][class*="-parent"]`);
    allParents.forEach((el: any) => {
      el.style.fill = 'transparent';
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
      el.style.fill = 'transparent';
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

  private applyTreatmentIndicators() {
    if (!this.chartContainer || !this.patientTreatments) return;
    const prefix = this.getToothPrefix();

    this.patientTreatments.forEach(pt => {
      if (!pt.teeth) return;
      const teethIds = pt.teeth.split(',').map(t => t.trim());
      
      teethIds.forEach(toothId => {
        const el = this.chartContainer?.nativeElement.querySelector(`.${prefix}${toothId}-parent`) as HTMLElement;
        if (!el) return;

        if (pt.status === 'COMPLETED') {
          el.style.stroke = '#10b981';
          el.style.strokeWidth = '3px';
        } else if (pt.status === 'ACTIVE') {
          el.style.stroke = '#f59e0b';
          el.style.strokeWidth = '3px';
        } else if (pt.status === 'PLANNED') {
          el.style.stroke = '#3b82f6';
          el.style.strokeWidth = '2px';
        }
      });
    });
  }
}
