import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Supabase } from '../../shared/services/supabase';

type AnswerForm = FormControl<string>;

type QuestionForm = FormGroup<{
  text: FormControl<string>;
  multiple: FormControl<boolean>;
  answers: FormArray<AnswerForm>;
}>;

@Component({
  selector: 'app-create-survey',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})
export class CreateSurvey {
  private fb = inject(FormBuilder).nonNullable;
  private supabase = inject(Supabase);
  private router = inject(Router);

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
