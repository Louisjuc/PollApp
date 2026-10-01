import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CreateSurvey } from './shared/components/create-survey/create-survey';
import { CreateSurveyModal } from './shared/services/create-survey-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CreateSurvey],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('pollapp');
  protected createSurveyModal = inject(CreateSurveyModal);
}
