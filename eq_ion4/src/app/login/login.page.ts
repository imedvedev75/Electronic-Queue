import { Component, OnInit, ViewChild } from '@angular/core';
import { RegisterPage } from '../register/register.page';
import { Events, ModalController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { Constants } from '../constants.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  @ViewChild('emailField') public emailField: any;
  @ViewChild('passwordField') public passwordField: any;
  emailText: string;
  passwordText: string;
  callb: any;
  footer: string;

  constructor(private route: ActivatedRoute,
    private events:Events,
    private modalCtrl: ModalController,
    private storage: Storage,
    private aHttpClient: HttpClient
    ) {
  }

  ngOnInit() {}

  ionViewDidEnter(): void {
    setTimeout(async function() {
      var value = await this.storage.get(Constants.KEY_EMAIL);
      if (value) {
          this.passwordField.setFocus();     
          this.emailText = value;
      }
      else {
        this.emailField.setFocus();
      }
    }.bind(this), 200);
  }

  async login() {
    this.storage.set(Constants.KEY_EMAIL, this.emailText);

    try {
      var resp = await this.aHttpClient.post(Constants.url + "/login", {email: this.emailText, password: this.passwordText}, 
        {withCredentials: true, observe: 'response',  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}).toPromise();
      this.modalCtrl.dismiss(1);
    }
    catch(error) {
      if (error.status == 400) { //wrong password
        this.footer = "Wrong password";
      }
      else if (error.status == 404) { //wrong email
        this.footer = "email does not exist";
      }
    }
  }

  async register() {
    await this.storage.set(Constants.KEY_EMAIL, this.emailText);
    await this.storage.set(Constants.KEY_PASSWORD, this.passwordText);
    const modal = await this.modalCtrl.create({
      component: RegisterPage,
      cssClass: "auto-height"
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (1 == data)
      this.modalCtrl.dismiss(1);
  }

  close() {
    this.modalCtrl.dismiss(2);
  }

}
