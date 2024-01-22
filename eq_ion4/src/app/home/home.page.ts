import { Component } from '@angular/core';
import { AlertController, ModalController, NavController } from '@ionic/angular';
import { ZBar, ZBarOptions } from '@ionic-native/zbar/ngx';
import { LoginPage } from '../login/login.page';
import { GlobalService } from '../global.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(/*private qrScanner: QRScanner,*/
    protected alertController: AlertController,
    private zbar: ZBar,
    private modalCtrl: ModalController,
    private global: GlobalService,
    public navCtrl: NavController) { }

  async presentAlert(txt: string, header: string="Error") {
    const alert = await this.alertController.create({
      header: header,
      message: txt,
      buttons: ['OK']
    });

    await alert.present();
  }

  join() {
    let options: ZBarOptions = {
      flash: 'off',
      drawSight: false
    }

    this.zbar.scan(options)
      .then(result => {
        this.presentAlert(result); // Scanned code
      })
      .catch(error => {
        this.presentAlert(error); // Error message
      });
  }

  async start() {
    this.global.navigateWithLogin(['/admins']);
    //this.navCtrl.navigateForward(['/admins']);
  }
  
  logout() {
    this.global.get("/logout");
  }
}
