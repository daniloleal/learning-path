import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QuizService } from '../../services/quiz.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap, shareReplay, startWith } from 'rxjs/operators';
import { QuizAttempt } from '../../models/quiz-attempt.interface';
import { ModuleStatus } from '../../models/module-status.interface';

@Component({
  selector: 'app-module-select',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-5xl mx-auto px-4">
        <!-- Header section -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            Angular Quiz Challenge
          </h1>
          <p class="text-gray-600 mb-6">
            Master Angular concepts through progressive levels
          </p>

          <!-- Progress overview -->
          <div
            class="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 mb-4"
          >
            <span class="text-gray-700">Your progress: </span>
            <span class="font-semibold">
              {{ (completedLevels$ | async) || 0 }} / {{ moduleIds.length }} levels
            </span>
            <div class="w-32 h-2 bg-gray-100 rounded-full overflow-hidden ml-2">
              <div
                class="h-2 bg-green-500 rounded-full"
                [style.width.%]="(((completedLevels$ | async) || 0) / moduleIds.length) * 100"
              ></div>
            </div>
          </div>

          <!-- Reset button and attempts link -->
          <div class="flex justify-center gap-4">
            <button
              class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              (click)="confirmReset()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                ></path>
                <path d="M3 3v5h5"></path>
              </svg>
              Reset All Progress
            </button>
            <a
              routerLink="/attempts"
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                ></path>
              </svg>
              View Attempts
            </a>
          </div>
        </div>

        <!-- Level selection grid -->
        <div
          class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          <ng-container *ngIf="moduleStatuses$ | async as statuses">
            <div
              *ngFor="let moduleId of moduleIds"
              class="relative rounded-xl overflow-hidden border bg-white shadow-sm transition-all hover:shadow-md"
              [class.opacity-60]="!getModuleStatus(statuses, moduleId).isUnlocked"
            >
              <!-- Level card -->
              <button
                class="w-full h-full"
                [disabled]="!getModuleStatus(statuses, moduleId).isUnlocked"
                (click)="startModule(moduleId)"
              >
                <div class="p-5 text-center">
                  <!-- Level icon -->
                  <div
                    class="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-xl font-semibold mb-3"
                    [ngClass]="{
                      'bg-green-100 text-green-700': getModuleStatus(statuses, moduleId).isCompleted,
                      'bg-blue-100 text-blue-700': getModuleStatus(statuses, moduleId).isUnlocked && !getModuleStatus(statuses, moduleId).isCompleted,
                      'bg-gray-100 text-gray-500': !getModuleStatus(statuses, moduleId).isUnlocked
                    }"
                  >
                    {{ moduleId }}
                  </div>

                  <!-- Level title and status -->
                  <h3 class="font-medium text-gray-800 mb-1">Level {{ moduleId }}</h3>
                  <div
                    class="text-sm font-medium"
                    [ngClass]="{
                      'text-green-600': getModuleStatus(statuses, moduleId).isCompleted,
                      'text-blue-600': getModuleStatus(statuses, moduleId).isUnlocked && !getModuleStatus(statuses, moduleId).isCompleted,
                      'text-gray-400': !getModuleStatus(statuses, moduleId).isUnlocked
                    }"
                  >
                    <span *ngIf="getModuleStatus(statuses, moduleId).bestScore > 0">
                      Best: {{ getModuleStatus(statuses, moduleId).bestScore }}%
                    </span>
                    <span *ngIf="getModuleStatus(statuses, moduleId).bestScore === 0 && getModuleStatus(statuses, moduleId).isUnlocked">
                      Not attempted
                    </span>
                    <span *ngIf="!getModuleStatus(statuses, moduleId).isUnlocked">
                      Locked
                    </span>
                  </div>

                  <!-- Attempts count -->
                  <div
                    *ngIf="getModuleStatus(statuses, moduleId).attemptCount > 0"
                    class="text-xs text-gray-500 mt-1"
                  >
                    {{ getModuleStatus(statuses, moduleId).attemptCount }} 
                    attempt{{ getModuleStatus(statuses, moduleId).attemptCount > 1 ? 's' : '' }}
                  </div>

                  <!-- Level status icons -->
                  <div class="mt-3 text-xl">
                    <ng-container *ngIf="getModuleStatus(statuses, moduleId).isCompleted">✅</ng-container>
                    <ng-container *ngIf="!getModuleStatus(statuses, moduleId).isUnlocked">🔒</ng-container>
                    <ng-container *ngIf="getModuleStatus(statuses, moduleId).isUnlocked && !getModuleStatus(statuses, moduleId).isCompleted">🔓</ng-container>
                  </div>

                  <!-- Progress indicator -->
                  <div *ngIf="getModuleStatus(statuses, moduleId).bestScore > 0" class="h-1.5 bg-gray-100 mt-3">
                    <div
                      class="h-1.5"
                      [ngClass]="{
                        'bg-green-500': getModuleStatus(statuses, moduleId).isCompleted,
                        'bg-blue-500': !getModuleStatus(statuses, moduleId).isCompleted
                      }"
                      [style.width.%]="getModuleStatus(statuses, moduleId).bestScore"
                    ></div>
                  </div>
                </div>
              </button>

              <!-- Locked overlay -->
              <div
                *ngIf="!getModuleStatus(statuses, moduleId).isUnlocked"
                class="absolute inset-0 bg-gray-100 bg-opacity-10 flex items-center justify-center"
              >
                <div
                  class="bg-white bg-opacity-80 px-3 py-1 rounded text-xs font-medium text-gray-600"
                >
                  Complete Level {{ moduleId - 1 }} first
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- Reset confirmation dialog -->
      <div
        *ngIf="showResetConfirm"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10"
      >
        <div class="bg-white rounded-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-bold mb-3">Reset All Progress?</h3>
          <p class="mb-6 text-gray-600">
            This will delete all your quiz attempts and scores. This action
            cannot be undone.
          </p>
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 border border-gray-300 rounded-lg"
              (click)="showResetConfirm = false"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 bg-red-600 text-white rounded-lg"
              (click)="resetProgress()"
            >
              Reset Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ModuleSelectComponent implements OnInit {
  moduleIds = Array.from({ length: 20 }, (_, i) => i + 1);
  showResetConfirm = false;
  
  // Attempts data store to reduce API calls
  private attemptsCache = new BehaviorSubject<QuizAttempt[]>([]);
  private refreshTrigger = new BehaviorSubject<boolean>(true);
  
  completedLevels$!: Observable<number>;
  moduleStatuses$!: Observable<Record<number, ModuleStatus>>;

  constructor(private router: Router, private quizService: QuizService) {}

  ngOnInit() {
    // Load attempts and cache them
    this.refreshTrigger.pipe(
      switchMap(() => this.quizService.getAttempts())
    ).subscribe(attempts => {
      this.attemptsCache.next(attempts);
    });
    
    // Initialize default module statuses
    const defaultStatuses = this.createDefaultModuleStatuses();
    
    // Calculate and create module statuses map once
    this.moduleStatuses$ = this.attemptsCache.pipe(
      map(attempts => {
        const statusMap = {...defaultStatuses};
          
        // Calculate best scores and attempt counts
        this.moduleIds.forEach(id => {
          const moduleAttempts = attempts.filter(a => a.moduleId === id);
          statusMap[id].attemptCount = moduleAttempts.length;
          
          // Calculate best score if there are valid attempts
          if (moduleAttempts.length > 0) {
            const validAttempts = moduleAttempts.filter(
              a => a.score !== null && a.total !== null && a.total > 0
            );
            
            if (validAttempts.length > 0) {
              const scores = validAttempts.map(a => (a.score / a.total) * 100)
                                       .filter(score => !isNaN(score));
              
              if (scores.length > 0) {
                statusMap[id].bestScore = Math.round(Math.max(...scores));
                statusMap[id].isCompleted = statusMap[id].bestScore >= 90;
              }
            }
          }
        });
        
        // Determine unlock status based on completion of previous level
        for (let i = 2; i <= this.moduleIds.length; i++) {
          statusMap[i].isUnlocked = statusMap[i-1].isCompleted;
        }
        
        return statusMap;
      }),
      startWith(defaultStatuses), // Start with default values to avoid null
      shareReplay(1) // Share the result to avoid recalculation on multiple subscriptions
    );
    
    // Count completed levels
    this.completedLevels$ = this.moduleStatuses$.pipe(
      map(statusMap => 
        Object.values(statusMap).filter(status => status.isCompleted).length
      )
    );
  }

  /**
   * Creates a default status map with initial values
   */
  private createDefaultModuleStatuses(): Record<number, ModuleStatus> {
    const statusMap: Record<number, ModuleStatus> = {};
    
    this.moduleIds.forEach(id => {
      statusMap[id] = {
        moduleId: id,
        bestScore: 0,
        isUnlocked: id === 1, // First level is always unlocked
        isCompleted: false,
        attemptCount: 0,
      };
    });
    
    return statusMap;
  }

  /**
   * Safely gets a module status, ensuring it exists
   */
  getModuleStatus(statuses: Record<number, ModuleStatus>, moduleId: number): ModuleStatus {
    return statuses[moduleId] || {
      moduleId,
      bestScore: 0,
      isUnlocked: moduleId === 1,
      isCompleted: false,
      attemptCount: 0
    };
  }

  startModule(id: number) {
    this.moduleStatuses$.subscribe(statusMap => {
      const status = this.getModuleStatus(statusMap, id);
      if (status.isUnlocked) {
        this.router.navigate(['/quiz', id]);
      }
    });
  }

  confirmReset() {
    this.showResetConfirm = true;
  }

  resetProgress() {
    this.quizService.resetProgress().subscribe(() => {
      this.showResetConfirm = false;
      // Refresh the attempts
      this.refreshTrigger.next(true);
    });
  }
}