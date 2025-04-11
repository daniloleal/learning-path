// src/app/components/attempts-list/attempts-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { QuizAttempt } from '../../models/quiz-attempt.interface';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-attempts-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-6xl mx-auto px-4">
        <h1 class="text-2xl font-bold mb-6">Quiz Attempts History</h1>
        
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
          </div>
        </ng-template>

        <div *ngIf="isLoading" class="flex justify-center p-4">
          <p>Loading attempts...</p>
        </div>
      </div>
    </div>
  `
})
export class AttemptsListComponent implements OnInit {
  attempts$!: Observable<QuizAttempt[]>;
  isLoading = true;

  constructor(private quizService: QuizService) {}

  ngOnInit(): void {
    // Get all attempts for the current user
    this.attempts$ = this.quizService.getUserAttempts(1).pipe(
      tap(() => this.isLoading = false)
    );
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  formatTime(seconds: number): string {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  }
}