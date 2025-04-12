import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Question } from '../models/questions.interface';
import { OpenAIService } from './openai.service';
import { ErrorHandlingService } from './error-handling.service';
import { TopicModule } from './topic.service';

/**
 * Interface for AI generated quiz content
 */
export interface AIQuizContent {
  topic: string;
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
  private readonly USE_MOCK_DATA = false; // Set to true for testing without using OpenAI API
  
  constructor(
    private openAIService: OpenAIService,
    private errorHandling: ErrorHandlingService
  ) {}

  /**
   * Generate quiz content for a topic
   */
  generateQuizContent(topic: string): Observable<AIQuizContent> {
    if (this.USE_MOCK_DATA) {
      return of(this.generateMockContent(topic));
    }
    
    // Use OpenAI to generate content
    return this.openAIService.generateQuestions(topic, 1, 10)
      .pipe(
        map(questions => {
          // Create modules with the generated questions
          const modules = this.createModules(topic, questions);
          
          return {
            topic,
            modules
          };
        }),
        catchError(error => {
          console.warn('Error generating content with OpenAI. Falling back to mock data.');
          return of(this.generateMockContent(topic));
        })
      );
  }

  /**
   * Create modules with different difficulty levels
   */
  private createModules(topic: string, sampleQuestions: Question[]): AIQuizContent['modules'] {
    const totalModules = 5;
    const modules: AIQuizContent['modules'] = [];
    
    for (let i = 1; i <= totalModules; i++) {
      // Create variations of the questions for each module
      const moduleQuestions = sampleQuestions.map(q => ({
        ...q,
        question: `[Level ${i}] ${q.question}`, // Add level to question
        explanation: `[Level ${i}] ${q.explanation}` // Add level to explanation
      }));
      
      modules.push({
        moduleId: i,
        title: `${topic} - Level ${i}`,
        questions: moduleQuestions
      });
    }
    
    return modules;
  }

  /**
   * Generate mock content for testing
   */
  private generateMockContent(topic: string): AIQuizContent {
    const modules: AIQuizContent['modules'] = [];
    
    for (let moduleId = 1; moduleId <= 5; moduleId++) {
      const questions: Question[] = [];
      
      for (let q = 1; q <= 10; q++) {
        // Ensure the correct answer is distributed evenly
        const correctAnswer = (q + moduleId) % 4;
        
        questions.push({
          question: `${topic} question ${q} for level ${moduleId}?`,
          options: [
            `Answer option 1 for ${topic}`,
            `Answer option 2 for ${topic}`,
            `Answer option 3 for ${topic}`,
            `Answer option 4 for ${topic}`
          ],
          answer: correctAnswer,
          explanation: `This is the explanation for ${topic} question ${q} in level ${moduleId}. The correct answer is option ${correctAnswer + 1}.`
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
      modules
    };
  }
}