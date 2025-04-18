// topic.service.ts - Improved version
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ErrorHandlingService } from './error-handling.service';

/**
 * Topic data structure
 */
export interface Topic {
  id: string;
  userId: number;
  name: string;
  createdAt: number;
  completedModules: number;
  totalModules: number;
  isArchived?: boolean;  // Added archived flag
}

/**
 * Module data structure
 */
export interface TopicModule {
  id: string;        // String ID format
  level: number;     // Numeric level (1-5)
  topicId: string;
  title: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  bestScore: number;
  submissionCount: number;
}

/**
 * Service for managing topics and their modules
 */
@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private readonly apiUrl = environment.apiUrl;
  private readonly currentUserId = 1; // In a real app, this would come from authentication service
  private topicsSubject = new BehaviorSubject<Topic[]>([]);
  private topics: Topic[] = [];
  private modules: Record<string, TopicModule[]> = {}; // Keyed by topicId

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private errorHandling: ErrorHandlingService
  ) {
    this.loadUserTopics();
  }

  /**
   * Load topics for the current user
   */
  private loadUserTopics(): void {
    this.http.get<Topic[]>(`${this.apiUrl}/topics?userId=${this.currentUserId}`)
      .pipe(
        catchError(error => {
          this.errorHandling.handleError(error, 'Error loading topics', false);
          return of([]);
        })
      )
      .subscribe(topics => {
        this.topics = topics;
        this.topicsSubject.next([...this.topics]);
        
        // Load modules for each topic
        topics.forEach(topic => this.loadTopicModules(topic.id));
      });
  }

  /**
   * Load modules for a specific topic
   */
  private loadTopicModules(topicId: string): void {
    this.http.get<TopicModule[]>(`${this.apiUrl}/modules?topicId=${topicId}`)
      .pipe(
        catchError(error => {
          this.errorHandling.handleError(error, `Error loading modules for topic ${topicId}`, false);
          return of([]);
        })
      )
      .subscribe(modules => {
        // Ensure each module has a level property if not already present
        const processedModules = modules.map(module => {
          if (module.level === undefined) {
            // Try to extract level from id or title if not explicitly set
            const levelFromId = module.id.match(/-level-(\d+)-/);
            const levelFromTitle = module.title.match(/Level (\d+)/);
            const level = levelFromId ? parseInt(levelFromId[1], 10) :
                         levelFromTitle ? parseInt(levelFromTitle[1], 10) : 1;
            
            return {...module, level};
          }
          return module;
        });
        
        this.modules[topicId] = processedModules;
      });
  }

  /**
   * Get all topics for the current user
   */
  getAllTopics(): Topic[] {
    return this.topics;
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
    return this.topics.find(topic => topic.id === topicId);
  }

  /**
   * Get modules for a specific topic
   */
  getTopicModules(topicId: string): TopicModule[] {
    return this.modules[topicId] || [];
  }

  /**
   * Get modules for a specific topic as an observable
   */
  getTopicModules$(topicId: string): Observable<TopicModule[]> {
    if (this.modules[topicId]) {
      return of(this.modules[topicId]);
    }
    
    return this.http.get<TopicModule[]>(`${this.apiUrl}/modules?topicId=${topicId}`)
      .pipe(
        map(modules => {
          // Ensure each module has a level property if not already present
          return modules.map(module => {
            if (module.level === undefined) {
              // Try to extract level from id or title if not explicitly set
              const levelFromId = module.id.match(/-level-(\d+)-/);
              const levelFromTitle = module.title.match(/Level (\d+)/);
              const level = levelFromId ? parseInt(levelFromId[1], 10) :
                           levelFromTitle ? parseInt(levelFromTitle[1], 10) : 1;
              
              return {...module, level};
            }
            return module;
          });
        }),
        tap(modules => {
          this.modules[topicId] = modules;
        }),
        catchError(error => {
          this.errorHandling.handleError(error, `Error loading modules for topic ${topicId}`, false);
          return of([]);
        })
      );
  }

  /**
   * Add a new topic
   */
  addTopic(topic: Omit<Topic, 'id' | 'createdAt'>): Observable<Topic> {
    const newTopic = {
      ...topic,
      id: this.generateId(topic.name),
      createdAt: Date.now(),
      isArchived: false
    };

    return this.http.post<Topic>(`${this.apiUrl}/topics`, newTopic)
      .pipe(
        tap(savedTopic => {
          this.topics.push(savedTopic);
          this.topicsSubject.next([...this.topics]);
        }),
        catchError(error => {
          return this.errorHandling.handleError(error, 'Error creating topic');
        })
      );
  }

  /**
   * Update topic progress
   */
  updateTopicProgress(topicId: string, completedModules: number): Observable<Topic> {
    const topic = this.topics.find(t => t.id === topicId);
    
    if (!topic) {
      return throwError(() => new Error(`Topic with ID ${topicId} not found`));
    }
    
    const updatedTopic = {
      ...topic,
      completedModules
    };
    
    return this.http.put<Topic>(`${this.apiUrl}/topics/${topicId}`, updatedTopic)
      .pipe(
        tap(savedTopic => {
          const index = this.topics.findIndex(t => t.id === topicId);
          if (index !== -1) {
            this.topics[index] = savedTopic;
            this.topicsSubject.next([...this.topics]);
          }
        }),
        catchError(error => {
          return this.errorHandling.handleError(error, 'Error updating topic progress');
        })
      );
  }

  /**
   * Reset all progress for a topic
   */
  resetTopicProgress(topicId: string): Observable<boolean> {
    const topicModules = this.modules[topicId];
    
    if (!topicModules) {
      return throwError(() => new Error(`Modules for topic ${topicId} not found`));
    }
    
    // Reset all modules
    const resetModules = topicModules.map((module, index) => ({
      ...module,
      isUnlocked: module.level === 1, // Only level 1 is unlocked
      isCompleted: false,
      bestScore: 0,
      submissionCount: 0
    }));
    
    // Update modules in the database (batch update)
    const updateRequests = resetModules.map(module => 
      this.http.put(`${this.apiUrl}/modules/${module.id}`, module)
    );
    
    // Update topic progress
    const topic = this.topics.find(t => t.id === topicId);
    if (topic) {
      this.updateTopicProgress(topicId, 0).subscribe();
    }
    
    // Store the updated modules locally
    this.modules[topicId] = resetModules;
    
    return of(true);
  }

  /**
   * Archive a topic (mark as archived without deletion)
   * @param topicId The ID of the topic to archive
   */
  archiveTopic(topicId: string): Observable<Topic> {
    const topic = this.topics.find(t => t.id === topicId);
    
    if (!topic) {
      return throwError(() => new Error(`Topic with ID ${topicId} not found`));
    }
    
    const updatedTopic = {
      ...topic,
      isArchived: true
    };
    
    return this.http.put<Topic>(`${this.apiUrl}/topics/${topicId}`, updatedTopic)
      .pipe(
        tap(savedTopic => {
          const index = this.topics.findIndex(t => t.id === topicId);
          if (index !== -1) {
            this.topics[index] = savedTopic;
            this.topicsSubject.next([...this.topics]);
          }
        }),
        catchError(error => {
          return this.errorHandling.handleError(error, 'Error archiving topic');
        })
      );
  }

  /**
   * Unarchive a topic (remove archived flag)
   * @param topicId The ID of the topic to unarchive
   */
  unarchiveTopic(topicId: string): Observable<Topic> {
    const topic = this.topics.find(t => t.id === topicId);
    
    if (!topic) {
      return throwError(() => new Error(`Topic with ID ${topicId} not found`));
    }
    
    const updatedTopic = {
      ...topic,
      isArchived: false
    };
    
    return this.http.put<Topic>(`${this.apiUrl}/topics/${topicId}`, updatedTopic)
      .pipe(
        tap(savedTopic => {
          const index = this.topics.findIndex(t => t.id === topicId);
          if (index !== -1) {
            this.topics[index] = savedTopic;
            this.topicsSubject.next([...this.topics]);
          }
        }),
        catchError(error => {
          return this.errorHandling.handleError(error, 'Error unarchiving topic');
        })
      );
  }

  /**
   * Delete a topic and all related data
   * @param topicId The ID of the topic to delete
   */
  deleteTopic(topicId: string): Observable<boolean> {
    // Step 1: Get all modules for this topic to delete them later
    return this.http.get<any[]>(`${this.apiUrl}/modules?topicId=${topicId}`).pipe(
      // Step 2: Delete all questions for each module
      switchMap(modules => {
        const moduleIds = modules.map(module => module.id);
        
        if (moduleIds.length === 0) {
          // No modules, continue to topic deletion
          return of(moduleIds);
        }
        
        // Create deletion requests for each module's questions
        const questionDeletionRequests = moduleIds.map(moduleId => 
          this.http.delete(`${this.apiUrl}/questions?moduleId=${moduleId}`)
        );
        
        // Execute all question deletion requests
        return forkJoin(questionDeletionRequests).pipe(
          map(() => moduleIds),
          catchError(error => {
            console.error('Error deleting module questions:', error);
            return of(moduleIds); // Continue even if this fails
          })
        );
      }),
      
      // Step 3: Delete all modules for this topic
      switchMap(moduleIds => {
        if (moduleIds.length === 0) {
          // No modules, continue to topic deletion
          return of(true);
        }
        
        // Delete modules
        return this.http.delete(`${this.apiUrl}/modules?topicId=${topicId}`).pipe(
          map(() => true),
          catchError(error => {
            console.error('Error deleting modules:', error);
            return of(true); // Continue even if this fails
          })
        );
      }),
      
      // Step 4: Delete all submissions related to this topic (requires additional API endpoint)
      switchMap(() => {
        // In a real app, we'd use a direct API endpoint for this
        // Here we go via modules to delete their submissions
        return this.http.delete(`${this.apiUrl}/submissions?topicId=${topicId}`).pipe(
          catchError(error => {
            console.error('Error deleting submissions:', error);
            return of(true); // Continue even if this fails
          })
        );
      }),
      
      // Step 5: Delete the topic itself
      switchMap(() => {
        return this.http.delete<void>(`${this.apiUrl}/topics/${topicId}`).pipe(
          tap(() => {
            // Remove from local state
            const index = this.topics.findIndex(t => t.id === topicId);
            if (index !== -1) {
              this.topics.splice(index, 1);
              this.topicsSubject.next([...this.topics]);
            }
            
            // Remove from modules cache
            delete this.modules[topicId];
          }),
          map(() => true),
          catchError(error => {
            return this.errorHandling.handleError(error, 'Error deleting topic');
          })
        );
      })
    );
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