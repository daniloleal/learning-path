import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, tap, shareReplay, retry, map, switchMap } from 'rxjs/operators';
import { Question } from '../models/questions.interface';
import { QuizSubmission } from '../models/quiz-submission.interface';
import { environment } from '../../environments/environment';

/**
 * Service responsible for quiz data management including questions and user submissions
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
   * @param moduleId The module ID to fetch questions for (can be string or number)
   * @returns Observable of Question array
   */
  getQuestions(moduleId: string | number): Observable<Question[]> {
    // Generate cache key that includes user ID
    const cacheKey = `user-${this.currentUserId}-module-${moduleId}`;
    
    // Check if we already have this module's questions in cache
    if (this.cacheQuestions.has(cacheKey)) {
      return this.cacheQuestions.get(cacheKey)!;
    }

    // If not in cache, fetch from API with userId parameter
    const request$ = this.http.get<any>(`${this.apiUrl}/questions?moduleId=${moduleId}`).pipe(
      retry(1), // Retry failed request once
      tap(response => {
        console.log(`Loaded questions for module ${moduleId}`);
      }),
      // Extract the questions array from the response or return the response itself if it's an array
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        // If the response is an object with a questions property, return that
        else if (response && response.questions) {
          return response.questions;
        }
        // Otherwise return empty array
        return [];
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error loading questions:', error);
        // Fallback to local file if API fails
        return this.http.get<Question[]>(`/assets/module-${moduleId}.json`).pipe(
          catchError(() => {
            // If local file also fails, return empty array
            console.error('Failed to load questions from both API and fallback');
            return of([]);
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
   * Submit a quiz submission
   * @param submission The quiz submission without user ID, ID, and timestamp
   * @returns Observable of the saved quiz submission
   */
  submitSubmission(submission: Omit<QuizSubmission, 'userId' | 'id' | 'timestamp'>): Observable<QuizSubmission> {
    const fullSubmission: QuizSubmission = {
      ...submission,
      userId: this.currentUserId,
      timestamp: Date.now(),
      id: crypto.randomUUID(), // More reliable ID generation
    };

    return this.http.post<QuizSubmission>(`${this.apiUrl}/submissions`, fullSubmission).pipe(
      catchError(error => {
        console.error('Failed to submit submission to server:', error);
        return of(fullSubmission); // Return the submission even if submission fails
      })
    );
  }

  /**
   * Get submissions for a specific module or all submissions if no module ID provided
   * @param moduleId Optional module ID to filter submissions
   * @returns Observable of quiz submissions
   */
  getSubmissions(moduleId?: number | string): Observable<QuizSubmission[]> {
    let url: string;
    
    if (moduleId) {
      // Use the new user-submissions endpoint that supports filtering by both userId and moduleId
      url = `${this.apiUrl}/submissions?userId=${this.currentUserId}&moduleId=${moduleId}`;
    } else {
      // Get all submissions for the current user
      url = `${this.apiUrl}/submissions?userId=${this.currentUserId}`;
    }
    
    return this.http.get<QuizSubmission[]>(url).pipe(
      catchError(error => {
        console.error('Error loading submissions:', error);
        return of([]);
      })
    );
  }

  /**
   * Get submissions for a specific user
   * @param userId The user ID to get submissions for
   * @returns Observable of quiz submissions
   */
  getUserSubmissions(userId: number): Observable<QuizSubmission[]> {
    return this.http.get<QuizSubmission[]>(`${this.apiUrl}/submissions?userId=${userId}`).pipe(
      catchError(error => {
        console.error('Error loading user submissions:', error);
        return of([]);
      })
    );
  }

  /**
   * Delete all submissions for a specific topic
   * @param topicId The topic ID to delete submissions for
   * @returns Observable indicating completion
   */
  deleteSubmissionsForTopic(topicId: string): Observable<void> {
    // First, we need to get all modules for this topic
    return this.http.get<any[]>(`${this.apiUrl}/modules?topicId=${topicId}`).pipe(
      map(modules => modules.map(module => module.id)),
      switchMap(moduleIds => {
        // If there are no modules, just return completed
        if (!moduleIds || moduleIds.length === 0) {
          return of(undefined);
        }
        
        // Create deletion requests for each module's submissions
        const deletionRequests = moduleIds.map(moduleId => 
          this.http.delete(`${this.apiUrl}/submissions?moduleId=${moduleId}`)
        );
        
        // Execute all deletion requests and wait for them to complete
        return forkJoin(deletionRequests).pipe(
          map(() => undefined), // Return void when all are complete
          catchError(error => {
            console.error('Error deleting submissions for modules:', error);
            return of(undefined);
          })
        );
      }),
      catchError(error => {
        console.error('Error getting modules for topic:', error);
        return of(undefined);
      })
    );
  }

  /**
   * Reset all progress for the current user
   * @returns Observable indicating completion
   */
  resetProgress(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/submissions?userId=${this.currentUserId}`).pipe(
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
  clearCache(moduleId?: number | string): void {
    if (moduleId !== undefined) {
      const cacheKey = `user-${this.currentUserId}-module-${moduleId}`;
      this.cacheQuestions.delete(cacheKey);
    } else {
      this.cacheQuestions.clear();
    }
  }
}
