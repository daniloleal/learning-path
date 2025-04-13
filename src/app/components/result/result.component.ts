import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QuizService } from '../../services/quiz.service';
import { NavigationService } from '../../services/navigation.service';
import { ErrorHandlingService } from '../../services/error-handling.service';
import { Submission } from '../../models/submission.interface';
import { QuizSubmission } from '../../models/quiz-submission.interface';
import { Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './result.component.html'
})
export class ResultComponent implements OnInit, OnDestroy {
  score = 0;
  total = 0;
  module = 1;
  duration = 0;
  allSubmissions: Record<string, Submission[]> = {};
  moduleSubmissions: QuizSubmission[] = [];
  isLoading = false;
  
  private subscription = new Subscription();

  constructor(
    private router: Router, 
    private quizService: QuizService,
    private navigationService: NavigationService,
    private errorHandling: ErrorHandlingService
  ) {
    // Get data from router state
    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state) {
      this.score = state['score'] || 0;
      this.total = state['total'] || 0;
      this.module = state['module'] || 1;
      this.duration = state['duration'] || 0;
    } else {
      // Fallback if no state (e.g., if page is refreshed)
      this.navigationService.goToTopics();
    }
  }

  ngOnInit(): void {
    this.isLoading = true;
    
    // Load module submissions
    this.subscription.add(
      this.quizService.getSubmissions(this.module).pipe(
        catchError(error => {
          this.errorHandling.handleError(error, 'Failed to load module submissions');
          return [];
        })
      ).subscribe(submissions => {
        this.moduleSubmissions = submissions
          .map(a => ({
            score: a.score,
            total: a.total,
            duration: a.duration
          } as QuizSubmission))
          .reverse();
      })
    );
    
    // Load all submissions and group them by module
    this.subscription.add(
      this.quizService.getSubmissions().pipe(
        finalize(() => this.isLoading = false),
        catchError(error => {
          this.errorHandling.handleError(error, 'Failed to load submissions');
          return [];
        })
      ).subscribe(submissions => {
        this.allSubmissions = this.groupSubmissionsByModule(submissions);
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Group submissions by module ID
   */
  private groupSubmissionsByModule(submissions: QuizSubmission[]): Record<string, Submission[]> {
    const grouped: Record<string, Submission[]> = {};
    
    submissions.forEach(submission => {
      const key = `module-${submission.moduleId}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push({
        score: submission.score,
        total: submission.total,
        duration: submission.duration
      });
    });
    
    return grouped;
  }

  get previousScoreKeys(): string[] {
    return Object.keys(this.allSubmissions).sort((a, b) => {
      const aNum = parseInt(a.replace('module-', ''));
      const bNum = parseInt(b.replace('module-', ''));
      return aNum - bNum;
    });
  }

  get hasMultipleSubmissions(): boolean {
    return this.moduleSubmissions.length > 0;
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
    const submissions = this.allSubmissions[key] || [];
    if (!submissions.length) return 0;
    
    const bestScore = Math.max(...submissions.map(a => (a.score / a.total) * 100));
    return Math.round(bestScore);
  }

  getsubmissionCount(key: string): number {
    return (this.allSubmissions[key] || []).length;
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

  goHome(): void {
    this.navigationService.goToTopics();
  }

  retryQuiz(): void {
    this.navigationService.goToQuiz('', this.module);
  }
}