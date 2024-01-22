import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { Constants } from '../constants.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  @ViewChild('emailField') emailField: any;
  @ViewChild('passwordField') passwordField: any;
  @ViewChild('confirmPasswordField') confirmPasswordField: any;
  public emailText: string;
  public passwordText: string;
  public confirmPasswordText: string;
  public footer: string;

  constructor(private modalCtrl: ModalController,
    private storage: Storage,
    private aHttpClient: HttpClient) {
  }

  ngOnInit() {}

  ionViewDidEnter(): void {
    setTimeout(async function()  {
      this.emailText = await this.storage.get(Constants.KEY_EMAIL);
      this.passwordText = await this.storage.get(Constants.KEY_PASSWORD);
      if (!this.emailText) {
        this.emailField.setFocus();
      }
      else if (!this.passwordText)
        this.passwordField.setFocus();
      else
        this.confirmPasswordField.setFocus();
    }.bind(this), 200);
  }

  async register() {
    if (this.passwordText != this.confirmPasswordText) {
      this.footer = "Passwords do not match!";
      return;
    }

    let input = {
      email: this.emailText,
      password: this.passwordText
    };

    this.storage.set(Constants.KEY_EMAIL, this.emailText);

    try {
      var resp = await this.aHttpClient.post(Constants.url + "/new_user", input, 
        {withCredentials: true, observe: 'response',  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}).toPromise();
      this.modalCtrl.dismiss(1);
    }
    catch(error) {
      if (error.status == 400) { //user exists
        this.footer = "User already exists";
      }
      else {
        this.footer = "Error registering new user";
      }
    };
  }

  close() {
    this.modalCtrl.dismiss(2);
  }  
}
