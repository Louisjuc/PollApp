import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Supabase } from '../../services/supabase';
import { Toast } from '../../services/toast';
import { ToastMessage } from '../toast/toast';
import { CreateSurveyModal } from '../../services/create-survey-modal';

type AnswerForm = FormControl<string>;

type QuestionForm = FormGroup<{
  text: FormControl<string>;
  multiple: FormControl<boolean>;
  answers: FormArray<AnswerForm>;
}>;

@Component({
  selector: 'app-create-survey',
  imports: [ReactiveFormsModule, ToastMessage],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
  host: { '(document:keydown.escape)': 'close()' },
})
export class CreateSurvey implements OnInit, OnDestroy {
  private fb = inject(FormBuilder).nonNullable;
  private supabase = inject(Supabase);
  private router = inject(Router);
  private toast = inject(Toast);
  private modal = inject(CreateSurveyModal);

  saving = signal(false);
  error = signal('');

  categories = ['Team activities', 'Health & Wellness', 'Gaming & Entertainment', 'Education & Learning', 'Lifestyle & Preferences', 'Technology & Innovation'];

  form = this.fb.group({
    name: ['', Validators.required],
    endDate: [''],
    category: ['', Validators.required],
    description: [''],
    questions: this.fb.array<QuestionForm>([this.createQuestion()]),
  });

  // Seite hinter dem Modal soll nicht mitscrollen
  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  close(): void {
    this.modal.close();
  }

  get questions(): FormArray<QuestionForm> {
    return this.form.controls.questions;
  }

  answers(questionIndex: number): FormArray<AnswerForm> {
    return this.questions.at(questionIndex).controls.answers;
  }

  letter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  clearField(field: 'name' | 'endDate' | 'description'): void {
    this.form.controls[field].reset();
  }

  selectCategory(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.form.controls.category.setValue(select.value);
    this.form.controls.category.markAsTouched();
    select.value = '';
  }

  addQuestion(): void {
    this.questions.push(this.createQuestion());
  }

  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    } else {
      this.questions.at(0).reset();
    }
  }

  addAnswer(questionIndex: number): void {
    this.answers(questionIndex).push(this.createAnswer());
  }

  removeAnswer(questionIndex: number, answerIndex: number): void {
    const answers = this.answers(questionIndex);
    if (answers.length > 2) {
      answers.removeAt(answerIndex);
    } else {
      answers.at(answerIndex).reset();
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    try {
      await this.supabase.createSurvey(this.form.getRawValue());
      await this.toast.show('Your survey is now published');
      this.modal.published.update((count) => count + 1);
      this.close();
      this.router.navigate(['/']);
    } catch {
      this.error.set('Survey could not be saved. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  private createQuestion(): QuestionForm {
    return this.fb.group({
      text: ['', Validators.required],
      multiple: [false],
      answers: this.fb.array<AnswerForm>([this.createAnswer(), this.createAnswer()]),
    });
  }

  private createAnswer(): AnswerForm {
    return this.fb.control('', Validators.required);
  }
}
