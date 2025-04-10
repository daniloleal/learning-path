// module-select.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-module-select',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-100 p-4">
      <h1 class="text-2xl font-bold mb-6 text-center">Select a Module</h1>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button *ngFor="let id of moduleIds" class="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl shadow-md transition" (click)="startModule(id)">
          Module {{ id }}
        </button>
      </div>
    </div>
  `
})
export class ModuleSelectComponent {
  moduleIds = Array.from({ length: 20 }, (_, i) => i + 1);
  constructor(private router: Router) {}

  startModule(id: number) {
    this.router.navigate(['/quiz', id]);
  }
}