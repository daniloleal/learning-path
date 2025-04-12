import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QuizService } from '../../services/quiz.service';
import { TopicService, Topic, TopicModule } from '../../services/topic.service';
import { Observable, of } from 'rxjs';
import { map, tap, catchError, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-module-select',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './module-select.component.html'
})
export class ModuleSelectComponent implements OnInit {
  topicId!: string;
  showResetConfirm = false;
  currentTopic$!: Observable<Topic | null>;
  topicModules$!: Observable<TopicModule[]>;
  currentUserId = 1; // In a real app, this would come from an authentication service
  
  constructor(
    private router: Router, 
    private route: ActivatedRoute, 
    private quizService: QuizService,
    private topicService: TopicService
  ) {}

  ngOnInit() {
    // Get the topic ID from the route params
    this.route.params.subscribe(params => {
      this.topicId = params['topicId'];
      
      if (!this.topicId) {
        this.router.navigate(['/']);
        return;
      }
      
      // Load topic data
      this.loadTopicData();
    });
  }

  /**
   * Load topic data and modules
   */
  loadTopicData() {
    this.currentTopic$ = this.topicService.getTopics$().pipe(
      map(topics => topics.find(topic => 
        topic.id === this.topicId && topic.userId === this.currentUserId
      ) || null),
      tap(topic => {
        if (!topic) {
          console.error(`Topic with ID ${this.topicId} not found for user ${this.currentUserId}`);
          this.router.navigate(['/']);
        }
      }),
      catchError(err => {
        console.error('Error loading topic:', err);
        this.router.navigate(['/']);
        return of(null);
      }),
      shareReplay(1)
    );

    // Add this to fetch modules separately
    this.topicModules$ = this.topicService.getTopicModules$(this.topicId);
  }

  /**
   * Start a module quiz
   */
  startModule(moduleId: string | number) {
    // Make sure we're sending a number ID
    const numericId = typeof moduleId === 'string' ? parseInt(moduleId, 10) : moduleId;
    
    // Guard against NaN
    if (isNaN(numericId)) {
      console.error('Invalid module ID:', moduleId);
      return;
    }
    
    console.log('Navigating to quiz with module ID:', numericId);
    this.router.navigate(['/quiz', this.topicId, numericId]);
  }

  /**
   * Navigate back to topics selection
   */
  navigateToTopics() {
    this.router.navigate(['/']);
  }

  /**
   * Show reset confirmation dialog
   */
  confirmReset() {
    this.showResetConfirm = true;
  }

  /**
   * Reset progress for the current topic
   */
  resetProgress() {
    this.topicService.resetTopicProgress(this.topicId);
    this.showResetConfirm = false;
  }
}