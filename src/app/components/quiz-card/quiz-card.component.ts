// src/app/components/quiz/quiz-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../models/questions.interface';

/**
 * Reusable component for displaying a question card with options
 * This component extracts the question display logic from the main quiz component
 */
@Component({
  selector: 'app-quiz-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="text-lg font-semibold mb-4">{{ question.question }}</h3>
      
      <div class="space-y-3">
        <div 
          *ngFor="let option of question.options; let i = index"
          class="border rounded-lg p-4 cursor-pointer transition-colors"
          [class.border-gray-200]="selectedOption !== i && !showAnswer"
          [class.bg-gray-50]="selectedOption !== i && !showAnswer"
          [class.border-blue-500]="selectedOption === i && !showAnswer"
          [class.bg-blue-50]="selectedOption === i && !showAnswer"
          [class.border-green-500]="showAnswer && i === question.answer"
          [class.bg-green-50]="showAnswer && i === question.answer"
          [class.border-red-500]="showAnswer && selectedOption === i && i !== question.answer"
          [class.bg-red-50]="showAnswer && selectedOption === i && i !== question.answer"
          (click)="onOptionSelect(i)"
        >
          <div class="flex items-start">
            <div 
              class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mr-3 mt-0.5"
              [class.bg-gray-100]="selectedOption !== i && !showAnswer"
              [class.text-gray-600]="selectedOption !== i && !showAnswer"
              [class.bg-blue-100]="selectedOption === i && !showAnswer"
              [class.text-blue-600]="selectedOption === i && !showAnswer"
              [class.bg-green-100]="showAnswer && i === question.answer"
              [class.text-green-600]="showAnswer && i === question.answer"
              [class.bg-red-100]="showAnswer && selectedOption === i && i !== question.answer"
              [class.text-red-600]="showAnswer && selectedOption === i && i !== question.answer"
            >
              {{ ['A', 'B', 'C', 'D'][i] }}
            </div>
            <div>{{ option }}</div>
          </div>
        </div>
      </div>
      
      <!-- Explanation for when answer is shown -->
      <div *ngIf="showAnswer" class="mt-6 border-t pt-4">
        <div 
          class="p-4 rounded-lg"
          [class.bg-green-50]="isCorrect"
          [class.border-green-100]="isCorrect"
          [class.bg-red-50]="!isCorrect"
          [class.border-red-100]="!isCorrect"
        >
          <div class="font-medium mb-2" [class.text-green-700]="isCorrect" [class.text-red-700]="!isCorrect">
            {{ isCorrect ? 'Correct!' : 'Incorrect' }}
          </div>
          <p class="text-gray-700">{{ question.explanation }}</p>
        </div>
      </div>
    </div>
  `
})
export class QuizCardComponent {
  @Input() question!: Question;
  @Input() selectedOption: number | null = null;
  @Input() showAnswer = false;
  @Input() isCorrect = false;
  
  @Output() optionSelected = new EventEmitter<number>();
  
  /**
   * Handle option selection and emit event
   */
  onOptionSelect(index: number): void {
    if (!this.showAnswer) {
      this.optionSelected.emit(index);
    }
  }
}