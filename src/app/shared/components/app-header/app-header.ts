import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CreateSurveyModal } from '../../services/create-survey-modal';

@Component({
  selector: 'app-app-header',
  imports: [RouterLink],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
})
export class AppHeader {
  protected createSurveyModal = inject(CreateSurveyModal);
}
