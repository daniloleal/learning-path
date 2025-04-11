export interface QuizAttempt {
  id?: string;
  userId: number;
  moduleId: number;
  score: number;
  total: number;
  duration: number;
  timestamp: number;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  question: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
}
