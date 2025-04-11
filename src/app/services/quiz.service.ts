// src/app/services/quiz.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, shareReplay } from 'rxjs/operators';
import { Question } from '../models/questions.interface';
import { QuizAttempt } from '../models/quiz-attempt.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private readonly apiUrl = environment.apiUrl;
  private readonly currentUserId = 1; // In a real app, this would come from authentication service

  constructor(private http: HttpClient) {}

  getQuestions(moduleId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/questions/${moduleId}`).pipe(
      tap(questions => console.log(`Loaded ${questions.length} questions for module ${moduleId}`)),
      catchError(error => {
        console.error('Error loading questions:', error);
        // Fallback to local file if API fails - in production, you might want a better error strategy
        return this.http.get<Question[]>(`/assets/module-${moduleId}.json`);
      }),
      shareReplay(1) // Cache the response
    );
  }

  submitAttempt(attempt: Omit<QuizAttempt, 'userId' | 'id' | 'timestamp'>): Observable<QuizAttempt> {
    const fullAttempt: QuizAttempt = {
      ...attempt,
      userId: this.currentUserId,
      timestamp: Date.now(),
      id: crypto.randomUUID(), // More reliable ID generation
    };

    return this.http.post<QuizAttempt>(`${this.apiUrl}/attempts`, fullAttempt).pipe(
      catchError(error => {
        console.error('Failed to submit attempt to server:', error);
        return of(fullAttempt); // Return the attempt even if submission fails
      })
    );
  }

  getAttempts(moduleId?: number): Observable<QuizAttempt[]> {
    const url = moduleId 
      ? `${this.apiUrl}/attempts?userId=${this.currentUserId}&moduleId=${moduleId}` 
      : `${this.apiUrl}/attempts?userId=${this.currentUserId}`;
    
    return this.http.get<QuizAttempt[]>(url).pipe(
      catchError(error => {
        console.error('Error loading attempts:', error);
        return of([]);
      })
    );
  }

  getUserAttempts(userId: number): Observable<QuizAttempt[]> {
    return this.http.get<QuizAttempt[]>(`${this.apiUrl}/attempts?userId=${userId}`).pipe(
      catchError(error => {
        console.error('Error loading user attempts:', error);
        return of([]);
      })
    );
  }

  resetProgress(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/attempts?userId=${this.currentUserId}`).pipe(
      catchError(error => {
        console.error('Error resetting progress:', error);
        return of(void 0);
      })
    );
  }
}