// quiz.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface Question {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

@Component({
  selector: 'app-quiz',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-white p-6 max-w-3xl mx-auto">
      <div class="mb-4">
        <div class="h-2 bg-gray-200 rounded">
          <div class="h-2 bg-green-500 rounded" [style.width.%]="(currentIndex / questions.length) * 100"></div>
        </div>
        <p class="text-sm text-gray-500 mt-1">Question {{ currentIndex + 1 }} of {{ questions.length }} · Time left: {{ timeLeft }}s</p>
      </div>
      <h2 class="text-xl font-bold mb-4">Module {{ moduleId }}</h2>
      <p class="mb-4 text-lg">{{ currentQuestion.question }}</p>
      <div class="grid gap-2">
        <button
          *ngFor="let option of currentQuestion?.options; let i = index"
          (click)="selectAnswer(i)"
          class="p-3 border rounded-xl text-left transition"
          [ngClass]="{
            'bg-green-200 border-green-500': showAnswer && i === currentQuestion.answer,
            'bg-red-200 border-red-500': showAnswer && i === selectedIndex && i !== currentQuestion.answer,
            'hover:bg-gray-100': !showAnswer
          }"
          [disabled]="showAnswer"
        >
          {{ option }}
        </button>
      </div>
      <div class="mt-6" *ngIf="showAnswer">
        <p class="text-lg font-semibold">{{ selectedIndex === currentQuestion.answer ? '✅ Correct!' : '❌ Incorrect.' }}</p>
        <p class="mt-2 italic">{{ currentQuestion.explanation }}</p>
        <button class="mt-6 p-3 bg-blue-500 text-white rounded-xl" (click)="nextQuestion()">
          {{ isLastQuestion ? 'Finish Quiz' : 'Next Question' }}
        </button>
      </div>
    </div>
  `
})
export class QuizComponent implements OnInit {
  moduleId!: number;
  questions: Question[] = [];
  currentIndex = 0;
  selectedIndex: number | null = null;
  showAnswer = false;
  correctCount = 0;
  timeLeft = 30;
  timer: any;

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.moduleId = +this.route.snapshot.paramMap.get('moduleId')!;
    this.http.get<Question[]>(`/assets/module-${this.moduleId}.json`).subscribe(data => {
      console.log("test")
      this.questions = data;
      this.startTimer();
    });
  }

  get currentQuestion() {
    return this.questions[this.currentIndex];
  }

  selectAnswer(index: number) {
    if (this.showAnswer) return;
    this.selectedIndex = index;
    this.showAnswer = true;
    clearInterval(this.timer);
    if (index === this.currentQuestion.answer) {
      this.correctCount++;
    }
  }

  nextQuestion() {
    if (this.isLastQuestion) {
      const scores = JSON.parse(localStorage.getItem('scores') || '{}');
      scores[`module-${this.moduleId}`] = {
        score: this.correctCount,
        total: this.questions.length
      };
      localStorage.setItem('scores', JSON.stringify(scores));

      this.router.navigate(['/result'], {
        state: {
          score: this.correctCount,
          total: this.questions.length,
          module: this.moduleId
        }
      });
    } else {
      this.currentIndex++;
      this.selectedIndex = null;
      this.showAnswer = false;
      this.startTimer();
    }
  }

  get isLastQuestion() {
    return this.currentIndex === this.questions.length - 1;
  }

  startTimer() {
    this.timeLeft = 30;
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft === 0) {
        clearInterval(this.timer);
        this.selectAnswer(-1);
      }
    }, 1000);
  }
}