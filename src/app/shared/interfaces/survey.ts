// Eine Zeile aus der Tabelle "surveys"
export interface Survey {
  id: number;
  created_at: string;
  title: string;
  description: string | null;
  category: string;
  end_date: string | null;
}

// Eine Zeile aus der Tabelle "questions"
export interface Question {
  id: number;
  survey_id: number;
  text: string;
  multiple: boolean;
  position: number;
}

// Eine Zeile aus der Tabelle "options" (Antwortmöglichkeiten)
export interface Option {
  id: number;
  question_id: number;
  text: string;
  position: number;
}

// Antwortmöglichkeit inkl. Anzahl der Stimmen
export interface OptionWithVotes extends Option {
  votes: { count: number }[];
}

// Frage inkl. ihrer Antwortmöglichkeiten
export interface QuestionWithOptions extends Question {
  options: OptionWithVotes[];
}

// Umfrage inkl. aller Fragen und Antworten (für die Detailseite)
export interface SurveyWithQuestions extends Survey {
  questions: QuestionWithOptions[];
}

// Daten aus dem Formular in Create Survey
export interface NewSurvey {
  name: string;
  description: string;
  category: string;
  endDate: string;
  questions: {
    text: string;
    multiple: boolean;
    answers: string[];
  }[];
}
