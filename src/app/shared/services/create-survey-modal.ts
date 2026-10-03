import { Injectable, signal } from '@angular/core';

/**
 * App-wide service that holds the state of the "create survey" dialog,
 * so it can be opened from anywhere (header, detail page, ...).
 */
@Injectable({ providedIn: 'root' })
export class CreateSurveyModal {
  /** Whether the create-survey dialog is currently visible. */
  isOpen = signal(false);

  /**
   * Counter that is incremented every time a survey has been published.
   * Components that show survey lists react to changes of this value and reload their data.
   */
  published = signal(0);

  /** Opens the create-survey dialog. */
  open(): void {
    this.isOpen.set(true);
  }

  /** Closes the create-survey dialog. */
  close(): void {
    this.isOpen.set(false);
  }
}
