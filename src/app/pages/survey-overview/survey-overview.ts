import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppHeader } from '../../shared/components/app-header/app-header';

@Component({
  selector: 'app-survey-overview',
  imports: [RouterLink, AppHeader],
  templateUrl: './survey-overview.html',
  styleUrl: './survey-overview.scss',
})
export class SurveyOverview {}
