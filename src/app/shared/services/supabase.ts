import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { NewSurvey, Survey, SurveyWithQuestions } from '../interfaces/survey';

type NewQuestion = NewSurvey['questions'][number];

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
    const surveyId = await this.insertSurvey(form);
    for (const [index, question] of form.questions.entries()) {
      const questionId = await this.insertQuestion(surveyId, question, index + 1);
      await this.insertOptions(questionId, question.answers);
    }
    return surveyId;
  }

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

  private async insertQuestion(surveyId: number, question: NewQuestion, position: number): Promise<number> {
    const { data, error } = await this.client
      .from('questions')
      .insert({ survey_id: surveyId, text: question.text, multiple: question.multiple, position })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  // Leere Antworten werden übersprungen
  private async insertOptions(questionId: number, answers: string[]): Promise<void> {
    const options = answers
      .filter((answer) => answer.trim())
      .map((text, index) => ({ question_id: questionId, text, position: index + 1 }));
    const { error } = await this.client.from('options').insert(options);
    if (error) throw error;
  }
}
