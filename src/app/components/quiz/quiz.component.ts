// quiz.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { QuizService } from '../../services/quiz.service';
import { Question } from '../../models/questions.interface';
import { QuizAttempt } from '../../models/quiz-attempt.interface';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AnswerRecord } from '../../models/answer.interface';


@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-white p-6 max-w-3xl mx-auto">
      <!-- Header with back button and module info -->
      <div class="flex justify-between items-center mb-6">
        <button 
          (click)="confirmGoBack()" 
          class="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <span>←</span> Back to Levels
        </button>
        <div class="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
          Level {{ moduleId }}
        </div>
      </div>

      <!-- Progress bar and statistics -->
      <div class="mb-6">
        <div class="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div 
            class="h-3 bg-gradient-to-r from-blue-400 to-green-500 rounded-full transition-all duration-300" 
            [style.width.%]="(currentIndex / questions.length) * 100"
          ></div>
        </div>
        <div class="mt-2 flex justify-between text-sm text-gray-600">
          <p>Question {{ currentIndex + 1 }} of {{ questions.length }}</p>
          <div class="flex items-center gap-2">
            <span 
              class="inline-flex items-center justify-center h-6 w-6 rounded-full"
              [ngClass]="timeLeft < 10 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'"
            >
              {{ timeLeft }}
            </span>
            <span>seconds left</span>
          </div>
        </div>
      </div>

      <!-- Quiz content -->
      <div *ngIf="!isLoading; else loadingTpl" class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <p class="mb-6 text-lg font-medium">{{ currentQuestion?.question }}</p>
        
        <div class="grid gap-3">
          <button
            *ngFor="let option of currentQuestion?.options; let i = index"
            (click)="selectAnswer(i)"
            class="p-4 border-2 rounded-xl text-left transition flex items-center gap-3"
            [ngClass]="{
              'bg-green-50 border-green-500 text-green-700': showAnswer && i === currentQuestion?.answer,
              'bg-red-50 border-red-500 text-red-700': showAnswer && i === selectedIndex && i !== currentQuestion?.answer,
              'hover:bg-gray-50 border-gray-300': !showAnswer,
              'border-blue-400 bg-blue-50': selectedIndex === i && !showAnswer
            }"
            [disabled]="showAnswer"
          >
            <span class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              [ngClass]="{
                'bg-green-100 text-green-700': showAnswer && i === currentQuestion?.answer,
                'bg-red-100 text-red-700': showAnswer && i === selectedIndex && i !== currentQuestion?.answer,
                'bg-gray-100 text-gray-700': !showAnswer && selectedIndex !== i,
                'bg-blue-100 text-blue-700': selectedIndex === i && !showAnswer
              }"
            >
              {{ ['A', 'B', 'C', 'D'][i] }}
            </span>
            <span>{{ option }}</span>
          </button>
        </div>
      </div>

      <!-- Answer explanation section -->
      <div class="mt-6" *ngIf="showAnswer">
        <div 
          class="p-5 rounded-xl border-l-4 transition-all"
          [ngClass]="{'border-green-500 bg-green-50': selectedIndex === currentQuestion?.answer, 'border-red-500 bg-red-50': selectedIndex !== currentQuestion?.answer}"
        >
          <p class="text-lg font-semibold mb-2">
            <span *ngIf="selectedIndex === currentQuestion?.answer">✅ Correct!</span>
            <span *ngIf="selectedIndex !== currentQuestion?.answer">❌ Incorrect</span>
          </p>
          <p class="text-gray-700">{{ currentQuestion?.explanation }}</p>
        </div>
        
        <div class="mt-6 flex justify-between">
          <button 
            *ngIf="currentIndex > 0" 
            class="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50" 
            (click)="prevQuestion()"
          >
            Previous Question
          </button>
          <div class="flex-grow"></div>
          <button 
            class="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm" 
            (click)="nextQuestion()"
          >
            {{ isLastQuestion ? 'Finish Quiz' : 'Next Question' }}
          </button>
        </div>
      </div>

      <!-- Error message -->
      <div *ngIf="hasError" class="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        <p class="font-medium">Error loading questions</p>
        <p>There was a problem loading the quiz questions. Please try again or return to the levels page.</p>
        <button 
          class="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200" 
          (click)="reloadQuestions()"
        >
          Retry
        </button>
      </div>

      <!-- Loading template -->
      <ng-template #loadingTpl>
        <div class="p-10 flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm">
          <div class="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p>Loading questions for Level {{ moduleId }}...</p>
        </div>
      </ng-template>
    </div>

    <!-- Confirmation Dialog -->
    <div *ngIf="showConfirmDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-3">Leave Quiz?</h3>
        <p class="mb-6 text-gray-600">Your progress in this quiz will be lost. Are you sure you want to go back?</p>
        <div class="flex justify-end gap-3">
          <button class="px-4 py-2 border border-gray-300 rounded-lg" (click)="showConfirmDialog = false">Cancel</button>
          <button class="px-4 py-2 bg-blue-600 text-white rounded-lg" (click)="goBack()">Leave Quiz</button>
        </div>
      </div>
    </div>

    <!-- Saving Progress Dialog -->
    <div *ngIf="isSaving" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div class="bg-white rounded-xl p-6 w-full max-w-md flex flex-col items-center">
        <div class="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-800">Saving your quiz results...</p>
      </div>
    </div>
  `
})
export class QuizComponent implements OnInit, OnDestroy {
  moduleId!: number;
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
    private location: Location
  ) {}

  ngOnInit() {
    this.moduleId = +this.route.snapshot.paramMap.get('moduleId')!;
    this.quizStartTime = Date.now();
    this.loadQuestions();
  }

  loadQuestions() {
    this.isLoading = true;
    this.hasError = false;
    
    this.quizService.getQuestions(this.moduleId)
      .pipe(
        catchError(error => {
          console.error(`Failed to load questions for user ${this.currentUserId}, module ${this.moduleId}:`, error);
          this.hasError = true;
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(data => {
        if (data.length > 0) {
          console.log(`Loaded ${data.length} questions for user ${this.currentUserId}, module ${this.moduleId}`);
          this.questions = data;
          this.selectedAnswers = new Array(data.length).fill(-1);
          this.startTimer();
        } else {
          console.warn(`No questions found for user ${this.currentUserId}, module ${this.moduleId}`);
          this.hasError = true;
        }
      });
  }

  reloadQuestions() {
    this.loadQuestions();
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
    this.router.navigate(['/']);
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
    
    // Create the attempt object according to the QuizAttempt interface requirements
    const attempt: Omit<QuizAttempt, 'userId' | 'id' | 'timestamp'> = {
      moduleId: this.moduleId,
      score: this.correctCount,
      total: this.questions.length,
      duration: this.totalQuizTime,
      answers: answerRecords
    };
  
    this.quizService.submitAttempt(attempt)
      .pipe(
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (savedAttempt) => {
          // Navigate to results page with the attempt data
          this.router.navigate(['/result'], {
            state: {
              score: this.correctCount,
              total: this.questions.length,
              module: this.moduleId,
              duration: this.totalQuizTime,
              userId: this.currentUserId // Include userId in navigation state
            }
          });
        },
        error: (error) => {
          console.error('Error saving quiz attempt:', error);
          // Still navigate to results even if there's an error
          this.router.navigate(['/result'], {
            state: {
              score: this.correctCount,
              total: this.questions.length,
              module: this.moduleId,
              duration: this.totalQuizTime,
              userId: this.currentUserId // Include userId in navigation state
            }
          });
        }
      });
  }
}