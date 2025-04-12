import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, shareReplay, retry, map } from 'rxjs/operators';
import { Question } from '../models/questions.interface';
import { QuizAttempt } from '../models/quiz-attempt.interface';
import { environment } from '../../environments/environment';

/**
 * Service responsible for quiz data management including questions and user attempts
 */
@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private readonly apiUrl = environment.apiUrl;
  private readonly currentUserId = 1; // In a real app, this would come from authentication service
  private cacheQuestions: Map<string, Observable<Question[]>> = new Map();

  constructor(private http: HttpClient) {}

  /**
   * Get questions for a specific module for the current user
   * @param moduleId The module ID to fetch questions for
   * @returns Observable of Question array
   */
  getQuestions(moduleId: number): Observable<Question[]> {
    // Generate cache key that includes user ID
    const cacheKey = `user-${this.currentUserId}-module-${moduleId}`;
    
    // Check if we already have this module's questions in cache
    if (this.cacheQuestions.has(cacheKey)) {
      return this.cacheQuestions.get(cacheKey)!;
    }

    // If not in cache, fetch from API with userId parameter
    const request$ = this.http.get<any>(`${this.apiUrl}/user-questions/${this.currentUserId}/${moduleId}`).pipe(
      retry(1), // Retry failed request once
      tap(response => {
        console.log(`Loaded questions for user ${this.currentUserId}, module ${moduleId}`);
      }),
      // Extract the questions array from the response
      map(response => {
        // If the response is an array of objects with a questions property, return the first one
        if (Array.isArray(response) && response.length > 0 && response[0].questions) {
          return response[0].questions;
        }
        // If the response itself has a questions property
        else if (response && response.questions) {
          return response.questions;
        }
        // Otherwise return empty array
        return [];
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error loading questions:', error);
        // Fallback to local file if API fails
        return this.http.get<Question[]>(`/assets/user-${this.currentUserId}-module-${moduleId}.json`).pipe(
          catchError(() => {
            // If local file also fails, return empty array
            return throwError(() => new Error('Failed to load questions from both API and fallback'));
          })
        );
      }),
      shareReplay(1) // Cache the response
    );

    // Store in cache
    this.cacheQuestions.set(cacheKey, request$);
    
    return request$;
  }

  /**
   * Submit a quiz attempt
   * @param attempt The quiz attempt without user ID, ID, and timestamp
   * @returns Observable of the saved quiz attempt
   */
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

  /**
   * Get attempts for a specific module or all attempts if no module ID provided
   * @param moduleId Optional module ID to filter attempts
   * @returns Observable of quiz attempts
   */
  getAttempts(moduleId?: number): Observable<QuizAttempt[]> {
    let url: string;
    
    if (moduleId) {
      // Use the new user-attempts endpoint that supports filtering by both userId and moduleId
      url = `${this.apiUrl}/user-attempts/${this.currentUserId}/${moduleId}`;
    } else {
      // Get all attempts for the current user
      url = `${this.apiUrl}/user-attempts/${this.currentUserId}`;
    }
    
    return this.http.get<QuizAttempt[]>(url).pipe(
      catchError(error => {
        console.error('Error loading attempts:', error);
        return of([]);
      })
    );
  }

  /**
   * Get attempts for a specific user
   * @param userId The user ID to get attempts for
   * @returns Observable of quiz attempts
   */
  getUserAttempts(userId: number): Observable<QuizAttempt[]> {
    return this.http.get<QuizAttempt[]>(`${this.apiUrl}/user-attempts/${userId}`).pipe(
      catchError(error => {
        console.error('Error loading user attempts:', error);
        return of([]);
      })
    );
  }

  /**
   * Reset all progress for the current user
   * @returns Observable indicating completion
   */
  resetProgress(): Observable<void> {
    // This would need to be updated in a real API to support deleting by userId
    // For now we'll stick with the original implementation but log a warning
    console.warn('resetProgress should be updated to delete only current user attempts');
    return this.http.delete<void>(`${this.apiUrl}/attempts?userId=${this.currentUserId}`).pipe(
      catchError(error => {
        console.error('Error resetting progress:', error);
        return of(void 0);
      })
    );
  }

  /**
   * Clear the questions cache
   * @param moduleId Optional specific module to clear, otherwise clear all
   */
  clearCache(moduleId?: number): void {
    if (moduleId !== undefined) {
      const cacheKey = `user-${this.currentUserId}-module-${moduleId}`;
      this.cacheQuestions.delete(cacheKey);
    } else {
      this.cacheQuestions.clear();
    }
  }
}