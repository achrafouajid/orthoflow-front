import { Component, Input, computed, signal } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

/**
 * Thin wrapper over the `.pill` primitives in `styles.css`.
 *
 * For a domain status token (`PAID`, `ON_HOLD`, …) prefer
 * `<app-status-pill [status]="…">`, which maps the token to a tone and
 * translates the label. Use this one for a badge whose tone the caller
 * decides — counts, categories, flags.
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span [class]="classes()"><ng-content></ng-content></span>
  `,
  styles: [':host { display: inline-flex; }'],
})
export class BadgeComponent {
  private readonly _variant = signal<BadgeVariant>('neutral');

  @Input() set variant(v: BadgeVariant) { this._variant.set(v); }
  /** Hides the leading dot — for badges that are counts rather than states. */
  @Input() dot = true;

  readonly classes = computed(() => {
    const tone = {
      success: 'pill-done',
      warning: 'pill-attention',
      danger: 'pill-critical',
      neutral: 'pill-idle',
      info: 'pill-active',
    }[this._variant()];
    return ['pill', tone, this.dot ? '' : 'pill-nodot'].filter(Boolean).join(' ');
  });
}
