import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Supabase } from '@shared/services/supabase';
import { Toast } from '@shared/services/toast';
import { ToastMessage } from '@shared/components/toast/toast';
import { CreateSurveyModal } from '@shared/services/create-survey-modal';

/** Form control holding the text of one answer. */
type AnswerForm = FormControl<string>;

/** Form group of one question: its text, whether multiple answers are allowed, and its answers. */
type QuestionForm = FormGroup<{
  text: FormControl<string>;
  multiple: FormControl<boolean>;
  answers: FormArray<AnswerForm>;
}>;

/**
 * Dialog for creating and publishing a new survey.
 * Contains the general survey data and a dynamic list of questions with their answers.
 * Pressing Escape closes the dialog.
 */
@Component({
  selector: 'app-create-survey',
  imports: [ReactiveFormsModule, ToastMessage],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
  host: { '(document:keydown.escape)': 'close()' },
})
export class CreateSurvey implements OnInit, OnDestroy {
  /** Form builder whose controls reset to their initial value instead of `null`. */
  private fb = inject(FormBuilder).nonNullable;

  /** Service used to save the new survey. */
  private supabase = inject(Supabase);

  /** Router used to return to the overview after publishing. */
  private router = inject(Router);

  /** Service used to show the success message. */
  private toast = inject(Toast);

  /** Shared modal state; used to close the dialog and to notify that a survey was published. */
  private modal = inject(CreateSurveyModal);

  /** `true` while the survey is being saved; disables the publish button. */
  saving = signal(false);

  /** Error message shown below the form; empty if there is no error. */
  error = signal('');

  /** All categories the user can choose from. */
  categories = ['Team activities', 'Health & Wellness', 'Gaming & Entertainment', 'Education & Learning', 'Lifestyle & Preferences', 'Technology & Innovation'];

  /**
   * The create-survey form.
   * Name, category, every question text and every answer are required;
   * end date and description are optional. It starts with one question.
   */
  form = this.fb.group({
    name: ['', Validators.required],
    endDate: [''],
    category: ['', Validators.required],
    description: [''],
    questions: this.fb.array<QuestionForm>([this.createQuestion()]),
  });

  /** Disables scrolling of the page behind the dialog while it is open. */
  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
  }

  /** Re-enables scrolling of the page when the dialog is closed. */
  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  /** Closes the dialog. */
  close(): void {
    this.modal.close();
  }

  /** All question form groups of the form. */
  get questions(): FormArray<QuestionForm> {
    return this.form.controls.questions;
  }

  /**
   * Returns the answer controls of a question.
   * @param questionIndex Index of the question in the form.
   * @returns The form array with the question's answers.
   */
  answers(questionIndex: number): FormArray<AnswerForm> {
    return this.questions.at(questionIndex).controls.answers;
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
   * Clears one of the general input fields.
   * @param field Name of the form control to clear.
   */
  clearField(field: 'name' | 'endDate' | 'description'): void {
    this.form.controls[field].reset();
  }

  /**
   * Stores the category chosen in the dropdown, marks it as touched
   * and resets the dropdown so it shows its placeholder again.
   * @param event Change event of the category select.
   */
  selectCategory(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.form.controls.category.setValue(select.value);
    this.form.controls.category.markAsTouched();
    select.value = '';
  }

  /** Appends a new empty question with two empty answers. */
  addQuestion(): void {
    this.questions.push(this.createQuestion());
  }

  /**
   * Removes a question. The last remaining question is only cleared, so there is always at least one.
   * @param index Index of the question to remove.
   */
  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    } else {
      this.questions.at(0).reset();
    }
  }

  /**
   * Appends a new empty answer to a question.
   * @param questionIndex Index of the question.
   */
  addAnswer(questionIndex: number): void {
    this.answers(questionIndex).push(this.createAnswer());
  }

  /**
   * Removes an answer from a question. If the question only has two answers left,
   * the answer is cleared instead, so every question keeps at least two answers.
   * @param questionIndex Index of the question.
   * @param answerIndex Index of the answer within the question.
   */
  removeAnswer(questionIndex: number, answerIndex: number): void {
    const answers = this.answers(questionIndex);
    if (answers.length > 2) {
      answers.removeAt(answerIndex);
    } else {
      answers.at(answerIndex).reset();
    }
  }

  /**
   * Handles the form submit.
   * If the form is invalid, all fields are marked as touched so their validation messages appear.
   * Otherwise the survey is published and an error message is shown if saving fails.
   */
  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      await this.publish();
    } catch {
      this.error.set('Survey could not be saved. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Saves the survey, waits until the success toast has disappeared,
   * notifies the lists that a survey was published, closes the dialog and navigates to the overview.
   */
  private async publish(): Promise<void> {
    this.error.set('');
    await this.supabase.createSurvey(this.form.getRawValue());
    await this.toast.show('Your survey is now published');
    this.modal.published.update((count) => count + 1);
    this.close();
    this.router.navigate(['/']);
  }

  /**
   * Creates a new question form group with a required text,
   * single choice as default and two required empty answers.
   */
  private createQuestion(): QuestionForm {
    return this.fb.group({
      text: ['', Validators.required],
      multiple: [false],
      answers: this.fb.array<AnswerForm>([this.createAnswer(), this.createAnswer()]),
    });
  }

  /** Creates a new required, empty answer control. */
  private createAnswer(): AnswerForm {
    return this.fb.control('', Validators.required);
  }
}
