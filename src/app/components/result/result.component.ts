// result.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-result',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-6">
      <div class="bg-white p-8 rounded-2xl shadow-xl text-center max-w-lg w-full">
        <h1 class="text-2xl font-bold mb-4">Quiz Result</h1>
        <p class="text-lg">You scored <strong>{{ score }}</strong> out of <strong>{{ total }}</strong> in Module {{ module }}</p>
        <p class="text-green-600 mt-2 text-xl">Accuracy: {{ (score / total * 100) | number:'1.0-2' }}%</p>
        <div class="mt-6">
          <h2 class="text-lg font-semibold mb-2">Previous Scores:</h2>
          <ul class="text-sm text-left">
            <li *ngFor="let key of Object.keys(previousScores)">
              {{ key }} - {{ previousScores[key].score }}/{{ previousScores[key].total }}
            </li>
          </ul>
        </div>
        <button class="mt-6 bg-blue-500 text-white px-6 py-3 rounded-xl" (click)="goHome()">Back to Modules</button>
      </div>
    </div>
  `
})
export class ResultComponent {
  score = history.state.score || 0;
  total = history.state.total || 0;
  module = history.state.module || 1;
  previousScores = JSON.parse(localStorage.getItem('scores') || '{}');

  constructor(private router: Router) {}

  get previousScoreKeys(): string[] {
    return Object.keys(this.previousScores);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}