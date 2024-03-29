import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { AdminQueuePage } from './admin-queue.page';
import { QRCodeModule } from 'angularx-qrcode';

const routes: Routes = [
  {
    path: '',
    component: AdminQueuePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    QRCodeModule
  ],
  declarations: [AdminQueuePage]
})
export class AdminQueuePageModule {}
