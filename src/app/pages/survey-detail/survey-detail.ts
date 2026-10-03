import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QuestionWithOptions, SurveyWithQuestions } from '../../shared/interfaces/survey';
import { Supabase } from '../../shared/services/supabase';
import { CreateSurveyModal } from '../../shared/services/create-survey-modal';

/**
 * Detail page of a single survey.
 * Shows all questions with their answer options, lets the user vote
 * and displays the current results per question.
 */
@Component({
  selector: 'app-survey-detail',
  imports: [RouterLink],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetail implements OnInit {
  /** Current route; provides the survey id from the URL. */
  private route = inject(ActivatedRoute);

  /** Service used to load the survey and to save votes. */
  private supabase = inject(Supabase);

  /** Shared modal state; used by the template to open the create-survey dialog. */
  protected createSurveyModal = inject(CreateSurveyModal);

  /** The loaded survey including questions, options and votes; `null` until it has been loaded. */
  survey = signal<SurveyWithQuestions | null>(null);

  /** `true` while the survey is being loaded for the first time. */
  loading = signal(true);

  /** Error message shown to the user; empty if there is no error. */
  error = signal('');

  /** `true` while the votes are being saved. */
  sending = signal(false);

  /** Selected answer option ids, keyed by question id. */
  selectedAnswers = signal<Record<number, number[]>>({});

  /** `true` once every question has at least one selected answer; voting is only possible then. */
  allAnswered = computed(() => {
    const questions = this.survey()?.questions ?? [];
    return (
      questions.length > 0 &&
      questions.every((q) => (this.selectedAnswers()[q.id] ?? []).length > 0)
    );
  });

  /**
   * Results per question: the total number of votes and, for every answer option,
   * its share of all votes of that question in percent (rounded; 0 if there are no votes yet).
   */
  results = computed(() =>
    (this.survey()?.questions ?? []).map((question) => {
      const counts = question.options.map((option) => option.votes[0]?.count ?? 0);
      const total = counts.reduce((sum, count) => sum + count, 0);
      return {
        id: question.id,
        text: question.text,
        total,
        options: question.options.map((option, i) => ({
          id: option.id,
          percent: total ? Math.round((counts[i] / total) * 100) : 0,
        })),
      };
    }),
  );

  /** `true` if the survey has an end date that lies before today. */
  isEnded = computed(() => {
    const endDate = this.survey()?.end_date;
    if (!endDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${endDate}T00:00:00`) < today;
  });

  /**
   * Reads the survey id from the URL and loads the survey.
   * Sets an error message if loading fails and ends the loading state in any case.
   */
  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    try {
      this.survey.set(await this.supabase.getSurvey(id));
    } catch {
      this.error.set('Survey could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Converts a zero-based index into a capital letter for labelling answers.
   * @param index Zero-based index (0 → "A", 1 → "B", ...).
   * @returns The corresponding capital letter.
   */
  letter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  /**
   * Converts a date from `YYYY-MM-DD` to `DD.MM.YYYY`.
   * @param date Date string such as "2026-09-30".
   * @returns The formatted date, e.g. "30.09.2026".
   */
  formatDate(date: string): string {
    return date.split('-').reverse().join('.');
  }

  /**
   * Checks whether an answer option is currently selected.
   * @param questionId Id of the question the answer belongs to.
   * @param answerId Id of the answer option.
   * @returns `true` if the answer is selected.
   */
  isSelected(questionId: number, answerId: number): boolean {
    return (this.selectedAnswers()[questionId] ?? []).includes(answerId);
  }

  /**
   * Selects or deselects an answer option.
   * For single-choice questions the clicked answer replaces any previous selection
   * (clicking it again deselects it); for multiple-choice questions it is added or removed.
   * @param question The question the answer belongs to.
   * @param answerId Id of the clicked answer option.
   */
  toggleAnswer(question: QuestionWithOptions, answerId: number): void {
    this.selectedAnswers.update((selected) => {
      const current = selected[question.id] ?? [];

      if (!question.multiple) {
        return { ...selected, [question.id]: current.includes(answerId) ? [] : [answerId] };
      }

      return {
        ...selected,
        [question.id]: current.includes(answerId)
          ? current.filter((id) => id !== answerId)
          : [...current, answerId],
      };
    });
  }

  /**
   * Saves a vote for every selected answer, clears the selection
   * and reloads the survey so the results show the new votes.
   * Sets an error message if saving fails.
   */
  async submit(): Promise<void> {
    this.sending.set(true);
    this.error.set('');
    try {
      await this.supabase.vote(Object.values(this.selectedAnswers()).flat());
      this.selectedAnswers.set({});
      this.survey.set(await this.supabase.getSurvey(this.survey()!.id));
    } catch {
      this.error.set('Your answers could not be saved. Please try again.');
    } finally {
      this.sending.set(false);
    }
  }
}
