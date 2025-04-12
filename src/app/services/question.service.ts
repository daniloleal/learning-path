// src/app/services/question.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, concat, timer } from 'rxjs';
import { catchError, tap, shareReplay, map, switchMap } from 'rxjs/operators';
import { Question } from '../models/questions.interface';
import { environment } from '../../environments/environment';
import { ErrorHandlingService } from './error-handling.service';

/**
 * Enhanced Question interface that includes module and topic references
 */
export interface EnhancedQuestion extends Question {
  id?: string;        // Make id optional and explicit in the interface
  moduleId: string;   // Reference to the module ID (string format)
  level?: number;     // Module level (1-5)
  topicId?: string;   // Reference to the topic
}

/**
 * Service for managing quiz questions
 */
@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private readonly apiUrl = environment.apiUrl;
  private readonly currentUserId = 1; // In a real app, this would come from an auth service
  private questionsCache = new Map<string, Observable<EnhancedQuestion[]>>();

  constructor(
    private http: HttpClient,
    private errorHandling: ErrorHandlingService
  ) {}

  /**
   * Get questions for a specific module
   * @param moduleId Module ID (string) to get questions for
   * @param topicId Optional topic ID for more specific caching
   */
  getQuestions(moduleId: string, topicId?: string): Observable<EnhancedQuestion[]> {
    // Generate cache key that includes both module and topic if available
    const cacheKey = topicId ? `topic-${topicId}-module-${moduleId}` : `module-${moduleId}`;
    
    // Check cache first
    if (this.questionsCache.has(cacheKey)) {
      return this.questionsCache.get(cacheKey)!;
    }
    
    // Construct URL based on whether we have a topic ID
    const url = topicId 
      ? `${this.apiUrl}/questions?moduleId=${moduleId}&topicId=${topicId}`
      : `${this.apiUrl}/questions?moduleId=${moduleId}`;
    
    // Fetch from API
    const request$ = this.http.get<EnhancedQuestion[]>(url)
      .pipe(
        map(questions => questions || []),
        catchError(error => {
          this.errorHandling.handleError(error, `Error loading questions for module ${moduleId}`, false);
          return of([]);
        }),
        shareReplay(1)
      );
    
    // Store in cache
    this.questionsCache.set(cacheKey, request$);
    return request$;
  }

  /**
   * Get questions for a specific module level within a topic
   * @param topicId Topic ID
   * @param level Module level (1-5)
   */
  getQuestionsByLevel(topicId: string, level: number): Observable<EnhancedQuestion[]> {
    const cacheKey = `topic-${topicId}-level-${level}`;
    
    // Check cache first
    if (this.questionsCache.has(cacheKey)) {
      return this.questionsCache.get(cacheKey)!;
    }
    
    // Get questions from the API
    const url = `${this.apiUrl}/questions?topicId=${topicId}&level=${level}`;
    
    const request$ = this.http.get<EnhancedQuestion[]>(url)
      .pipe(
        map(questions => questions || []),
        catchError(error => {
          this.errorHandling.handleError(error, `Error loading questions for level ${level}`, false);
          return of([]);
        }),
        shareReplay(1)
      );
    
    // Store in cache
    this.questionsCache.set(cacheKey, request$);
    return request$;
  }

  /**
   * Save questions for a module
   * @param moduleId Module ID (string) to save questions for
   * @param questions Questions to save
   */
  saveQuestions(moduleId: string, questions: EnhancedQuestion[]): Observable<EnhancedQuestion[]> {
    // Create the batch save requests with delays between each question
    const saveRequests = questions.map((question, index) => {
      // Generate a unique ID for each question if not already present
      const questionId = question.id ?? this.generateQuestionId(
        question.topicId || '',
        question.level || 0,
        index + 1
      );
      
      const questionData = {
        ...question,
        id: questionId,
        moduleId
      };
      
      // Add a delay of 50ms between each question save
      return timer(index * 50).pipe(
        switchMap(() => this.http.post<EnhancedQuestion>(`${this.apiUrl}/questions`, questionData))
      );
    });
    
    // Execute all save requests in sequence with delays
    return concat(...saveRequests).pipe(
      this.toArray(), // Collect results into an array
      tap(savedQuestions => {
        // Update cache with the topicId if available
        if (savedQuestions.length > 0) {
          const topicId = savedQuestions[0].topicId;
          const level = savedQuestions[0].level;
          
          if (topicId) {
            const moduleKey = `topic-${topicId}-module-${moduleId}`;
            this.questionsCache.set(moduleKey, of(savedQuestions));
            
            if (level !== undefined) {
              const levelKey = `topic-${topicId}-level-${level}`;
              this.questionsCache.set(levelKey, of(savedQuestions));
            }
          }
          
          // Also update the module-only cache
          const moduleKey = `module-${moduleId}`;
          this.questionsCache.set(moduleKey, of(savedQuestions));
        }
      }),
      catchError(error => {
        return this.errorHandling.handleError(error, `Error saving questions for module ${moduleId}`);
      })
    );
  }

  /**
   * Generate a unique ID for a question
   */
  private generateQuestionId(topicId: string, level: number, index: number): string {
    const topicPrefix = topicId.split('-')[0] || 'q';
    const timestamp = Date.now().toString(36);
    return `q-${topicPrefix}-l${level}-${index}-${timestamp}`;
  }

  /**
   * Helper function to convert array observables to regular observables
   */
  private toArray<T>() {
    return function(source: Observable<T>): Observable<T[]> {
      return new Observable<T[]>(subscriber => {
        const arr: T[] = [];
        
        source.subscribe({
          next(value) { arr.push(value); },
          error(err) { subscriber.error(err); },
          complete() {
            subscriber.next(arr);
            subscriber.complete();
          }
        });
      });
    };
  }

  /**
   * Clear the questions cache
   * @param moduleId Optional module ID to clear cache for
   * @param topicId Optional topic ID to clear cache for
   * @param level Optional module level to clear cache for
   */
  clearCache(moduleId?: string, topicId?: string, level?: number): void {
    if (moduleId !== undefined && topicId !== undefined) {
      // Clear specific topic-module cache
      this.questionsCache.delete(`topic-${topicId}-module-${moduleId}`);
    } else if (topicId !== undefined && level !== undefined) {
      // Clear specific topic-level cache
      this.questionsCache.delete(`topic-${topicId}-level-${level}`);
    } else if (moduleId !== undefined) {
      // Clear module cache
      this.questionsCache.delete(`module-${moduleId}`);
    } else if (topicId !== undefined) {
      // Clear all caches for a topic
      [...this.questionsCache.keys()]
        .filter(key => key.startsWith(`topic-${topicId}`))
        .forEach(key => this.questionsCache.delete(key));
    } else {
      // Clear all caches
      this.questionsCache.clear();
    }
  }
}