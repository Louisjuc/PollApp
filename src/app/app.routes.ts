import { Routes } from '@angular/router';
import { SurveyOverview } from './pages/survey-overview/survey-overview';
import { SurveyDetail } from './pages/survey-detail/survey-detail';
import { CreateSurvey } from './pages/create-survey/create-survey';

export const routes: Routes = [
  { path: '', component: SurveyOverview },
  { path: 'survey-detail', component: SurveyDetail },
  { path: 'create-survey', component: CreateSurvey },
];
