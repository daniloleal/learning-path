export interface QuizAttempt {
  id?: string;
  userId: number;
  moduleId: string; // Changed from number to string to match DB structure
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