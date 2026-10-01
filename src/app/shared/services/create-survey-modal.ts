import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CreateSurveyModal {
  isOpen = signal(false);

  // Zählt hoch, sobald eine Umfrage veröffentlicht wurde, damit Listen neu laden können
  published = signal(0);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
