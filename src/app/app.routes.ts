import { Routes } from '@angular/router';
import { SurveyOverview } from './pages/survey-overview/survey-overview';
import { SurveyDetail } from './pages/survey-detail/survey-detail';

export const routes: Routes = [
  { path: '', component: SurveyOverview },
  { path: 'survey-detail/:id', component: SurveyDetail },
];
