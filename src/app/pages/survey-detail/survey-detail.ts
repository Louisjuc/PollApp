import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QuestionWithOptions, SurveyWithQuestions } from '../../shared/interfaces/survey';
import { Supabase } from '../../shared/services/supabase';

@Component({
  selector: 'app-survey-detail',
  imports: [RouterLink],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(Supabase);

  survey = signal<SurveyWithQuestions | null>(null);
  loading = signal(true);
  error = signal('');
  sending = signal(false);
  voted = signal(false);

  selectedAnswers = signal<Record<number, number[]>>({});

  // Abstimmen geht erst, wenn jede Frage mindestens eine Antwort hat
  allAnswered = computed(() => {
    const questions = this.survey()?.questions ?? [];
    return questions.length > 0 && questions.every((q) => (this.selectedAnswers()[q.id] ?? []).length > 0);
  });

  // Ergebnisse je Frage: Anteil jeder Antwort an allen Stimmen der Frage in Prozent
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

  isEnded = computed(() => {
    const endDate = this.survey()?.end_date;
    if (!endDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${endDate}T00:00:00`) < today;
  });

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

  letter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  // "2026-09-30" -> "30.09.2026"
  formatDate(date: string): string {
    return date.split('-').reverse().join('.');
  }

  isSelected(questionId: number, answerId: number): boolean {
    return (this.selectedAnswers()[questionId] ?? []).includes(answerId);
  }

  toggleAnswer(question: QuestionWithOptions, answerId: number): void {
    this.selectedAnswers.update((selected) => {
      const current = selected[question.id] ?? [];

      if (!question.multiple) {
        return { ...selected, [question.id]: [answerId] };
      }

      return {
        ...selected,
        [question.id]: current.includes(answerId)
          ? current.filter((id) => id !== answerId)
          : [...current, answerId],
      };
    });
  }

  async submit(): Promise<void> {
    this.sending.set(true);
    this.error.set('');
    try {
      await this.supabase.vote(Object.values(this.selectedAnswers()).flat());
      this.voted.set(true);
      this.survey.set(await this.supabase.getSurvey(this.survey()!.id));
    } catch {
      this.error.set('Your answers could not be saved. Please try again.');
    } finally {
      this.sending.set(false);
    }
  }
}
