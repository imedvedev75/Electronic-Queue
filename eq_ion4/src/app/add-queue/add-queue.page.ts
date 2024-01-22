import { Component, OnInit, ViewChild } from '@angular/core';
import { GlobalService } from '../global.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-add-queue',
  templateUrl: './add-queue.page.html',
  styleUrls: ['./add-queue.page.scss'],
})
export class AddQueuePage implements OnInit {

  @ViewChild('queueNameField') public queueNameField: any;
  queueNameText: string;
  footer: string;
  latitudeText: number;
  longitudeText: number;
  
  constructor(private global: GlobalService,
    private modalCtrl: ModalController) { }

  ngOnInit() {
    setTimeout(function() {
      this.queueNameField.setFocus();
    }.bind(this), 200);

    this.getGeo();
  }

  async getGeo() {
    try {
      var geo = await this.global.getGeo();
      this.latitudeText = geo.lat;
      this.longitudeText = geo.longit;
    }
    catch (error){
      
    }
  }

  async addQueue() { 
    try {
      await this.global.post('/add_queue', {name:this.queueNameText, latitude:this.latitudeText, longitude:this.longitudeText});
      this.modalCtrl.dismiss(1);
    }
    catch(error) {
      this.footer = error;
    }
   }

   close() {
     this.modalCtrl.dismiss(2);
   }
}
