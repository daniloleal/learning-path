import { Component, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="min-h-screen bg-white text-gray-800 transition-colors">
      <header class="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <h1 class="text-lg font-bold">Angular Quiz</h1>
        <button (click)="toggleDarkMode()" class="text-sm px-3 py-1 border border-gray-400 rounded">
          {{ isDarkMode ? 'Light' : 'Dark' }} Mode
        </button>
      </header>

      <main class="p-4">
        <router-outlet></router-outlet>
      </main>

      <footer class="text-center text-xs text-gray-500 border-t border-gray-200 py-2">
        © 2025 Angular Quiz
      </footer>
    </div>
  `
})
export class AppComponent {
  isDarkMode = false;
  private doc = inject(DOCUMENT);

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.doc.documentElement.classList.toggle('dark', this.isDarkMode);
  }
}
