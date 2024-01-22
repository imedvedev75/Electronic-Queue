import { Component } from '@angular/core';

import { Platform, ToastController, Events, NavController, ModalController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { PushService } from './push-service.service';
import { MyAlertService } from './my-alert.service';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { Push, PushObject, PushOptions } from '@ionic-native/push/ngx';
import { GlobalService } from './global.service';
import { EventEmitter } from 'protractor';
import { LoginPage } from './login/login.page';
import { Constants } from './constants.service';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  public appPages = [
    {
      title: 'Home',
      url: '/home',
      icon: 'home'
    },
    {
      title: 'My queues',
      url: '/admins',
      icon: 'list'
    },
    {
      title: 'Search queues',
      url: '/search',
      icon: 'search'
    }     
  ];



  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    public fcm: PushService,
    public toastController: ToastController,
    public myAlert: MyAlertService,
    protected clipboard: Clipboard,
    protected push: Push,
    private global: GlobalService,
    public events: Events,
    private navCtrl: NavController,
    private modalCtrl: ModalController,
    private constants: Constants
  ) {
    console.log('init app');
    this.initializeApp();
  }

  initializeApp() {

     this.platform.ready().then(function() {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      //this.notificationSetup();
      this.events.subscribe('need-to-login',() => {
        this.login();
      });
     }.bind(this));
   }

   async login() {
    const modal = await this.modalCtrl.create({
      component: LoginPage,
      cssClass: "my-custom-modal-css"
    });
    return await modal.present();   
   }

  private async notificationSetup() {
    let token = await this.fcm.getToken();
    //this.presentToast(token);
    //this.clipboard.copy(token);
    this.fcm.onNotifications().subscribe(
      (msg) => {
        if (this.platform.is('ios')) {
          this.myAlert.presentAlert(msg.aps.alert);
        } else {
          this.myAlert.presentAlert(msg.body);
        }
      });
  }

    
}

