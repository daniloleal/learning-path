// src/app/components/topic-selection/topic-selection.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TopicService, Topic } from '../../services/topic.service';
import { AIQuizService } from '../../services/ai-quiz.service';
import { ErrorHandlingService } from '../../services/error-handling.service';
import { NavigationService } from '../../services/navigation.service';
import { QuestionService } from '../../services/question.service';
import { Observable, Subscription, forkJoin, interval, of, timer, concat } from 'rxjs';
import { catchError, finalize, map, switchMap, takeWhile, tap, concatMap, delay } from 'rxjs/operators';
import { AILoadingComponent } from '../shared/ai-loading.component';
import { OpenAIErrorComponent } from '../shared/openai-error.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-topic-selection',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    AILoadingComponent,
    OpenAIErrorComponent
  ],
  templateUrl: './topic-selection.component.html'
})
export class TopicSelectionComponent implements OnInit, OnDestroy {
  topics: Topic[] = [];
  newTopicInput = '';
  isLoading = false;
  showAiLoading = false;
  aiProgress = 0;
  aiProgressText = 'Preparing...';
  showOpenAiError = false;
  errorMessage = '';
  detailedError = '';
  
  private readonly apiUrl = environment.apiUrl;
  private progressSubscription?: Subscription; 
  private apiSubscription?: Subscription;
  private subscription = new Subscription();
  
  readonly topicSuggestions: string[] = [
    'Angular', 
    'React', 
    'Vue.js', 
    'JavaScript Basics', 
    'TypeScript', 
    'Node.js', 
    'Python', 
    'Machine Learning',
    'AWS Cloud',
    'Docker & Kubernetes'
  ];

  constructor(
    private router: Router,
    private http: HttpClient,
    private topicService: TopicService,
    private aiQuizService: AIQuizService,
    private questionService: QuestionService, 
    private errorHandling: ErrorHandlingService,
    private navigationService: NavigationService
  ) {}

  ngOnInit(): void {
    // Subscribe to topics
    this.subscription.add(
      this.topicService.getTopics$().subscribe(topics => {
        this.topics = topics;
      })
    );
  }
  
  ngOnDestroy(): void {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
    
    if (this.apiSubscription) {
      this.apiSubscription.unsubscribe();
    }

    this.subscription.unsubscribe();
  }

  /**
   * Add a new topic with AI-generated quiz content
   */
  addNewTopic(): void {
    if (!this.newTopicInput.trim()) return;
    
    this.isLoading = true;
    this.showAiLoading = true;
    this.showOpenAiError = false;
    this.errorMessage = '';
    this.detailedError = '';
    
    // Start the loading animation
    this.startProgressAnimation();
    
    // Generate quiz content for the new topic via AI
    this.apiSubscription = this.aiQuizService.generateQuizContent(this.newTopicInput)
      .pipe(
        // Step 1: Process the AI content by creating a topic object
        switchMap(quizContent => {
          const topicData = {
            userId: 1, // Current user ID
            name: this.newTopicInput,
            completedModules: 0,
            totalModules: 5 // Fixed to 5 modules
          };
          
          // Step 2: Create the topic in the database
          return this.topicService.addTopic(topicData).pipe(
            map(createdTopic => ({ topic: createdTopic, quizContent })),
            tap(() => {
              this.aiProgress = 30;
              this.aiProgressText = 'Topic created, creating modules...';
            })
          );
        }),
        
        // Step 3: Create modules for the topic with string IDs and sequential delays
        switchMap(({ topic, quizContent }) => {
          // Create module objects for the database with string IDs
          const moduleCreateRequests = quizContent.modules.map((moduleData, index) => {
            // Create a string ID like "angular-basics-level-1-abc123"
            const moduleId = this.generateModuleId(topic.name, moduleData.moduleId);
            
            const moduleObject = {
              id: moduleId,                    // String ID similar to topic ID
              level: moduleData.moduleId,      // Keep numeric level (1-5)
              topicId: topic.id,
              title: `${topic.name} - Level ${moduleData.moduleId}`,
              isUnlocked: moduleData.moduleId === 1,
              isCompleted: false,
              bestScore: 0,
              submissionCount: 0
            };
            
            // Add a deliberate delay between module creations (100ms * index)
            // This helps prevent DB conflicts by spacing out the requests
            return timer(index * 100).pipe(
              switchMap(() => this.http.post(`${this.apiUrl}/modules`, moduleObject))
            );
          });
          
          // Execute all module creation requests in sequence
          return concat(...moduleCreateRequests).pipe(
            this.toArray(), // Collect all results into an array
            tap(() => {
              this.aiProgress = 60;
              this.aiProgressText = 'Modules created, saving questions...';
            }),
            map(createdModules => ({ topic, quizContent, createdModules }))
          );
        }),
        
        // Step 4: Save the questions for each module with string module IDs and sequential delays
        switchMap(({ topic, quizContent, createdModules }) => {
          // Map the created modules to get their IDs
          const moduleIdMap = new Map<number, string>();
          
          // Extract the IDs from the created modules response
          createdModules.forEach((moduleResponse: any, index) => {
            const moduleLevel = quizContent.modules[index].moduleId;
            moduleIdMap.set(moduleLevel, moduleResponse.id);
          });
          
          // Process modules for question creation one at a time with delays
          const moduleQuestionCreationRequests = quizContent.modules.map((moduleData, moduleIndex) => {
            const moduleId = moduleIdMap.get(moduleData.moduleId) || '';
            
            // Create question objects with proper module references
            const questionObjects = moduleData.questions.map((question, qIndex) => {
              const questionId = this.generateQuestionId(topic.name, moduleData.moduleId, qIndex + 1);
              
              return {
                ...question,
                id: questionId,              // Unique question ID
                moduleId: moduleId,          // String module ID
                level: moduleData.moduleId,  // Numeric level for reference
                topicId: topic.id            // Topic reference
              };
            });
            
            // Add delay between modules to prevent database conflicts
            return timer(moduleIndex * 300).pipe(
              switchMap(() => {
                this.aiProgressText = `Saving questions for Level ${moduleData.moduleId}...`;
                // Save questions for this module
                return this.questionService.saveQuestions(moduleId, questionObjects);
              })
            );
          });
          
          // Execute module question creation requests in sequence
          return concat(...moduleQuestionCreationRequests).pipe(
            this.toArray(), // Collect all results into an array
            tap(() => {
              this.aiProgress = 90;
              this.aiProgressText = 'Almost done...';
            }),
            map(() => topic)
          );
        }),
        
        catchError(error => {
          this.showAiLoading = false;
          this.showOpenAiError = true;
          this.errorMessage = 'Failed to generate quiz content for this topic.';
          this.detailedError = error.message || 'Unknown error occurred';
          
          return this.errorHandling.handleError(
            error, 
            'Error generating topic content', 
            false // Don't show notification since we have inline error
          );
        }),
        
        finalize(() => {
          this.isLoading = false;
          this.showAiLoading = false;
          // Clean up progress animation
          if (this.progressSubscription) {
            this.progressSubscription.unsubscribe();
          }
        })
      )
      .subscribe(topic => {
        if (topic) {
          // Clear the input and update UI
          this.newTopicInput = '';
          
          // Navigate to module selection for the new topic
          this.navigationService.goToModules(topic.id);
          this.errorHandling.showSuccess(`Topic "${topic.name}" created successfully!`);
        }
      });
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
   * Generate a consistent module ID
   * @param topicName The name of the parent topic
   * @param level The module level (1-5)
   * @returns A string ID for the module
   */
  private generateModuleId(topicName: string, level: number): string {
    const prefix = topicName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now().toString(36);
    return `${prefix}-level-${level}-${timestamp}`;
  }

  /**
   * Generate a consistent question ID
   * @param topicName The name of the parent topic
   * @param level The module level (1-5)
   * @param index The question index
   * @returns A string ID for the question
   */
  private generateQuestionId(topicName: string, level: number, index: number): string {
    const prefix = topicName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now().toString(36);
    return `q-${prefix}-l${level}-q${index}-${timestamp}`;
  }

  /**
   * Navigate to the selected topic
   */
  selectTopic(topic: Topic): void {
    this.navigationService.goToModules(topic.id);
  }
  
  /**
   * Start progress animation for AI content generation
   */
  private startProgressAnimation(): void {
    this.aiProgress = 0;
    this.aiProgressText = 'Analyzing topic...';
    
    const steps = [
      { progress: 15, text: 'Analyzing topic...' },
      { progress: 30, text: 'Generating questions...' },
      { progress: 50, text: 'Creating answer options...' },
      { progress: 70, text: 'Writing explanations...' },
      { progress: 85, text: 'Finalizing content...' },
      { progress: 95, text: 'Almost done...' }
    ];
    
    let currentStep = 0;
    let active = true;
    
    this.progressSubscription = interval(1500)
      .pipe(
        takeWhile(() => active && this.showAiLoading)
      )
      .subscribe(() => {
        if (currentStep < steps.length) {
          this.aiProgress = steps[currentStep].progress;
          this.aiProgressText = steps[currentStep].text;
          currentStep++;
        } else {
          // Once we reach the end, increment very slowly
          if (this.aiProgress < 99) {
            this.aiProgress += 0.2;
          }
        }
      });
  }
  
  /**
   * Retry generating content with OpenAI
   */
  retryOpenAI(): void {
    this.showOpenAiError = false;
    this.addNewTopic();
  }
  
  /**
   * Use mock data instead of OpenAI
   */
  useMockData(): void {
    this.showOpenAiError = false;
    // We'll simulate this by just calling addNewTopic again,
    // which will use mock data as a fallback if OpenAI fails
    this.addNewTopic();
  }
  
  /**
   * Cancel the current operation
   */
  cancelOperation(): void {
    this.showOpenAiError = false;
    this.isLoading = false;
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
    if (this.apiSubscription) {
      this.apiSubscription.unsubscribe();
    }
  }
}