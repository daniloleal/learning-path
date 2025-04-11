import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Attempt {
  score: number;
  total: number;
  duration?: number;
}

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-3xl mx-auto px-4">
        <!-- Back button -->
        <div class="mb-6">
          <button 
            (click)="goHome()" 
            class="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <span>←</span> Back to Levels
          </button>
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
            
            <!-- Previous attempts section -->
            <div *ngIf="hasMultipleAttempts">
              <h2 class="text-lg font-semibold mb-3">Previous Attempts</h2>
              <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-gray-500 border-b border-gray-200">
                      <th class="pb-2 font-medium">Attempt</th>
                      <th class="pb-2 font-medium">Score</th>
                      <th class="pb-2 font-medium">Accuracy</th>
                      <th class="pb-2 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let attempt of moduleAttempts; let i = index" 
                        class="border-b border-gray-100 last:border-0"
                        [ngClass]="{'font-medium': i === moduleAttempts.length - 1}"
                    >
                      <td class="py-3">{{ moduleAttempts.length - i }}</td>
                      <td class="py-3">{{ attempt.score }}/{{ attempt.total }}</td>
                      <td class="py-3">{{ (attempt.score / attempt.total * 100) | number:'1.0-0' }}%</td>
                      <td class="py-3">{{ formatTime(attempt.duration) }}</td>
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
                <span class="text-gray-600">{{ getAttemptCount(key) }} attempts</span>
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
export class ResultComponent implements OnInit {
  score = 0;
  total = 0;
  module = 1;
  duration = 0;
  allAttempts: Record<string, Attempt[]> = {};
  moduleAttempts: Attempt[] = [];

  constructor(private router: Router) {
    // Get quiz results from router state
    this.score = history.state.score || 0;
    this.total = history.state.total || 0;
    this.module = history.state.module || 1;
    this.duration = history.state.duration || 0;
  }

  ngOnInit() {
    // Load all attempts from localStorage
    this.allAttempts = JSON.parse(localStorage.getItem('attempts') || '{}');
    
    // Get attempts for current module
    this.moduleAttempts = this.allAttempts[`module-${this.module}`] || [];
    
    // Sort by most recent first
    this.moduleAttempts.reverse();
  }

  get previousScoreKeys(): string[] {
    return Object.keys(this.allAttempts).sort();
  }

  get hasMultipleAttempts(): boolean {
    return this.moduleAttempts.length > 0;
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
    const attempts = this.allAttempts[key] || [];
    if (!attempts.length) return 0;
    
    const bestScore = Math.max(...attempts.map(a => (a.score / a.total) * 100));
    return Math.round(bestScore);
  }

  getAttemptCount(key: string): number {
    return (this.allAttempts[key] || []).length;
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

  goHome() {
    this.router.navigate(['/']);
  }

  retryQuiz() {
    this.router.navigate(['/quiz', this.module]);
  }
}