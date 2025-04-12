// src/app/services/storage.service.ts
import { Injectable } from '@angular/core';

/**
 * Service for managing localStorage interactions with error handling
 */
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  /**
   * Checks if localStorage is available
   */
  private get isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.error('localStorage is not available:', error);
      return false;
    }
  }

  /**
   * Gets an item from localStorage
   * @param key The key to retrieve
   * @returns The stored value or null if not found/available
   */
  getItem(key: string): string | null {
    if (!this.isAvailable) return null;
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  }

  /**
   * Sets an item in localStorage
   * @param key The key to store
   * @param value The value to store
   * @returns Boolean indicating success
   */
  setItem(key: string, value: string): boolean {
    if (!this.isAvailable) return false;
    
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      
      // If the error is due to quota exceeded, we attempt to clear some space
      if (error instanceof DOMException && 
          (error.name === 'QuotaExceededError' || 
           error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        this.clearOldItems();
        // Try again after cleanup
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          console.error('Failed to write to localStorage even after cleanup:', retryError);
        }
      }
      
      return false;
    }
  }

  /**
   * Removes an item from localStorage
   * @param key The key to remove
   * @returns Boolean indicating success
   */
  removeItem(key: string): boolean {
    if (!this.isAvailable) return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  /**
   * Clears all items from localStorage
   * @returns Boolean indicating success
   */
  clear(): boolean {
    if (!this.isAvailable) return false;
    
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
  
  /**
   * Clean up old or less important items to free up space
   * This is called when a quota exceeded error occurs
   */
  private clearOldItems(): void {
    // Implement a strategy to clear less important items
    // This is a simplified example that keeps only the most important keys
    const keysToKeep = ['topics', 'user', 'theme'];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error while clearing old localStorage items:', error);
    }
  }
}