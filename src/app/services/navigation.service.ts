// src/app/services/navigation.service.ts
import { Injectable } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { Location } from '@angular/common';

/**
 * Service for handling navigation throughout the application
 * Maintains consistent navigation patterns and history management
 */
@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private navigationHistory: string[] = [];
  
  constructor(
    private router: Router,
    private location: Location
  ) {
    // Track navigation events to build history
    this.router.events.subscribe(event => {
      if (event.constructor.name === 'NavigationEnd') {
        this.addToHistory(this.router.url);
      }
    });
  }
  
  /**
   * Add URL to navigation history
   */
  private addToHistory(url: string): void {
    this.navigationHistory.push(url);
    // Keep history at reasonable size
    if (this.navigationHistory.length > 10) {
      this.navigationHistory.shift();
    }
  }
  
  /**
   * Navigate back using browser history or fallback route
   */
  goBack(fallbackRoute: string[] = ['/']): void {
    if (this.navigationHistory.length > 1) {
      this.location.back();
      // Remove current page from history
      this.navigationHistory.pop();
    } else {
      this.router.navigate(fallbackRoute);
    }
  }
  
  /**
   * Navigate to home/topics page
   */
  goToTopics(): void {
    this.router.navigate(['/']);
  }
  
  /**
   * Navigate to modules for a specific topic
   */
  goToModules(topicId: string): void {
    this.router.navigate(['/modules', topicId]);
  }
  
  /**
   * Navigate to a specific quiz
   */
  goToQuiz(topicId: string, moduleId: number): void {
    this.router.navigate(['/quiz', topicId, moduleId]);
  }
  
  /**
   * Navigate to results page with state
   */
  goToResults(resultData: {
    score: number,
    total: number,
    module: number,
    duration: number
  }): void {
    const navigationExtras: NavigationExtras = {
      state: resultData
    };
    this.router.navigate(['/result'], navigationExtras);
  }
  
  /**
   * Navigate to attempts history
   */
  goToAttempts(): void {
    this.router.navigate(['/attempts']);
  }
}
