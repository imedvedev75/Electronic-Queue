import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { HttpClient } from '@angular/common/http';
import { Events, NavController, ModalController } from '@ionic/angular';
import { MyAlertService } from './my-alert.service';
import { LoginPage } from './login/login.page';
import { Constants } from './constants.service';
import { Geolocation } from '@ionic-native/geolocation/ngx';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {

  public initialized: Promise<any>;

  private myUUID = "";

  constructor(private storage: Storage,
    private aHttpClient: HttpClient,
    public events: Events,
    private myAlert: MyAlertService,
    private navCtrl: NavController,
    private modalCtrl: ModalController,
    private geolocation: Geolocation) {
    //storage.clear();
    this.init();
    
  }

  public create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
  }  

  public async obtain_UUID() {
    this.myUUID = await this.storage.get("myUUID");
    if (!this.myUUID) {
      this.myUUID = this.create_UUID();
      this.storage.set("myUUID", this.myUUID);
    }
  }
  
  public async get_client_uuid_async() {
    if (!this.myUUID)
      await this.obtain_UUID();
    return this.myUUID;
  }
  
  public get_client_uuid() { return this.myUUID; }

  public init() {
    this.initialized = new Promise((resolve, reject) => {
      this.obtain_UUID().then(() => {
        resolve();
      })
    });    
  }

  async post(res, data) {
    data.client_uuid = await this.get_client_uuid_async();
    try {
      return Promise.resolve(await this.aHttpClient.post(Constants.url + res, data, {withCredentials: true,
        observe: 'response',  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'rejectUnauthorized': 'false' }}).toPromise());
    } catch(error) {
      if (401 == error.status) {  //need to login
        this.events.publish('need-to-login');
      }
      else {
        //this.myAlert.presentAlert(error.body);
        console.log(error);
      }
      return Promise.reject(error.error.message);
    }
  }

  async get(res) {
    try {
      return Promise.resolve(await this.aHttpClient.get(Constants.url + res, {withCredentials: true,
        observe: 'response',  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'rejectUnauthorized': 'false' }}).toPromise());
    } catch(error) {
      if (401 == error.status) {  //need to login
        //this.events.publish('need-to-login');
        //const { data } = await this.login();
        this.login();
      }
      else {
        //this.myAlert.presentAlert(error.body);
        console.log(error);
      }
      return Promise.reject(error);
    }  
  }

  async navigateWithLogin(params) {
    try {
      await this.aHttpClient.get(Constants.url + "/check_login", {withCredentials: true,
        observe: 'response',  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'rejectUnauthorized': 'false'  }}).toPromise();
        this.navCtrl.navigateForward(params);
    } catch(error) {
      if (401 == error.status) {  //need to login
        const { data } = await this.login();
        if (1 == data) {
          console.log('user has logged in');
          this.navCtrl.navigateForward(params);
        }
      }
    }
  } 

  async login() {
    const modal = await this.modalCtrl.create({
      component: LoginPage,
      //cssClass: "my-custom-modal-css"
      cssClass: 'auto-height'
    });
    await modal.present();
    return await modal.onDidDismiss();   
   }

  public getValue(key) {
    return this.storage.get(key);
  }

  public setValue(key, value) {
    this.storage.set(key, value);
  }  

  async getGeo() {
    try {
      var resp = await this.geolocation.getCurrentPosition();
      //this.geolocLink = "https://maps.google.com/?q=" + resp.coords.latitude + "," + resp.coords.longitude;
      return {lat:resp.coords.latitude, longit:resp.coords.longitude}
    }
    catch(error){
       throw "error getting geolocation";
     };
  }

  async getGeoLink() {
    var geo = await this.getGeo();
    return "https://maps.google.com/?q=" + geo.lat + "," + geo.longit;
  }

  getGeoLink2(lat, longit) {
    return "https://maps.google.com/?q=" + lat + "," + longit;
  }

  degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  distanceBetween(lat1, lon1, lat2, lon2) {
    var earthRadiusKm = 6371;

    var dLat = this.degreesToRadians(lat2-lat1);
    var dLon = this.degreesToRadians(lon2-lon1);

    lat1 = this.degreesToRadians(lat1);
    lat2 = this.degreesToRadians(lat2);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(earthRadiusKm * c) ;
  }
}
