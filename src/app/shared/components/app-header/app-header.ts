import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CreateSurveyModal } from '../../services/create-survey-modal';

/**
 * Header of the overview page with the logo link to the start page
 * and the button that opens the create-survey dialog.
 */
@Component({
  selector: 'app-app-header',
  imports: [RouterLink],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
})
export class AppHeader {
  /** Shared modal state; used by the template to open the create-survey dialog. */
  protected createSurveyModal = inject(CreateSurveyModal);
}
