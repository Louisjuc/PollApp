/** A row of the `surveys` table. */
export interface Survey {
  id: number;
  created_at: string;
  title: string;
  description: string | null;
  category: string;
  end_date: string | null;
}

/** A row of the `questions` table. */
export interface Question {
  id: number;
  survey_id: number;
  text: string;
  multiple: boolean;
  position: number;
}

/** A row of the `options` table, i.e. one possible answer to a question. */
export interface Option {
  id: number;
  question_id: number;
  text: string;
  position: number;
}

/** An answer option together with its vote count. */
export interface OptionWithVotes extends Option {
  votes: { count: number }[];
}

/** A question together with all of its answer options and their votes. */
export interface QuestionWithOptions extends Question {
  options: OptionWithVotes[];
}

/** A survey with all of its questions, answer options and votes (used on the detail page). */
export interface SurveyWithQuestions extends Survey {
  questions: QuestionWithOptions[];
}

/** The raw values of the create-survey form, before they are saved to the database. */
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
