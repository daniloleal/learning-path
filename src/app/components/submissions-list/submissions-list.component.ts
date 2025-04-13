// src/app/components/submissions-list/submissions-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { NavigationService } from '../../services/navigation.service';
import { ErrorHandlingService } from '../../services/error-handling.service';
import { QuizSubmission } from '../../models/quiz-submission.interface';
import { Observable, BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, switchMap, tap, catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-submissions-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './submissions-list.component.html'
})
export class SubmissionsListComponent implements OnInit, OnDestroy {
  submissions$!: Observable<QuizSubmission[]>;
  isLoading = true;
  private subscription: Subscription = new Subscription();

  constructor(
    private quizService: QuizService,
    private navigationService: NavigationService,
    private errorHandling: ErrorHandlingService
  ) {}

  ngOnInit(): void {
    // Get all submissions for the current user
    this.submissions$ = this.quizService.getUserSubmissions(1).pipe(
      tap(() => this.isLoading = false),
      catchError(error => {
        this.errorHandling.handleError(error, 'Failed to load quiz submissions');
        return [];
      }),
      finalize(() => this.isLoading = false)
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Format date from timestamp
   */
  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  /**
   * Format time in seconds to minutes and seconds
   */
  formatTime(seconds: number): string {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  }

  /**
   * Navigate back to topics
   */
  goBack(): void {
    this.navigationService.goToTopics();
  }
}