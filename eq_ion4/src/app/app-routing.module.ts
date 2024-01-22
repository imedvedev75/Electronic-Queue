import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: './home/home.module#HomePageModule'
  },
  {
    path: 'queues',
    loadChildren: './queues/queues.module#QueuesPageModule'
  },
  { path: 'queue/:id', loadChildren: './queue/queue.module#QueuePageModule' },
  { path: 'admins', loadChildren: './admins/admins.module#AdminsPageModule' },
  { path: 'admin-queue/:id', loadChildren: './admin-queue/admin-queue.module#AdminQueuePageModule' },
  { path: 'login', loadChildren: './login/login.module#LoginPageModule' },
  { path: 'register', loadChildren: './register/register.module#RegisterPageModule' },
  { path: 'add-queue', loadChildren: './add-queue/add-queue.module#AddQueuePageModule' },
  { path: 'search', loadChildren: './search/search.module#SearchPageModule' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
