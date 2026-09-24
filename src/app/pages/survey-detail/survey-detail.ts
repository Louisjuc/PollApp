import { Component, signal } from '@angular/core';

interface Answer {
  id: number;
  text: string;
}

interface Question {
  id: number;
  text: string;
  multiple: boolean;
  answers: Answer[];
}

@Component({
  selector: 'app-survey-detail',
  imports: [],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetail {
  questions: Question[] = [
    {
      id: 1,
      text: 'Which days would work for you?',
      multiple: true,
      answers: [
        { id: 1, text: 'Monday' },
        { id: 2, text: 'Tuesday' },
        { id: 3, text: 'Wednesday' },
        { id: 4, text: 'Thursday' },
      ],
    },
    {
      id: 2,
      text: 'What time of day suits you best?',
      multiple: true,
      answers: [
        { id: 1, text: 'Morning' },
        { id: 2, text: 'Midday' },
        { id: 3, text: 'Afternoon' },
        { id: 4, text: 'Evening' },
      ],
    },
    {
      id: 3,
      text: 'Which topics should we cover?',
      multiple: true,
      answers: [
        { id: 1, text: 'Project status' },
        { id: 2, text: 'Roadmap' },
        { id: 3, text: 'Team feedback' },
        { id: 4, text: 'Open questions' },
      ],
    },
    {
      id: 4,
      text: 'How would you like to join?',
      multiple: true,
      answers: [
        { id: 1, text: 'On site' },
        { id: 2, text: 'Remote' },
        { id: 3, text: 'Either works for me' },
      ],
    },
  ];

  selectedAnswers = signal<Record<number, number[]>>({});

  letter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  isSelected(questionId: number, answerId: number): boolean {
    return (this.selectedAnswers()[questionId] ?? []).includes(answerId);
  }

  toggleAnswer(question: Question, answerId: number): void {
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
}
