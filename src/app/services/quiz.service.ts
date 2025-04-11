// src/app/services/quiz.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

interface Question {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface QuizAttempt {
  moduleId: number;
  score: number;
  total: number;
  duration: number;
  timestamp: number;
  answers: {
    question: string;
    selectedOption: number;
    correctOption: number;
    isCorrect: boolean;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private apiUrl = 'http://localhost:4000'; // Replace with your API endpoint
  private attempts: QuizAttempt[] = [];

  constructor(private http: HttpClient) {
    this.loadAttemptsFromStorage();
  }

  getQuestions(moduleId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/questions`).pipe(
    //return this.http.get<Question[]>(`${this.apiUrl}/questions/${moduleId}`).pipe(
      tap(value => console.log(value)),
      catchError(() => {
        // Fallback to local file if API fails
        console.log("error to load questions")
        return this.http.get<Question[]>(`/assets/module-${moduleId}.json`);
      })
    );
  }

  submitAttempt(attempt: QuizAttempt): Observable<any> {
    this.attempts.push(attempt);
    this.saveAttemptsToStorage();
    
    return this.http.post(`${this.apiUrl}/attempts`, attempt).pipe(
      catchError(error => {
        console.error('Failed to submit attempt to server:', error);
        return of(null); // Continue even if submission fails
      })
    );
  }

  getAttempts(moduleId?: number): QuizAttempt[] {
    if (moduleId) {
      return this.attempts.filter(a => a.moduleId === moduleId);
    }
    return this.attempts;
  }

  private loadAttemptsFromStorage() {
    const stored = localStorage.getItem('quizAttempts');
    if (stored) {
      this.attempts = JSON.parse(stored);
    }
  }

  private saveAttemptsToStorage() {
    localStorage.setItem('quizAttempts', JSON.stringify(this.attempts));
  }

  resetProgress() {
    this.attempts = [];
    localStorage.removeItem('quizAttempts');
  }
}