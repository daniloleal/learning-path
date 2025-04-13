// src/app/components/shared/openai-error.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Component for displaying OpenAI API errors and providing fallback options
 */
@Component({
  selector: 'app-openai-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './openai-error.component.html'
})
export class OpenAIErrorComponent {
  @Input() title = 'Error Generating Questions';
  @Input() message = 'There was a problem connecting to the OpenAI service.';
  @Input() detailedError = '';
  @Input() showRetry = true;
  @Input() showUseMock = true;
  @Input() showCancel = true;
  
  @Output() onRetry = new EventEmitter<void>();
  @Output() onUseMock = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
}
