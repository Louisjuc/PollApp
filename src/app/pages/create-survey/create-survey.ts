import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    console.log(this.form.getRawValue());
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
