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
  templateUrl: './quiz-card.component.html'
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