import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { AdminsPage } from './admins.page';
import { AddQueuePageModule } from '../add-queue/add-queue.module';

const routes: Routes = [
  {
    path: '',
    component: AdminsPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [AdminsPage],
  entryComponents: []
})
export class AdminsPageModule {}
