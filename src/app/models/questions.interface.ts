export interface Question {
  id?: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}