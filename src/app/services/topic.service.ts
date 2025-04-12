// src/app/services/topic.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { QuizAttempt } from '../models/quiz-attempt.interface';
import { Question } from '../models/questions.interface';
import { AIQuizResponse } from './ai-quiz.service';
import { environment } from '../../environments/environment';
import { catchError, tap } from 'rxjs/operators';

/**
 * Topic data structure
 */
export interface Topic {
  id: string;
  userId: number;  // Added userId to the Topic interface
  name: string;
  modules: TopicModule[];
  createdAt: number;
  completedModules: number;
  totalModules: number;
}

/**
 * Topic module data structure
 */
export interface TopicModule {
  moduleId: number;
  title: string;
  questions?: Question[]; // Made optional since not all modules may have questions loaded
  isUnlocked: boolean;
  isCompleted: boolean;
  bestScore: number;
  attemptCount: number;
}

/**
 * Service for managing topics and their modules
 */
@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private static readonly STORAGE_KEY = 'topics';
  private readonly apiUrl = environment.apiUrl;
  private readonly currentUserId = 1; // In a real app, this would come from authentication service
  private topics: Topic[] = [];
  private topicsSubject = new BehaviorSubject<Topic[]>([]);
  
  constructor(
    private storageService: StorageService,
    private http: HttpClient
  ) {
    this.loadFromStorage();
    this.loadFromServer(); // Try to load from server first
  }

  /**
   * Load topics from local storage
   */
  private loadFromStorage(): void {
    const userStorageKey = `${TopicService.STORAGE_KEY}-user-${this.currentUserId}`;
    const storedTopics = this.storageService.getItem(userStorageKey);
    if (storedTopics) {
      try {
        this.topics = JSON.parse(storedTopics);
        this.topicsSubject.next([...this.topics]);
      } catch (error) {
        console.error('Error parsing stored topics:', error);
        this.topics = [];
        this.topicsSubject.next([]);
      }
    }
  }

  /**
   * Try to load topics from server
   */
  private loadFromServer(): void {
    this.http.get<Topic[]>(`${this.apiUrl}/user-topics/${this.currentUserId}`).pipe(
      tap(topics => {
        if (topics && topics.length > 0) {
          this.topics = topics;
          this.topicsSubject.next([...this.topics]);
          this.saveToStorage(); // Cache the results
        }
      }),
      catchError(error => {
        console.error('Error loading topics from server, using local storage:', error);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Save topics to local storage
   */
  private saveToStorage(): void {
    const userStorageKey = `${TopicService.STORAGE_KEY}-user-${this.currentUserId}`;
    this.storageService.setItem(userStorageKey, JSON.stringify(this.topics));
    this.topicsSubject.next([...this.topics]);
  }

  /**
   * Get all topics for the current user
   */
  getAllTopics(): Topic[] {
    return this.topics.filter(topic => topic.userId === this.currentUserId);
  }

  /**
   * Get topics as an observable
   */
  getTopics$(): Observable<Topic[]> {
    return this.topicsSubject.asObservable();
  }

  /**
   * Get a specific topic by ID
   */
  getTopic(topicId: string): Topic | undefined {
    return this.topics.find(topic => topic.id === topicId && topic.userId === this.currentUserId);
  }

  /**
   * Add a new topic with generated quiz content
   */
  addTopic(name: string, content: AIQuizResponse): Topic {
    const topicId = this.generateId(name);
    
    // Map the AI-generated content to our topic structure
    const modules: TopicModule[] = content.modules.map((mod, index) => ({
      moduleId: mod.moduleId,
      title: mod.title,
      questions: mod.questions,
      isUnlocked: index === 0, // First module is always unlocked
      isCompleted: false,
      bestScore: 0,
      attemptCount: 0
    }));

    const newTopic: Topic = {
      id: topicId,
      userId: this.currentUserId, // Associate with current user
      name,
      modules,
      createdAt: Date.now(),
      completedModules: 0,
      totalModules: modules.length
    };

    // Save to database
    this.saveTopicQuestions(newTopic);

    // Add to local collection and update storage
    this.topics.push(newTopic);
    this.saveToStorage();
    
    return newTopic;
  }

  /**
   * Save topic questions to database
   * This would be an API call in production
   */
  private saveTopicQuestions(topic: Topic): void {
    // For each module with questions, save to the database
    topic.modules.forEach(module => {
      if (module.questions && module.questions.length > 0) {
        const questionData = {
          userId: this.currentUserId,
          moduleId: module.moduleId,
          questions: module.questions
        };

        // This would be an API call in production
        // For now, we'll just log it
        console.log(`Saving questions for user ${this.currentUserId}, module ${module.moduleId}`);
        
        // You would make an API call here:
        // this.http.post(`${this.apiUrl}/questions`, questionData).subscribe();
        
        // Remove questions from module after saving to database
        // This keeps the local storage smaller
        delete module.questions;
      }
    });
  }

  /**
   * Remove a topic
   */
  removeTopic(topicId: string): void {
    this.topics = this.topics.filter(topic => 
      !(topic.id === topicId && topic.userId === this.currentUserId)
    );
    this.saveToStorage();
  }

  /**
   * Update topic statistics after a quiz attempt
   */
  updateTopicStats(topicId: string, moduleId: number, attempt: QuizAttempt): void {
    const topicIndex = this.topics.findIndex(topic => 
      topic.id === topicId && topic.userId === this.currentUserId
    );
    
    if (topicIndex === -1) return;
    
    const topic = this.topics[topicIndex];
    const moduleIndex = topic.modules.findIndex(mod => mod.moduleId === moduleId);
    if (moduleIndex === -1) return;
    
    // Update module stats
    const module = topic.modules[moduleIndex];
    module.attemptCount++;
    
    const scorePercentage = Math.round((attempt.score / attempt.total) * 100);
    if (scorePercentage > module.bestScore) {
      module.bestScore = scorePercentage;
    }
    
    // Mark as completed if score is 90% or higher
    const wasCompletedBefore = module.isCompleted;
    if (scorePercentage >= 90 && !module.isCompleted) {
      module.isCompleted = true;
      topic.completedModules++;
      
      // Unlock the next module if there is one
      if (moduleIndex < topic.modules.length - 1) {
        topic.modules[moduleIndex + 1].isUnlocked = true;
      }
    }
    
    // Create a new object to trigger change detection
    this.topics[topicIndex] = {...topic};
    this.saveToStorage();
  }

  /**
   * Reset all progress for a topic
   */
  resetTopicProgress(topicId: string): boolean {
    const topicIndex = this.topics.findIndex(topic => 
      topic.id === topicId && topic.userId === this.currentUserId
    );
    
    if (topicIndex === -1) return false;
    
    const topic = {...this.topics[topicIndex]};
    
    // Reset all modules except first one
    topic.modules = topic.modules.map((module, index) => ({
      ...module,
      isUnlocked: index === 0, // Only first module is unlocked
      isCompleted: false,
      bestScore: 0,
      attemptCount: 0
    }));
    
    topic.completedModules = 0;
    this.topics[topicIndex] = topic;
    this.saveToStorage();
    
    return true;
  }

  /**
   * Generate a unique ID based on name
   */
  private generateId(name: string): string {
    const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now().toString(36);
    return `${normalized}-${timestamp}`;
  }
}