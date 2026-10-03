import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { NewSurvey, Survey, SurveyWithQuestions } from '../interfaces/survey';

/** A single question of the create-survey form. */
type NewQuestion = NewSurvey['questions'][number];

/**
 * Data access service for all survey data stored in Supabase.
 * Every method throws the Supabase error if a request fails, so callers can show an error message.
 */
@Injectable({ providedIn: 'root' })
export class Supabase {
  /** Supabase client configured with the URL and key from the current environment. */
  private client = createClient(environment.supabaseUrl, environment.supabaseKey);

  /**
   * Loads all surveys for the overview page, sorted by end date (earliest first).
   * @returns All rows of the `surveys` table.
   */
  async getSurveys(): Promise<Survey[]> {
    const { data, error } = await this.client.from('surveys').select('*').order('end_date');
    if (error) throw error;
    return data;
  }

  /**
   * Loads one survey for the detail page including its questions, their answer options
   * and the vote count per option. Questions and options are sorted by their position.
   * @param id Id of the survey to load.
   * @returns The survey with nested questions, options and vote counts.
   */
  async getSurvey(id: number): Promise<SurveyWithQuestions> {
    const { data, error } = await this.client
      .from('surveys')
      .select('*, questions(*, options(*, votes(count)))')
      .eq('id', id)
      .order('position', { referencedTable: 'questions' })
      .order('position', { referencedTable: 'questions.options' })
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Saves one vote for every selected answer option.
   * @param optionIds Ids of all answer options the user selected.
   */
  async vote(optionIds: number[]): Promise<void> {
    const { error } = await this.client
      .from('votes')
      .insert(optionIds.map((option_id) => ({ option_id })));
    if (error) throw error;
  }

  /**
   * Saves a new survey from the create-survey form.
   * The survey is inserted first, then each question (numbered from 1) and its answer options,
   * because every level needs the id of the row it belongs to.
   * @param form Raw values of the create-survey form.
   */
  async createSurvey(form: NewSurvey): Promise<void> {
    const surveyId = await this.insertSurvey(form);
    for (const [index, question] of form.questions.entries()) {
      const questionId = await this.insertQuestion(surveyId, question, index + 1);
      await this.insertOptions(questionId, question.answers);
    }
  }

  /**
   * Inserts the survey row. Empty description and end date are stored as `null`.
   * @param form Raw values of the create-survey form.
   * @returns Id of the newly created survey.
   */
  private async insertSurvey(form: NewSurvey): Promise<number> {
    const { data, error } = await this.client
      .from('surveys')
      .insert({
        title: form.name,
        description: form.description || null,
        category: form.category,
        end_date: form.endDate || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  /**
   * Inserts one question row for the given survey.
   * @param surveyId Id of the survey the question belongs to.
   * @param question Question text and whether multiple answers are allowed.
   * @param position Order of the question within the survey, starting at 1.
   * @returns Id of the newly created question.
   */
  private async insertQuestion(surveyId: number, question: NewQuestion, position: number): Promise<number> {
    const { data, error } = await this.client
      .from('questions')
      .insert({ survey_id: surveyId, text: question.text, multiple: question.multiple, position })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  /**
   * Inserts the answer options of a question, numbered from 1.
   * Answers that are empty or contain only whitespace are skipped.
   * @param questionId Id of the question the answers belong to.
   * @param answers Answer texts in display order.
   */
  private async insertOptions(questionId: number, answers: string[]): Promise<void> {
    const options = answers
      .filter((answer) => answer.trim())
      .map((text, index) => ({ question_id: questionId, text, position: index + 1 }));
    const { error } = await this.client.from('options').insert(options);
    if (error) throw error;
  }
}
