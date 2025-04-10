// result.component.ts (clean template rendering)
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-result',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-6">
      <div class="bg-white p-8 rounded-2xl shadow-xl text-center max-w-lg w-full">
        <h1 class="text-2xl font-bold mb-4">Quiz Result</h1>
        <p class="text-lg">You scored <strong>{{ score }}</strong> out of <strong>{{ total }}</strong> in Level {{ module }}</p>
        <p class="text-green-600 mt-2 text-xl">Accuracy: {{ (score / total * 100) | number:'1.0-2' }}%</p>
        <div class="mt-6">
          <h2 class="text-lg font-semibold mb-2">All Scores:</h2>
          <ul class="text-sm text-left">
            <li *ngFor="let key of previousScoreKeys">
              {{ key }} - {{ formatAttempts(key) }}
            </li>
          </ul>
        </div>
        <button class="mt-6 bg-blue-500 text-white px-6 py-3 rounded-xl" (click)="goHome()">Back to Levels</button>
      </div>
    </div>
  `
})
export class ResultComponent {
  score = history.state.score || 0;
  total = history.state.total || 0;
  module = history.state.module || 1;
  previousScores = JSON.parse(localStorage.getItem('attempts') || '{}');

  constructor(private router: Router) {
    const attempts = this.previousScores[`module-${this.module}`] || [];
    attempts.push({ score: this.score, total: this.total });
    this.previousScores[`module-${this.module}`] = attempts;
    localStorage.setItem('attempts', JSON.stringify(this.previousScores));
  }

  get previousScoreKeys(): string[] {
    return Object.keys(this.previousScores);
  }

  formatAttempts(key: string): string {
    return this.previousScores[key].map((s: any) => `${s.score}/${s.total}`).join(', ');
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
