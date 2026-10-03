import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CreateSurvey } from './shared/components/create-survey/create-survey';
import { CreateSurveyModal } from './shared/services/create-survey-modal';

/**
 * Root component of the application.
 * Renders the routed page and, on top of it, the "create survey" dialog whenever it is open.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CreateSurvey],
  templateUrl: './app.html',
})
export class App {
  /** Shared modal state; the template uses it to decide whether the create-survey dialog is shown. */
  protected createSurveyModal = inject(CreateSurveyModal);
}
