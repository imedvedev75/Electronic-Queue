import { Component, OnInit } from '@angular/core';
import { NavController, ModalController, AlertController } from '@ionic/angular';
import { GlobalService } from '../global.service';
import { AddQueuePage } from '../add-queue/add-queue.page';

@Component({
  selector: 'app-admins',
  templateUrl: './admins.page.html',
  styleUrls: ['./admins.page.scss'],
})
export class AdminsPage implements OnInit {

  public items: [];

  constructor(public navCtrl: NavController,
    private global: GlobalService,
    private modalCtrl: ModalController,
    private alertController: AlertController) { 
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.global.post("/get_my_queues", {}).then(
      function(resp) {
        this.items = resp.body;
        this.items.forEach(function(item) {
          item.icon = "walk";
        })
      }.bind(this))
      .catch( (error) => {});
  }

  click(item: any) {
    this.navCtrl.navigateForward(['/admin-queue', item.queue_uuid]);
  }

  async addQueue() {
    const modal = await this.modalCtrl.create({
      component: AddQueuePage,
      cssClass: 'auto-height'
    });
    await modal.present();  
    var ret = await modal.onDidDismiss();  
    if (1 == ret.data)
      this.load();
  }

  async delete(item) {
    const alert = await this.alertController.create({
      header: 'Delete queue',
      message: 'Do you really want to delete queue?',
      buttons: [
        {
          text: 'Yes',
          role: 'yes',
        }, {
          text: 'Cancel',
          role: 'cancel',
        }
      ]
    });

    await alert.present();    
    var ret = await alert.onDidDismiss();
    if ("yes" == ret.role) {
      try {
        await this.global.post('/delete_queue', {queue_uuid:item.queue_uuid});
        this.load();
      }
      catch(error) {}
    }
  }
}
