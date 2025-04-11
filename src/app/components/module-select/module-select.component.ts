import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-module-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-5xl mx-auto px-4">
        <!-- Header section -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Angular Quiz Challenge</h1>
          <p class="text-gray-600 mb-6">Master Angular concepts through progressive levels</p>
          
          <!-- Progress overview -->
          <div class="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 mb-4">
            <span class="text-gray-700">Your progress: </span>
            <span class="font-semibold">{{ completedLevels }} / {{ moduleIds.length }} levels</span>
            <div class="w-32 h-2 bg-gray-100 rounded-full overflow-hidden ml-2">
              <div 
                class="h-2 bg-green-500 rounded-full" 
                [style.width.%]="(completedLevels / moduleIds.length) * 100"
              ></div>
            </div>
          </div>
          
          <!-- Reset button -->
          <div class="flex justify-center">
            <button 
              class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm" 
              (click)="confirmReset()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
              Reset All Progress
            </button>
          </div>
        </div>
        
        <!-- Level selection grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div 
            *ngFor="let id of moduleIds"
            class="relative rounded-xl overflow-hidden border bg-white shadow-sm transition-all hover:shadow-md"
            [class.opacity-60]="!isLevelUnlocked(id)"
          >
            <!-- Level card -->
            <button
              class="w-full h-full"
              [disabled]="!isLevelUnlocked(id)"
              (click)="startModule(id)"
            >
              <div class="p-5 text-center">
                <!-- Level icon -->
                <div 
                  class="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-xl font-semibold mb-3"
                  [ngClass]="{
                    'bg-green-100 text-green-700': getBestScore(id) >= 90,
                    'bg-blue-100 text-blue-700': isLevelUnlocked(id) && getBestScore(id) < 90,
                    'bg-gray-100 text-gray-500': !isLevelUnlocked(id)
                  }"
                >
                  {{ id }}
                </div>
                
                <!-- Level title and status -->
                <h3 class="font-medium text-gray-800 mb-1">Level {{ id }}</h3>
                <div 
                  class="text-sm font-medium"
                  [ngClass]="{
                    'text-green-600': getBestScore(id) >= 90,
                    'text-blue-600': isLevelUnlocked(id) && getBestScore(id) < 90,
                    'text-gray-400': !isLevelUnlocked(id)
                  }"
                >
                  <span *ngIf="getBestScore(id) > 0">Best: {{ getBestScore(id) }}%</span>
                  <span *ngIf="getBestScore(id) === 0 && isLevelUnlocked(id)">Not attempted</span>
                  <span *ngIf="!isLevelUnlocked(id)">Locked</span>
                </div>
                
                <!-- Attempts count -->
                <div *ngIf="getAttemptCount(id) > 0" class="text-xs text-gray-500 mt-1">
                  {{ getAttemptCount(id) }} attempt{{ getAttemptCount(id) > 1 ? 's' : '' }}
                </div>

                <!-- Level status icons -->
                <div class="mt-3 text-xl">
                  <ng-container *ngIf="getBestScore(id) >= 90">✅</ng-container>
                  <ng-container *ngIf="!isLevelUnlocked(id)">🔒</ng-container>
                  <ng-container *ngIf="isLevelUnlocked(id) && getBestScore(id) < 90">🔓</ng-container>
                </div>
              </div>
              
              <!-- Progress indicator -->
              <div *ngIf="getBestScore(id) > 0" class="h-1.5 bg-gray-100">
                <div 
                  class="h-1.5"
                  [ngClass]="{'bg-green-500': getBestScore(id) >= 90, 'bg-blue-500': getBestScore(id) < 90}"
                  [style.width.%]="getBestScore(id)"
                ></div>
              </div>
            </button>
            
            <!-- Locked overlay -->
            <div 
              *ngIf="!isLevelUnlocked(id)" 
              class="absolute inset-0 bg-gray-100 bg-opacity-10 flex items-center justify-center"
            >
              <div class="bg-white bg-opacity-80 px-3 py-1 rounded text-xs font-medium text-gray-600">
                Complete Level {{ id - 1 }} first
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Reset confirmation dialog -->
    <div *ngIf="showResetConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-3">Reset All Progress?</h3>
        <p class="mb-6 text-gray-600">This will delete all your quiz attempts and scores. This action cannot be undone.</p>
        <div class="flex justify-end gap-3">
          <button class="px-4 py-2 border border-gray-300 rounded-lg" (click)="showResetConfirm = false">Cancel</button>
          <button class="px-4 py-2 bg-red-600 text-white rounded-lg" (click)="resetProgress()">Reset Progress</button>
        </div>
      </div>
    </div>
  `
})
export class ModuleSelectComponent implements OnInit {
  moduleIds = Array.from({ length: 20 }, (_, i) => i + 1);
  allAttempts: Record<string, any[]> = {};
  showResetConfirm = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadAttempts();
  }

  loadAttempts() {
    this.allAttempts = JSON.parse(localStorage.getItem('attempts') || '{}');
  }

  startModule(id: number) {
    if (this.isLevelUnlocked(id)) {
      this.router.navigate(['/quiz', id]);
    }
  }

  getBestScore(moduleId: number): number {
    const moduleKey = `module-${moduleId}`;
    const scores = this.allAttempts[moduleKey] || [];
    const best = scores.length ? Math.max(...scores.map((s: any) => s.score / s.total * 100)) : 0;
    return Math.round(best);
  }

  getAttemptCount(moduleId: number): number {
    const moduleKey = `module-${moduleId}`;
    return (this.allAttempts[moduleKey] || []).length;
  }

  isLevelUnlocked(id: number): boolean {
    if (id === 1) return true;
    const previousBest = this.getBestScore(id - 1);
    return previousBest >= 90;
  }

  get completedLevels(): number {
    return this.moduleIds.filter(id => this.getBestScore(id) >= 90).length;
  }

  confirmReset() {
    this.showResetConfirm = true;
  }

  resetProgress() {
    localStorage.removeItem('attempts');
    this.showResetConfirm = false;
    this.loadAttempts();
  }
}