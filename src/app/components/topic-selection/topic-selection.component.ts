// src/app/components/topic-selection/topic-selection.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopicService, Topic } from '../../services/topic.service';
import { AIQuizService } from '../../services/ai-quiz.service';
import { ErrorHandlingService } from '../../services/error-handling.service';
import { NavigationService } from '../../services/navigation.service';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

@Component({
  selector: 'app-topic-selection',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div class="max-w-4xl mx-auto px-4">
        <!-- Header section -->
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-gray-800 mb-4">
            Learn Anything Quiz Platform
          </h1>
          <p class="text-xl text-gray-600 mb-8">
            Select a topic or create a new one to start learning
          </p>
        </div>

        <!-- Topic selection section -->
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-10">
          <h2 class="text-2xl font-semibold text-gray-800 mb-6">What do you want to learn today?</h2>
          
          <div class="flex gap-4 mb-8">
            <input 
              [(ngModel)]="newTopicInput" 
              class="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter a topic (e.g., Angular, React, Python, Machine Learning...)"
            />
            <button 
              [disabled]="isLoading || !newTopicInput.trim()"
              (click)="addNewTopic()" 
              class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <span *ngIf="!isLoading">Add Topic</span>
              <span *ngIf="isLoading" class="flex items-center gap-2">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing
              </span>
            </button>
          </div>

          <!-- Error message -->
          <div *ngIf="errorMessage" class="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-6">
            <p class="font-medium">{{ errorMessage }}</p>
            <p>Please try again with a different topic or wording.</p>
          </div>

          <!-- Topics list -->
          <div *ngIf="topics.length > 0">
            <h3 class="text-lg font-medium text-gray-700 mb-3">Your Learning Topics:</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                *ngFor="let topic of topics" 
                class="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white"
                (click)="selectTopic(topic)"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-lg font-semibold text-gray-800">{{ topic.name }}</h4>
                    <p class="text-gray-600 text-sm mt-1">
                      {{ topic.completedModules }} / {{ topic.totalModules }} levels completed
                    </p>
                  </div>
                  <div class="text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </div>
                
                <!-- Progress bar -->
                <div class="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    class="h-2 bg-green-500 rounded-full"
                    [style.width.%]="(topic.completedModules / topic.totalModules) * 100"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Empty state -->
          <div *ngIf="topics.length === 0 && !isLoading" class="text-center py-8">
            <div class="mb-4 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mx-auto">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <p class="text-gray-500">No topics yet. Add a topic to get started!</p>
          </div>
        </div>
        
        <!-- Examples for inspiration -->
        <div class="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h3 class="font-medium text-blue-800 mb-3">Need inspiration? Try these topics:</h3>
          <div class="flex flex-wrap gap-2">
            <button 
              *ngFor="let suggestion of topicSuggestions" 
              (click)="newTopicInput = suggestion"
              class="px-3 py-2 bg-white border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TopicSelectionComponent implements OnInit {
  topics: Topic[] = []; // Properly typed to Topic[]
  newTopicInput = '';
  isLoading = false;
  errorMessage = '';
  
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
    private topicService: TopicService,
    private aiQuizService: AIQuizService,
    private errorHandling: ErrorHandlingService,
    private navigationService: NavigationService
  ) {}

  ngOnInit(): void {
    this.loadTopics();
  }

  /**
   * Load topics from the service
   */
  loadTopics(): void {
    this.topics = this.topicService.getAllTopics();
  }

  /**
   * Add a new topic with AI-generated quiz content
   */
  addNewTopic(): void {
    if (!this.newTopicInput.trim()) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    // Generate quiz content for the new topic via AI
    this.aiQuizService.generateQuizContent(this.newTopicInput)
      .pipe(
        tap((result) => {
          // Add the new topic with generated content
          const newTopic = this.topicService.addTopic(this.newTopicInput, result);
          this.loadTopics();
          this.newTopicInput = '';
          
          // Navigate to module selection for the new topic
          this.navigationService.goToModules(newTopic.id);
          this.errorHandling.showSuccess(`Topic "${newTopic.name}" created successfully!`);
        }),
        catchError((error) => {
          this.errorMessage = 'Failed to generate quiz content for this topic.';
          return this.errorHandling.handleError(
            error, 
            'Error generating topic content', 
            false // Don't show notification since we have inline error message
          );
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  /**
   * Navigate to the selected topic
   */
  selectTopic(topic: Topic): void {
    this.navigationService.goToModules(topic.id);
  }
}