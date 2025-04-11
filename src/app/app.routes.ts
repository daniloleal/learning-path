import { Routes } from '@angular/router';
import { ModuleSelectComponent } from './components/module-select/module-select.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { ResultComponent } from './components/result/result.component';
import { AttemptsListComponent } from './components/attempts-list/attempts-list.component';

export const routes: Routes = [
  { path: '', component: ModuleSelectComponent },
  { path: 'quiz/:moduleId', component: QuizComponent },
  { path: 'result', component: ResultComponent },
  { path: 'attempts', component: AttemptsListComponent }
];