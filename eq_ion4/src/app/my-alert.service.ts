import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class MyAlertService {

  constructor(public alertController: AlertController) { }

  public async presentAlert(txt) {
    const alert = await this.alertController.create({
      header: 'Alert',
      subHeader: 'Subtitle',
      message: txt,
      buttons: ['OK']
    });

    await alert.present();
  }
}
