import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Toast {
  message = signal('');

  private timeout?: ReturnType<typeof setTimeout>;
  private resolveHidden?: () => void;

  show(message: string, duration = 3000): Promise<void> {
    this.hide();
    this.message.set(message);
    this.timeout = setTimeout(() => this.hide(), duration);
    return new Promise((resolve) => (this.resolveHidden = resolve));
  }

  hide(): void {
    clearTimeout(this.timeout);
    this.message.set('');
    this.resolveHidden?.();
    this.resolveHidden = undefined;
  }
}
