import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-module-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-6 px-4 max-w-5xl mx-auto text-center">
      <h2 class="text-2xl font-semibold mb-2">Choose Your Level</h2>
      <p class="text-sm text-gray-600 mb-6">Complete each level with at least 90% to unlock the next.</p>
      <div class="flex justify-center mb-8">
        <button class="px-4 py-2 border border-gray-400 text-sm text-gray-800 rounded hover:bg-gray-100" (click)="resetProgress()">
          Reset Progress
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button *ngFor="let id of moduleIds"
                class="p-4 text-base rounded-lg transition border border-gray-300 shadow-sm flex flex-col items-center justify-center space-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                [ngClass]="{
                  'border-green-500 bg-green-50 text-green-800': getBestScore(id) >= 90,
                  'bg-white text-gray-800': getBestScore(id) < 90
                }"
                [disabled]="!isLevelUnlocked(id)"
                (click)="startModule(id)">
          <div>Level {{ id }}</div>
          <div class="text-sm">Best: {{ getBestScore(id) }}%</div>
          <div class="text-xl">
            <ng-container *ngIf="getBestScore(id) >= 90">✅</ng-container>
            <ng-container *ngIf="!isLevelUnlocked(id)">🔒</ng-container>
            <ng-container *ngIf="isLevelUnlocked(id) && getBestScore(id) < 90">🔓</ng-container>
          </div>
        </button>
      </div>
    </section>
  `
})
export class ModuleSelectComponent {
  moduleIds = Array.from({ length: 20 }, (_, i) => i + 1);

  constructor(private router: Router) {}

  startModule(id: number) {
    if (this.isLevelUnlocked(id)) {
      this.router.navigate(['/quiz', id]);
    }
  }

  getBestScore(moduleId: number): number {
    const allAttempts = JSON.parse(localStorage.getItem('attempts') || '{}');
    const scores = allAttempts[`module-${moduleId}`] || [];
    const best = scores.length ? Math.max(...scores.map((s: any) => s.score / s.total * 100)) : 0;
    return Math.round(best);
  }

  isLevelUnlocked(id: number): boolean {
    if (id === 1) return true;
    const previousBest = this.getBestScore(id - 1);
    return previousBest >= 90;
  }

  resetProgress() {
    localStorage.removeItem('attempts');
    window.location.reload();
  }
}