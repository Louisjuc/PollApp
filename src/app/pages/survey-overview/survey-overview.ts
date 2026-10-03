import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppHeader } from '../../shared/components/app-header/app-header';
import { Survey } from '../../shared/interfaces/survey';
import { Supabase } from '../../shared/services/supabase';
import { CreateSurveyModal } from '../../shared/services/create-survey-modal';

/** Number of milliseconds in one day. */
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Start page that lists all surveys.
 * Shows the surveys ending soon and a list of active or past surveys
 * that can be filtered by category.
 */
@Component({
  selector: 'app-survey-overview',
  imports: [RouterLink, AppHeader],
  templateUrl: './survey-overview.html',
  styleUrl: './survey-overview.scss',
})
export class SurveyOverview {
  /** Service used to load the surveys. */
  private supabase = inject(Supabase);

  /** Shared modal state; used to reload the list after a survey was published. */
  private createSurveyModal = inject(CreateSurveyModal);

  /** All categories available in the category filter. */
  categories = [
    'Team activities',
    'Health & Wellness',
    'Gaming & Entertainment',
    'Education & Learning',
    'Lifestyle & Preferences',
    'Technology & Innovation',
  ];

  /** Category used to filter the list; an empty string shows all categories. */
  selectedCategory = signal('');

  /** Whether the list shows past surveys (`true`) or active surveys (`false`). */
  showPast = signal(false);

  /** All surveys loaded from the database. */
  surveys = signal<Survey[]>([]);

  /** `true` until the surveys have been loaded for the first time. */
  loading = signal(true);

  /** Error message shown to the user; empty if there is no error. */
  error = signal('');

  /** All surveys that have not ended yet (including surveys without an end date). */
  activeSurveys = computed(() => this.surveys().filter((survey) => !this.isPast(survey)));

  /** The three active surveys with an end date that end next (the list is already sorted by end date). */
  endingSoon = computed(() =>
    this.activeSurveys()
      .filter((survey) => survey.end_date)
      .slice(0, 3),
  );

  /** Surveys shown in the list: either active or past ones (see `showPast`), optionally filtered by category. */
  listedSurveys = computed(() =>
    this.surveys()
      .filter((survey) => this.isPast(survey) === this.showPast())
      .filter((survey) => !this.selectedCategory() || survey.category === this.selectedCategory()),
  );

  /**
   * Loads the surveys when the page is created and again every time
   * a survey has been published in the create-survey dialog.
   */
  constructor() {
    effect(() => {
      this.createSurveyModal.published();
      untracked(() => this.loadSurveys());
    });
  }

  /**
   * Loads all surveys from the database.
   * Sets an error message if loading fails and ends the loading state in any case.
   */
  async loadSurveys() {
    try {
      this.surveys.set(await this.supabase.getSurveys());
    } catch {
      this.error.set('Surveys could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Applies the category chosen in the dropdown as filter
   * and resets the dropdown so it shows its placeholder again.
   * @param event Change event of the category select.
   */
  selectCategory(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedCategory.set(select.value);
    select.value = '';
  }

  /**
   * Checks whether a survey has already ended.
   * @param survey The survey to check.
   * @returns `true` if the survey has an end date before today.
   */
  isPast(survey: Survey): boolean {
    return !!survey.end_date && this.daysLeft(survey.end_date) < 0;
  }

  /**
   * Builds the text that tells the user when a survey ends.
   * @param survey The survey to describe.
   * @returns "No end date", "Ended", "Ends today" or "Ends in X Day(s)".
   */
  endsIn(survey: Survey): string {
    if (!survey.end_date) return 'No end date';
    const days = this.daysLeft(survey.end_date);
    if (days < 0) return 'Ended';
    if (days === 0) return 'Ends today';
    return `Ends in ${days} ${days === 1 ? 'Day' : 'Days'}`;
  }

  /**
   * Calculates the number of whole days between today and the end date.
   * @param endDate End date in the format `YYYY-MM-DD`.
   * @returns Days left; 0 means it ends today, a negative value means it has already ended.
   */
  private daysLeft(endDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(`${endDate}T00:00:00`);
    return Math.round((end.getTime() - today.getTime()) / DAY_IN_MS);
  }
}
