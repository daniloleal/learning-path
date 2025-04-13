import { Routes } from '@angular/router';
import { ModuleSelectComponent } from './components/module-select/module-select.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { ResultComponent } from './components/result/result.component';
import { SubmissionsListComponent } from './components/submissions-list/submissions-list.component';
import { TopicSelectionComponent } from './components/topic-selection/topic-selection.component';


export const routes: Routes = [
  { path: '', component: TopicSelectionComponent },
  { path: 'modules/:topicId', component: ModuleSelectComponent },
  { path: 'quiz/:topicId/:moduleId', component: QuizComponent },
  { path: 'result', component: ResultComponent },
  { path: 'submissions', component: SubmissionsListComponent },
  { path: '**', redirectTo: '' }
];