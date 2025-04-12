// src/app/services/error-handling.service.ts
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlingService {
  constructor() {}

  /**
   * Handles errors in a consistent way across the application
   * @param error The error object
   * @param message User-friendly error message
   * @param showNotification Whether to show a UI notification
   * @returns Observable that errors
   */
  handleError(error: any, message: string, showNotification = true): Observable<never> {
    // Log the error to console
    console.error(message, error);
    
    // In a real application, you might want to implement a notification service
    // or use a toast component for user notifications
    
    // Return an observable that errors
    return throwError(() => new Error(message));
  }
  
  /**
   * Shows a success message to the user
   * @param message Success message to display
   */
  showSuccess(message: string): void {
    console.log('Success:', message);
    
    // In a real application, you would implement UI notifications here
    // For example: this.notificationService.showSuccess(message);
  }
}