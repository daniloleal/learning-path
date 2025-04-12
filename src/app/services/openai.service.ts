// src/app/services/openai.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Question } from '../models/questions.interface';

/**
 * Interface for OpenAI API request
 */
export interface OpenAIRequest {
  model: string;
  messages: Message[];
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

/**
 * Interface for message in OpenAI API request
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Interface for OpenAI API response
 */
export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: Message;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Service for generating quiz questions using OpenAI API
 */
@Injectable({
  providedIn: 'root',
})
export class OpenAIService {
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly model = 'gpt-4-turbo'; // Use latest model

  constructor(private http: HttpClient) {}

  /**
   * Generate quiz questions for a specific topic
   * @param topic The topic to generate questions for
   * @param moduleId The module ID (difficulty level)
   * @param numberOfQuestions Number of questions to generate
   * @returns Observable of an array of Question objects
   */
  generateQuestions(
    topic: string, 
    moduleId: number, 
    numberOfQuestions: number = 5
  ): Observable<Question[]> {
    const messages = this.createPrompt(topic, moduleId, numberOfQuestions);
    
    const requestData: OpenAIRequest = {
      model: this.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 4000,
      top_p: 1,
      frequency_penalty: 0.3,
      presence_penalty: 0.2
    };

    // Create headers with API key
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${environment.openai.apiKey}`);

    // Make the API call
    return this.http.post<OpenAIResponse>(this.apiUrl, requestData, { headers }).pipe(
      retry(1),
      map(response => this.parseResponse(response)),
      catchError(error => {
        console.error('Error calling OpenAI API:', error);
        return throwError(() => new Error('Failed to generate questions with OpenAI. Please try again later.'));
      })
    );
  }

  /**
   * Create the prompt messages for the OpenAI API
   * @param topic The topic to generate questions for
   * @param moduleId The module ID (difficulty level)
   * @param numberOfQuestions Number of questions to generate
   * @returns Array of Message objects for the API request
   */
  private createPrompt(topic: string, moduleId: number, numberOfQuestions: number): Message[] {
    // Calculate difficulty based on moduleId
    let difficulty: string;
    if (moduleId <= 5) difficulty = 'beginner';
    else if (moduleId <= 10) difficulty = 'intermediate';
    else if (moduleId <= 15) difficulty = 'advanced';
    else difficulty = 'expert';

    const systemMessage: Message = {
      role: 'system',
      content: `You are a professional quiz creator specializing in ${topic}. 
      Your task is to create ${numberOfQuestions} multiple-choice questions about ${topic} at a ${difficulty} level.

      IMPORTANT RULES:
      1. Ensure questions are accurate, clear, and educational.
      2. Create exactly ${numberOfQuestions} questions, no more, no less.
      3. Each question must have exactly 4 options (A, B, C, D).
      4. Only ONE option should be correct.
      5. Distribute the correct answers randomly (A, B, C, D) with roughly equal frequency.
      6. No repeating questions or very similar questions.
      7. Ensure a good mix of question types (conceptual, practical, analytical).
      8. Provide a detailed explanation for each answer, explaining why the correct option is right and why others are wrong.
      9. Make the questions gradually more challenging as the list progresses.
      10. Do not include the letter (A, B, C, D) in the option text itself.

      Output format must be valid JSON in the following format:
      [{
        "question": "Question text here?",
        "options": [
          "First option text",
          "Second option text",
          "Third option text",
          "Fourth option text"
        ],
        "answer": 0, // Index of correct option (0-3)
        "explanation": "Detailed explanation here about why the answer is correct and others are incorrect."
      }]

      OUTPUT ONLY THE JSON ARRAY WITH NO ADDITIONAL TEXT.`
    };

    const userMessage: Message = {
      role: 'user',
      content: `Create ${numberOfQuestions} ${difficulty}-level multiple-choice quiz questions about ${topic}. 
      For module ${moduleId}, focus on ${topic} concepts appropriate for a ${difficulty} level understanding.`
    };

    return [systemMessage, userMessage];
  }

  /**
   * Parse the OpenAI API response into an array of Question objects
   * @param response The API response
   * @returns Array of Question objects
   */
  private parseResponse(response: OpenAIResponse): Question[] {
    try {
      // Extract the content from the response
      const content = response.choices[0].message.content.trim();
      
      // Parse the JSON string into an array of questions
      const questions: Question[] = JSON.parse(content);
      
      // Validate the structure of each question
      for (const question of questions) {
        if (!this.isValidQuestion(question)) {
          throw new Error('Invalid question format in response');
        }
      }
      
      return questions;
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Failed to parse questions from OpenAI response');
    }
  }

  /**
   * Validate that a question object has the correct structure
   * @param question The question object to validate
   * @returns Boolean indicating whether the question is valid
   */
  private isValidQuestion(question: any): boolean {
    return (
      question.question &&
      Array.isArray(question.options) &&
      question.options.length === 4 &&
      typeof question.answer === 'number' &&
      question.answer >= 0 &&
      question.answer <= 3 &&
      question.explanation
    );
  }
}
