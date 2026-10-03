import { Routes } from '@angular/router';
import { SurveyOverview } from './pages/survey-overview/survey-overview';
import { SurveyDetail } from './pages/survey-detail/survey-detail';

/**
 * Application routes.
 * - `''` shows the overview of all surveys.
 * - `survey-detail/:id` shows a single survey, where `:id` is the survey's database id.
 */
export const routes: Routes = [
  { path: '', component: SurveyOverview },
  { path: 'survey-detail/:id', component: SurveyDetail },
];
