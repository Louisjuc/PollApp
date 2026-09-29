import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { NewSurvey, Survey, SurveyWithQuestions } from '../interfaces/survey';

@Injectable({ providedIn: 'root' })
export class Supabase {
  private client = createClient(environment.supabaseUrl, environment.supabaseKey);

  // Alle Umfragen für die Übersicht, optional nach Kategorie gefiltert
  async getSurveys(category?: string): Promise<Survey[]> {
    let query = this.client.from('surveys').select('*').order('end_date');
    if (category) {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Eine Umfrage inkl. Fragen, Antworten und Stimmenanzahl für die Detailseite
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

  // Für jede gewählte Antwort eine Stimme speichern
  async vote(optionIds: number[]): Promise<void> {
    const { error } = await this.client
      .from('votes')
      .insert(optionIds.map((option_id) => ({ option_id })));
    if (error) throw error;
  }

  // Neue Umfrage speichern: erst Umfrage, dann Fragen, dann Antworten
  async createSurvey(form: NewSurvey): Promise<number> {
    const { data: survey, error } = await this.client
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

    for (const [index, question] of form.questions.entries()) {
      const { data: savedQuestion, error: questionError } = await this.client
        .from('questions')
        .insert({
          survey_id: survey.id,
          text: question.text,
          multiple: question.multiple,
          position: index + 1,
        })
        .select()
        .single();
      if (questionError) throw questionError;

      const { error: optionsError } = await this.client.from('options').insert(
        question.answers
          .filter((answer) => answer.trim())
          .map((text, answerIndex) => ({
            question_id: savedQuestion.id,
            text,
            position: answerIndex + 1,
          })),
      );
      if (optionsError) throw optionsError;
    }

    return survey.id;
  }
}
