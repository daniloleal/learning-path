// src/app/services/ai-quiz.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, delay, retry, timeout } from 'rxjs/operators';
import { Question } from '../models/questions.interface';
import { environment } from '../../environments/environment';

/**
 * Interface for AI Quiz content request
 */
export interface AIQuizRequest {
  topic: string;
  userId: number;  // Added userId to the request
  difficulty: 'easy' | 'medium' | 'hard' | 'progressive';
  numModules: number;
  questionsPerModule: number;
}

/**
 * Interface for AI Quiz content response
 */
export interface AIQuizResponse {
  topic: string;
  userId: number;  // Added userId to the response
  modules: {
    moduleId: number;
    title: string;
    questions: Question[];
  }[];
}

/**
 * Service for generating quiz content using AI
 */
@Injectable({
  providedIn: 'root',
})
export class AIQuizService {
  private readonly apiUrl = environment.aiApiUrl;
  private readonly currentUserId = 1; // In a real app, this would come from authentication service
  
  constructor(private http: HttpClient) {}

  /**
   * Generates quiz content for a given topic using AI
   * @param topic The topic to generate questions for
   * @returns Observable containing modules with questions
   */
  generateQuizContent(topic: string): Observable<AIQuizResponse> {
    // Create a request object that follows the AIQuizRequest interface
    const request: AIQuizRequest = {
      topic: topic,
      userId: this.currentUserId, // Associate with current user
      difficulty: 'progressive', // Start easy, get harder with each module
      numModules: 20, // 20 modules (levels)
      questionsPerModule: 10 // 10 questions per module
    };

    // For development/demo purposes, we use a mock response
    // In production, uncomment the HTTP call below
    
    /*
    return this.http.post<AIQuizResponse>(`${this.apiUrl}/generate-quiz`, request).pipe(
      timeout(30000), // Set timeout to 30 seconds for long-running AI operations
      retry(1), // Retry once in case of temporary network issues
      catchError((error: HttpErrorResponse) => {
        console.error('AI API error:', error);
        // For development fallback
        if (environment.useMockData) {
          console.warn('Falling back to mock data');
          return of(this.generateMockQuizContent(topic));
        }
        return throwError(() => new Error('Failed to generate content'));
      })
    );
    */
    
    // Mock implementation for demonstration
    return of(this.generateMockQuizContent(topic)).pipe(
      delay(2000), // Simulate network delay
      catchError(error => throwError(() => new Error('Failed to generate content')))
    );
  }

  /**
   * Generate mock questions for testing purposes
   * In production, this would be replaced with actual AI-generated content
   * @param topic The topic to generate mock questions for
   */
  private generateMockQuizContent(topic: string): AIQuizResponse {
    const modules = [];
    
    for (let moduleId = 1; moduleId <= 20; moduleId++) {
      const questions: Question[] = [];
      
      for (let q = 1; q <= 10; q++) {
        questions.push({
          question: `${topic} question ${q} for module ${moduleId}?`,
          options: [
            `Answer option 1 for ${topic}`,
            `Answer option 2 for ${topic}`,
            `Answer option 3 for ${topic}`,
            `Answer option 4 for ${topic}`
          ],
          answer: Math.floor(Math.random() * 4), // Random correct answer index
          explanation: `This is the explanation for ${topic} question ${q} in module ${moduleId}.`
        });
      }
      
      modules.push({
        moduleId,
        title: `${topic} - Level ${moduleId}`,
        questions
      });
    }
    
    return {
      topic,
      userId: this.currentUserId, // Include the user ID in the response
      modules
    };
  }
}