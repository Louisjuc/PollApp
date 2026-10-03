import { Injectable, signal } from '@angular/core';

/**
 * App-wide service that controls a single toast notification.
 * Only one toast is visible at a time; showing a new one replaces the current one.
 */
@Injectable({ providedIn: 'root' })
export class Toast {
  /** Text of the currently visible toast; an empty string means no toast is shown. */
  message = signal('');

  /** Timer that hides the toast automatically after its duration. */
  private timeout?: ReturnType<typeof setTimeout>;

  /** Resolves the promise returned by the last `show()` call once the toast disappears. */
  private resolveHidden?: () => void;

  /**
   * Shows a toast with the given text and hides it automatically after `duration` milliseconds.
   * Any toast that is already visible is hidden first.
   * @param message Text to display in the toast.
   * @param duration Time in milliseconds until the toast is hidden (default: 3000).
   * @returns A promise that resolves as soon as this toast has been hidden.
   */
  show(message: string, duration = 3000): Promise<void> {
    this.hide();
    this.message.set(message);
    this.timeout = setTimeout(() => this.hide(), duration);
    return new Promise((resolve) => (this.resolveHidden = resolve));
  }

  /**
   * Hides the current toast immediately, cancels its timer
   * and resolves the promise of the corresponding `show()` call.
   */
  hide(): void {
    clearTimeout(this.timeout);
    this.message.set('');
    this.resolveHidden?.();
    this.resolveHidden = undefined;
  }
}
