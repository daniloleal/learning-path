// quiz.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { QuizService } from '../../services/quiz.service';
import { Question } from '../../models/questions.interface';
import { QuizSubmission } from '../../models/quiz-submission.interface';
import { finalize, catchError, switchMap, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AnswerRecord } from '../../models/answer.interface';
import { TopicService } from '../../services/topic.service';


@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz.component.html'
})
export class QuizComponent implements OnInit, OnDestroy {
  topicId!: string;
  moduleId!: string; // Changed to string to match DB structure
  moduleLevel!: number; // Added to track the module level for display
  questions: Question[] = [];
  currentIndex = 0;
  selectedIndex: number | null = null;
  selectedAnswers: number[] = [];
  showAnswer = false;
  correctCount = 0;
  timeLeft = 30;
  timer: any;
  showConfirmDialog = false;
  quizStartTime!: number;
  quizEndTime!: number;
  totalQuizTime = 0;
  isLoading = true;
  hasError = false;
  isSaving = false;
  currentUserId = 1; // In a real app, this would come from an auth service

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private quizService: QuizService,
    private topicService: TopicService,
    private location: Location
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.topicId = params.get('topicId') || '';
      const moduleLevelParam = params.get('moduleId');
      
      if (!moduleLevelParam || !this.topicId) {
        console.error('Missing required route parameters');
        this.router.navigate(['/']);
        return;
      }
      
      // Convert the module level to a number for display
      this.moduleLevel = +moduleLevelParam;
      
      if (isNaN(this.moduleLevel)) {
        console.error('Invalid module level:', moduleLevelParam);
        this.router.navigate(['/']);
        return;
      }
      
      // First, get the actual moduleId from the topicService using the moduleLevel
      this.loadModuleAndQuestions();
    });
  }
  
  loadModuleAndQuestions() {
    this.isLoading = true;
    this.hasError = false;
    
    // First, load the modules for this topic to find the actual moduleId
    this.topicService.getTopicModules$(this.topicId)
      .pipe(
        map(modules => {
          // Find the module with the matching level
          const module = modules.find(m => m.level === this.moduleLevel || +m.id === this.moduleLevel);
          if (!module) {
            throw new Error(`Module with level ${this.moduleLevel} not found for topic ${this.topicId}`);
          }
          return module.id; // Return the string moduleId
        }),
        tap(moduleId => {
          this.moduleId = moduleId;
          console.log(`Found moduleId ${moduleId} for level ${this.moduleLevel}`);
        }),
        switchMap(moduleId => this.quizService.getQuestions(moduleId)),
        catchError(error => {
          console.error('Error loading module or questions:', error);
          this.hasError = true;
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(data => {
        if (data.length > 0) {
          console.log(`Loaded ${data.length} questions for module ${this.moduleId}`);
          this.questions = data;
          this.selectedAnswers = new Array(data.length).fill(-1);
          this.startTimer();
          this.quizStartTime = Date.now();
        } else {
          console.warn(`No questions found for module ${this.moduleId}`);
          this.hasError = true;
        }
      });
  }

  reloadQuestions() {
    this.loadModuleAndQuestions();
  }

  ngOnDestroy() {
    this.clearQuizTimer();
  }

  get currentQuestion(): Question | undefined {
    return this.questions[this.currentIndex];
  }

  selectAnswer(index: number) {
    if (this.showAnswer || !this.currentQuestion) return;
    
    this.selectedIndex = index;
    this.selectedAnswers[this.currentIndex] = index;
    this.showAnswer = true;
    this.clearQuizTimer();
    
    if (index === this.currentQuestion.answer) {
      this.correctCount++;
    }
  }

  nextQuestion() {
    if (this.isLastQuestion) {
      this.quizEndTime = Date.now();
      this.totalQuizTime = Math.floor((this.quizEndTime - this.quizStartTime) / 1000);
      this.saveScore();
    } else {
      this.currentIndex++;
      this.selectedIndex = this.selectedAnswers[this.currentIndex];
      this.showAnswer = this.selectedIndex !== null && this.selectedIndex !== -1;
      
      if (!this.showAnswer) {
        this.startTimer();
      }
    }
  }

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.selectedIndex = this.selectedAnswers[this.currentIndex];
      this.showAnswer = true;
    }
  }

  get isLastQuestion() {
    return this.currentIndex === this.questions.length - 1;
  }

  startTimer() {
    this.timeLeft = 30;
    this.clearQuizTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft === 0) {
        this.clearQuizTimer();
        this.selectAnswer(-1);
      }
    }, 1000);
  }

  clearQuizTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  confirmGoBack() {
    if (this.currentIndex > 0 || this.selectedIndex !== null) {
      this.showConfirmDialog = true;
    } else {
      this.goBack();
    }
  }

  goBack() {
    if (this.topicId) {
      this.router.navigate(['/modules', this.topicId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  saveScore() {
    this.isSaving = true;
    
    // Create an array of answer records to match the expected structure
    const answerRecords: AnswerRecord[] = this.questions.map((q, i) => ({
      question: q.question,
      selectedOption: this.selectedAnswers[i],
      correctOption: q.answer,
      isCorrect: this.selectedAnswers[i] === q.answer
    }));
    
    // Create the submission object according to the QuizSubmission interface requirements
    const submission: Omit<QuizSubmission, 'userId' | 'id' | 'timestamp'> = {
      moduleId: this.moduleId, // Use the string moduleId
      score: this.correctCount,
      total: this.questions.length,
      duration: this.totalQuizTime,
      answers: answerRecords
    };
  
    this.quizService.submitSubmission(submission)
      .pipe(
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (savedSubmission) => {
          // Navigate to results page with the submission data
          this.router.navigate(['/result'], {
            state: {
              score: this.correctCount,
              total: this.questions.length,
              module: this.moduleLevel, // Use the module level for display purposes
              duration: this.totalQuizTime,
              userId: this.currentUserId
            }
          });
        },
        error: (error) => {
          console.error('Error saving quiz submission:', error);
          // Still navigate to results even if there's an error
          this.router.navigate(['/result'], {
            state: {
              score: this.correctCount,
              total: this.questions.length,
              module: this.moduleLevel, // Use the module level for display purposes
              duration: this.totalQuizTime,
              userId: this.currentUserId
            }
          });
        }
      });
  }
}