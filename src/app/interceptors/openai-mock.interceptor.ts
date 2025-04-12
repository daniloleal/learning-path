// src/app/interceptors/openai-mock.interceptor.ts
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

// Interceptor function for Angular standalone applications
export const openAIMockInterceptor: HttpInterceptorFn = (req, next) => {
  // Set to true to enable mocking of OpenAI calls
  const MOCK_ENABLED = true;
  
  // Only intercept OpenAI API calls
  if (!MOCK_ENABLED || !req.url.includes('api.openai.com')) {
    return next(req);
  }

  // Extract the topic from the request body
  const body = req.body as any;
  const userMessage = body?.messages?.find((msg: any) => msg.role === 'user')?.content || '';
  const topicMatch = userMessage.match(/about\s+([^.]+)\./i);
  const topic = topicMatch ? topicMatch[1] : 'general knowledge';

  // Create mock questions for the topic
  const mockQuestions = generateMockQuestions(topic);
  
  // Create a mock response
  const mockResponse = new HttpResponse({
    status: 200,
    statusText: 'OK',
    body: {
      id: 'mock-id-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-4-mock',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify(mockQuestions)
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 320,
        completion_tokens: 1250,
        total_tokens: 1570
      }
    }
  });

  // Return the mock response with a realistic delay
  return of(mockResponse).pipe(delay(3000));
};

/**
 * Generate mock questions for a given topic
 */
function generateMockQuestions(topic: string): any[] {
  const questions = [];
  
  for (let i = 1; i <= 5; i++) {
    // Ensure correct answers are distributed
    const correctAnswer = (i - 1) % 4;
    
    questions.push({
      question: `What is an important concept in ${topic} related to ${getSubtopic(topic, i)}?`,
      options: [
        `The ${getRandomTerm(topic)} principle`,
        `The ${getRandomTerm(topic)} methodology`,
        `The ${getRandomTerm(topic)} framework`,
        `The ${getRandomTerm(topic)} pattern`
      ],
      answer: correctAnswer,
      explanation: `In ${topic}, the ${getSubtopic(topic, i)} is particularly important because it forms the foundation for understanding more complex concepts. The correct answer demonstrates proper knowledge of ${topic} fundamentals.`
    });
  }
  
  return questions;
}

/**
 * Get a subtopic for a given topic
 */
function getSubtopic(topic: string, index: number): string {
  const subtopics: Record<string, string[]> = {
    'angular': ['components', 'services', 'modules', 'directives', 'pipes', 'routing', 'forms', 'http', 'rxjs', 'testing'],
    'react': ['components', 'hooks', 'context', 'redux', 'props', 'state', 'effects', 'routing', 'testing', 'performance'],
    'javascript': ['closures', 'promises', 'async/await', 'prototypes', 'modules', 'events', 'dom', 'es6', 'functions', 'objects'],
    'python': ['functions', 'classes', 'modules', 'packages', 'decorators', 'generators', 'comprehensions', 'context managers', 'typing', 'async'],
    'default': ['concept 1', 'concept 2', 'concept 3', 'concept 4', 'concept 5', 'concept 6', 'concept 7', 'concept 8', 'concept 9', 'concept 10']
  };
  
  // Find the appropriate subtopics array or use default
  const topicKey = Object.keys(subtopics).find(key => topic.toLowerCase().includes(key)) || 'default';
  const availableSubtopics = subtopics[topicKey];
  
  // Return the subtopic at the index position (mod length to prevent out of bounds)
  return availableSubtopics[index % availableSubtopics.length];
}

/**
 * Get a random term for use in options
 */
function getRandomTerm(topic: string): string {
  const terms = [
    'advanced', 'basic', 'fundamental', 'essential', 'core', 
    'modern', 'functional', 'object-oriented', 'reactive', 'declarative',
    'imperative', 'structural', 'behavioral', 'architectural', 'design'
  ];
  
  return terms[Math.floor(Math.random() * terms.length)];
}