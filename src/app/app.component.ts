import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
<div class="min-h-screen bg-gray-50 text-gray-800 transition-colors dark:bg-gray-900 dark:text-gray-100">
  <header class="bg-white border-b border-gray-200 shadow-sm p-4 flex justify-between items-center dark:bg-gray-800 dark:border-gray-700">
    <a routerLink="/" class="text-lg font-bold text-blue-600 flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
        <path d="M17 18h1"></path>
        <path d="M12 18h1"></path>
        <path d="M7 18h1"></path>
      </svg>
      Angular Quiz
    </a>
    <div class="flex items-center gap-4">
      <a 
        routerLink="/attempts"
        class="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        My Attempts
      </a>
      <button 
        (click)="toggleDarkMode()" 
        class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-200"
      >
        <svg *ngIf="!isDarkMode" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>
        <svg *ngIf="isDarkMode" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="m4.93 4.93 1.41 1.41"></path>
          <path d="m17.66 17.66 1.41 1.41"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="m6.34 17.66-1.41 1.41"></path>
          <path d="m19.07 4.93-1.41 1.41"></path>
        </svg>
        {{ isDarkMode ? 'Light' : 'Dark' }} Mode
      </button>
    </div>
  </header>

  <main>
    <router-outlet></router-outlet>
  </main>

  <footer class="text-center py-4 text-sm text-gray-500 border-t border-gray-200 mt-8 dark:border-gray-700 dark:text-gray-400">
    <div class="max-w-5xl mx-auto px-4">
      <p>© 2025 Angular Quiz Challenge | Built with Angular</p>
    </div>
  </footer>
</div>
  `
})
export class AppComponent implements OnInit {
  isDarkMode = false;
  private doc = inject(DOCUMENT);

  ngOnInit() {
    // Set light mode as the default (don't check system preference)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      this.doc.documentElement.classList.add('dark');
    } else {
      // Default to light mode
      this.isDarkMode = false;
      this.doc.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.doc.documentElement.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }
}