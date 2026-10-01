import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppHeader } from '../../shared/components/app-header/app-header';
import { Survey } from '../../shared/interfaces/survey';
import { Supabase } from '../../shared/services/supabase';
import { CreateSurveyModal } from '../../shared/services/create-survey-modal';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-survey-overview',
  imports: [RouterLink, AppHeader],
  templateUrl: './survey-overview.html',
  styleUrl: './survey-overview.scss',
})
export class SurveyOverview {
  private supabase = inject(Supabase);
  private createSurveyModal = inject(CreateSurveyModal);

  categories = ['Team activities', 'Health & Wellness', 'Gaming & Entertainment', 'Education & Learning', 'Lifestyle & Preferences', 'Technology & Innovation'];
  selectedCategory = signal('');
  showPast = signal(false);

  surveys = signal<Survey[]>([]);
  loading = signal(true);
  error = signal('');

  activeSurveys = computed(() => this.surveys().filter((survey) => !this.isPast(survey)));

  // Die 3 aktiven Umfragen, die als nächstes enden
  endingSoon = computed(() => this.activeSurveys().filter((survey) => survey.end_date).slice(0, 3));

  // Liste unten: aktive oder vergangene Umfragen, optional nach Kategorie gefiltert
  listedSurveys = computed(() =>
    this.surveys()
      .filter((survey) => this.isPast(survey) === this.showPast())
      .filter((survey) => !this.selectedCategory() || survey.category === this.selectedCategory()),
  );

  // Lädt beim Start und erneut, sobald im Modal eine Umfrage veröffentlicht wurde
  constructor() {
    effect(() => {
      this.createSurveyModal.published();
      untracked(() => this.loadSurveys());
    });
  }

  async loadSurveys() {
    try {
      this.surveys.set(await this.supabase.getSurveys());
    } catch {
      this.error.set('Surveys could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  selectCategory(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedCategory.set(select.value);
    select.value = '';
  }

  isPast(survey: Survey): boolean {
    return !!survey.end_date && this.daysLeft(survey.end_date) < 0;
  }

  endsIn(survey: Survey): string {
    if (!survey.end_date) return 'No end date';
    const days = this.daysLeft(survey.end_date);
    if (days < 0) return 'Ended';
    if (days === 0) return 'Ends today';
    return `Ends in ${days} ${days === 1 ? 'Day' : 'Days'}`;
  }

  // Ganze Tage zwischen heute und dem Enddatum (negativ = schon vorbei)
  private daysLeft(endDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(`${endDate}T00:00:00`);
    return Math.round((end.getTime() - today.getTime()) / DAY_IN_MS);
  }
}
