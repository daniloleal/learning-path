import { Routes } from '@angular/router';
import { ModuleSelectComponent } from './components/module-select/module-select.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { ResultComponent } from './components/result/result.component';
import { AttemptsListComponent } from './components/attempts-list/attempts-list.component';
import { TopicSelectionComponent } from './components/topic-selection/topic-selection.component';

export const routes: Routes = [
  { path: '', component: TopicSelectionComponent },
  { path: 'modules/:topicId', component: ModuleSelectComponent },
  { path: 'quiz/:topicId/:moduleId', component: QuizComponent },
  { path: 'result', component: ResultComponent },
  { path: 'attempts', component: AttemptsListComponent },
  { path: '**', redirectTo: '' }
];