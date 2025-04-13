// src/app/components/shared/ai-loading.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Component for displaying a loading indicator during AI content generation
 */
@Component({
  selector: 'app-ai-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-loading.compnent.html'
})
export class AILoadingComponent {
  @Input() title = 'Generating AI Content';
  @Input() message = 'Please wait while our AI generates high-quality questions for your quiz. This may take a minute...';
  @Input() showProgress = true;
  @Input() progress = 0;
  @Input() progressText = 'Starting up...';
}