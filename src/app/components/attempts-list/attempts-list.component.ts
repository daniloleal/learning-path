// src/app/components/attempts-list/attempts-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { NavigationService } from '../../services/navigation.service';
import { ErrorHandlingService } from '../../services/error-handling.service';
import { QuizAttempt } from '../../models/quiz-attempt.interface';
import { Observable, BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, switchMap, tap, catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-attempts-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-6xl mx-auto px-4">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">Quiz Attempts History</h1>
          <button 
            (click)="goBack()" 
            class="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <span>←</span> Back to Topics
          </button>
        </div>
        
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-2">User ID: 1</h2>
          <p class="text-gray-600">Total attempts: {{ (attempts$ | async)?.length || 0 }}</p>
        </div>

        <ng-container *ngIf="attempts$ | async as attempts">
          <div class="bg-white rounded-xl shadow overflow-hidden">
            <div class="grid grid-cols-12 bg-gray-100 p-4 font-medium">
              <div class="col-span-2">Module</div>
              <div class="col-span-2">Date</div>
              <div class="col-span-2">Score</div>
              <div class="col-span-2">Accuracy</div>
              <div class="col-span-2">Duration</div>
              <div class="col-span-2">Actions</div>
            </div>

            <div *ngIf="attempts.length > 0; else noAttemptsFound">
              <div *ngFor="let attempt of attempts" class="grid grid-cols-12 p-4 border-b border-gray-200 hover:bg-gray-50">
                <div class="col-span-2">Level {{ attempt.moduleId }}</div>
                <div class="col-span-2">{{ formatDate(attempt.timestamp) }}</div>
                <div class="col-span-2">{{ attempt.score }}/{{ attempt.total }}</div>
                <div class="col-span-2">{{ (attempt.score / attempt.total * 100) | number:'1.0-0' }}%</div>
                <div class="col-span-2">{{ formatTime(attempt.duration) }}</div>
                <div class="col-span-2">
                  <a 
                    [routerLink]="['/result']" 
                    [state]="{ 
                      score: attempt.score, 
                      total: attempt.total, 
                      module: attempt.moduleId, 
                      duration: attempt.duration 
                    }"
                    class="text-blue-600 hover:underline"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </div>
          </div>
        </ng-container>

        <ng-template #noAttemptsFound>
          <div class="bg-white rounded-xl shadow p-8 text-center">
            <p class="text-gray-500">No attempts found</p>
            <button
              (click)="goBack()"
              class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start a Quiz
            </button>
          </div>
        </ng-template>

        <div *ngIf="isLoading" class="flex justify-center p-4">
          <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p class="ml-3">Loading attempts...</p>
        </div>
      </div>
    </div>
  `
})
export class AttemptsListComponent implements OnInit, OnDestroy {
  attempts$!: Observable<QuizAttempt[]>;
  isLoading = true;
  private subscription: Subscription = new Subscription();

  constructor(
    private quizService: QuizService,
    private navigationService: NavigationService,
    private errorHandling: ErrorHandlingService
  ) {}

  ngOnInit(): void {
    // Get all attempts for the current user
    this.attempts$ = this.quizService.getUserAttempts(1).pipe(
      tap(() => this.isLoading = false),
      catchError(error => {
        this.errorHandling.handleError(error, 'Failed to load quiz attempts');
        return [];
      }),
      finalize(() => this.isLoading = false)
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Format date from timestamp
   */
  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  /**
   * Format time in seconds to minutes and seconds
   */
  formatTime(seconds: number): string {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  }

  /**
   * Navigate back to topics
   */
  goBack(): void {
    this.navigationService.goToTopics();
  }
}