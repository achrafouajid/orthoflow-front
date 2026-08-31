import { Component, Input, computed, signal } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Thin wrapper over the `.btn` primitives in `styles.css`.
 *
 * It deliberately owns no colours of its own. It previously carried a full
 * copy of the button styles in its `styles: []` block, which made it a
 * seventh competing definition of `.btn-primary` rather than the cure for
 * the other six — and it had drifted to the structural navy, so its
 * "primary" was a different colour from every `class="btn btn-primary"`
 * elsewhere in the product.
 *
 * Prefer `class="btn btn-primary"` on a plain `<button>`. Reach for this
 * component when a variant needs to be bound at runtime.
 *
 * Click events bubble from the inner button to the host, so callers bind
 * `(click)` on `<app-button>` directly.
 */
@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button [type]="type" [disabled]="disabled" [class]="classes()">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    button { width: 100%; }
  `],
})
export class ButtonComponent {
  private readonly _variant = signal<ButtonVariant>('primary');
  private readonly _size = signal<ButtonSize>('md');

  @Input() set variant(v: ButtonVariant) { this._variant.set(v); }
  @Input() set size(v: ButtonSize) { this._size.set(v); }
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;

  /* Written as whole literal class names so Tailwind's content scanner
     sees them — a concatenated `'btn-' + variant` is invisible to it. */
  readonly classes = computed(() => {
    const variant = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      danger: 'btn-danger',
      ghost: 'btn-ghost',
    }[this._variant()];
    const size = { sm: 'btn-sm', md: '', lg: 'btn-lg' }[this._size()];
    return ['btn', variant, size].filter(Boolean).join(' ');
  });
}
