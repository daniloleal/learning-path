import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QuizService } from '../../services/quiz.service';
import { NavigationService } from '../../services/navigation.service';
import { ErrorHandlingService } from '../../services/error-handling.service';
import { Submission } from '../../models/submission.interface';
import { QuizSubmission } from '../../models/quiz-submission.interface';
import { Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-3xl mx-auto px-4">
    <!-- Back button section -->
    <div class="mb-6 flex justify-between">
      <button (click)="goHome()" class="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
        <span>←</span> Back to Levels
      </button>
      <a routerLink="/submissions" class="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
        View All Submissions
        <span>→</span>
      </a>
    </div>
    
    <!-- Main result card -->
    <div class="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200">
      <!-- Header section -->
      <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8 text-white">
        <h1 class="text-2xl font-bold mb-2">Level {{ module }} Results</h1>
        <p class="opacity-80">Completed on {{ currentDateFormated() }}</p>
      </div>
      
      <!-- Results section -->
      <div class="p-6">
        <!-- Score cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <!-- Score card -->
          <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div class="text-blue-800 text-sm font-medium mb-1">Score</div>
            <div class="flex items-end">
              <span class="text-3xl font-bold text-blue-800">{{ score }}</span>
              <span class="text-blue-600 ml-1">/ {{ total }}</span>
            </div>
          </div>
          
          <!-- Accuracy card -->
          <div class="bg-green-50 rounded-lg p-4 border border-green-100">
            <div class="text-green-800 text-sm font-medium mb-1">Accuracy</div>
            <div class="flex items-end">
              <span class="text-3xl font-bold text-green-800">{{ (score / total * 100) | number:'1.0-0' }}%</span>
            </div>
          </div>
          
          <!-- Time card -->
          <div class="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div class="text-purple-800 text-sm font-medium mb-1">Completion Time</div>
            <div class="flex items-end">
              <span class="text-3xl font-bold text-purple-800">{{ formatTime(duration) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Performance visualization -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold mb-3">Performance</h2>
          <div class="h-6 bg-gray-100 rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full"
              [ngClass]="getPerformanceColorClass()"
              [style.width.%]="(score / total * 100)"
            ></div>
          </div>
          <div class="flex justify-between mt-2 text-sm text-gray-500">
            <div>0%</div>
            <div>{{ (score / total * 100) | number:'1.0-0' }}%</div>
            <div>100%</div>
          </div>
          <div class="mt-4 text-center">
            <div 
              class="inline-block px-4 py-2 rounded-full text-sm font-medium"
              [ngClass]="getPerformanceFeedbackClass()"
            >
              {{ getPerformanceFeedback() }}
            </div>
          </div>
        </div>
        
        <!-- Previous submissions section -->
        <div *ngIf="hasMultipleSubmissions">
          <h2 class="text-lg font-semibold mb-3">Previous Submissions</h2>
          <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500 border-b border-gray-200">
                  <th class="pb-2 font-medium">Submission</th>
                  <th class="pb-2 font-medium">Score</th>
                  <th class="pb-2 font-medium">Accuracy</th>
                  <th class="pb-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let submission of moduleSubmissions; let i = index" 
                    class="border-b border-gray-100 last:border-0"
                    [ngClass]="{'font-medium': i === moduleSubmissions.length - 1}"
                >
                  <td class="py-3">{{ moduleSubmissions.length - i }}</td>
                  <td class="py-3">{{ submission.score }}/{{ submission.total }}</td>
                  <td class="py-3">{{ (submission.score / submission.total * 100) | number:'1.0-0' }}%</td>
                  <td class="py-3">{{ formatTime(submission.duration) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Action buttons -->
      <div class="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between">
        <button 
          (click)="goHome()" 
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Return to Levels
        </button>
        <button 
          (click)="retryQuiz()" 
          class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry Level {{ module }}
        </button>
      </div>
    </div>

    <!-- All modules summary -->
    <div class="mt-8 bg-white rounded-xl shadow border border-gray-200 p-6">
      <h2 class="text-lg font-semibold mb-4">All Levels Progress</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div *ngFor="let key of previousScoreKeys" class="bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div class="font-medium">{{ formatModuleKey(key) }}</div>
          <div class="flex justify-between text-sm mt-1">
            <span class="text-gray-600">Best score: {{ getBestScore(key) }}%</span>
            <span class="text-gray-600">{{ getsubmissionCount(key) }} submissions</span>
          </div>
          <div class="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div 
              class="h-2 bg-blue-500 rounded-full" 
              [style.width.%]="getBestScore(key)"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  `
})
export class ResultComponent implements OnInit, OnDestroy {
  score = 0;
  total = 0;
  module = 1;
  duration = 0;
  allSubmissions: Record<string, Submission[]> = {};
  moduleSubmissions: QuizSubmission[] = [];
  isLoading = false;
  
  private subscription = new Subscription();

  constructor(
    private router: Router, 
    private quizService: QuizService,
    private navigationService: NavigationService,
    private errorHandling: ErrorHandlingService
  ) {
    // Get data from router state
    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state) {
      this.score = state['score'] || 0;
      this.total = state['total'] || 0;
      this.module = state['module'] || 1;
      this.duration = state['duration'] || 0;
    } else {
      // Fallback if no state (e.g., if page is refreshed)
      this.navigationService.goToTopics();
    }
  }

  ngOnInit(): void {
    this.isLoading = true;
    
    // Load module submissions
    this.subscription.add(
      this.quizService.getSubmissions(this.module).pipe(
        catchError(error => {
          this.errorHandling.handleError(error, 'Failed to load module submissions');
          return [];
        })
      ).subscribe(submissions => {
        this.moduleSubmissions = submissions
          .map(a => ({
            score: a.score,
            total: a.total,
            duration: a.duration
          } as QuizSubmission))
          .reverse();
      })
    );
    
    // Load all submissions and group them by module
    this.subscription.add(
      this.quizService.getSubmissions().pipe(
        finalize(() => this.isLoading = false),
        catchError(error => {
          this.errorHandling.handleError(error, 'Failed to load submissions');
          return [];
        })
      ).subscribe(submissions => {
        this.allSubmissions = this.groupSubmissionsByModule(submissions);
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Group submissions by module ID
   */
  private groupSubmissionsByModule(submissions: QuizSubmission[]): Record<string, Submission[]> {
    const grouped: Record<string, Submission[]> = {};
    
    submissions.forEach(submission => {
      const key = `module-${submission.moduleId}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push({
        score: submission.score,
        total: submission.total,
        duration: submission.duration
      });
    });
    
    return grouped;
  }

  get previousScoreKeys(): string[] {
    return Object.keys(this.allSubmissions).sort((a, b) => {
      const aNum = parseInt(a.replace('module-', ''));
      const bNum = parseInt(b.replace('module-', ''));
      return aNum - bNum;
    });
  }

  get hasMultipleSubmissions(): boolean {
    return this.moduleSubmissions.length > 0;
  }

  currentDateFormated(): string {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(seconds?: number): string {
    if (!seconds) return 'N/A';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  formatModuleKey(key: string): string {
    return key.replace('module-', 'Level ');
  }

  getBestScore(key: string): number {
    const submissions = this.allSubmissions[key] || [];
    if (!submissions.length) return 0;
    
    const bestScore = Math.max(...submissions.map(a => (a.score / a.total) * 100));
    return Math.round(bestScore);
  }

  getsubmissionCount(key: string): number {
    return (this.allSubmissions[key] || []).length;
  }

  getPerformanceColorClass(): string {
    const percentage = (this.score / this.total) * 100;
    
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getPerformanceFeedbackClass(): string {
    const percentage = (this.score / this.total) * 100;
    
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 70) return 'bg-blue-100 text-blue-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  getPerformanceFeedback(): string {
    const percentage = (this.score / this.total) * 100;
    
    if (percentage >= 90) return 'Excellent!';
    if (percentage >= 70) return 'Good job!';
    if (percentage >= 50) return 'Almost there!';
    return 'Keep practicing!';
  }

  goHome(): void {
    this.navigationService.goToTopics();
  }

  retryQuiz(): void {
    this.navigationService.goToQuiz('', this.module);
  }
}