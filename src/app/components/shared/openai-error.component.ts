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
  template: `
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 my-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-lg font-medium text-red-800">{{ title }}</h3>
          <div class="mt-2 text-red-700">
            <p>{{ message }}</p>
            <p class="mt-2" *ngIf="detailedError">
              <span class="font-semibold">Error details:</span> {{ detailedError }}
            </p>
          </div>
          <div class="mt-4 flex gap-3">
            <button 
              *ngIf="showRetry"
              (click)="onRetry.emit()"
              class="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-medium rounded transition-colors"
            >
              Retry
            </button>
            <button 
              *ngIf="showUseMock"
              (click)="onUseMock.emit()"
              class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded transition-colors"
            >
              Use Sample Questions
            </button>
            <button 
              *ngIf="showCancel"
              (click)="onCancel.emit()"
              class="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `
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
