import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ZBar } from '@ionic-native/zbar/ngx';
import { QRCodeModule } from 'angularx-qrcode';

import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { Firebase } from '@ionic-native/firebase/ngx';

import { Clipboard } from '@ionic-native/clipboard/ngx';
import { Push } from '@ionic-native/push/ngx';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { IonicStorageModule, Storage } from '@ionic/storage';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { SocketIoModule, SocketIoConfig } from 'ng-socket-io';
import { LoginPage } from './login/login.page';
import { RegisterPage } from './register/register.page';
import { FormsModule } from '@angular/forms';
import { AddQueuePage } from './add-queue/add-queue.page';
import { AddQueuePageModule } from './add-queue/add-queue.module';
import { LoginPageModule } from './login/login.module';
import { RegisterPageModule } from './register/register.module';
import { Constants } from './constants.service';
import { SERVER_URL } from 'src/environments/environment';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';

const sio_config: SocketIoConfig = { url: SERVER_URL, options: {} };

var config = {
  apiKey: "AIzaSyB0sPwPvZgi0J7cSBVowjr89M4o6ERVheY",
  authDomain: "ameq-55d17.firebaseapp.com",
  databaseURL: "https://ameq-55d17.firebaseio.com",
  projectId: "ameq-55d17",
  storageBucket: "ameq-55d17.appspot.com",
  messagingSenderId: "789648997051",
  vapidKey: "BEtl_4f5PwBaB8Kvm1VsyNhWbHxzX8e3yJWwIAg4URCX_-0Wgxf-_LrptzR4W6O8eT4t_uCdx9yJiPEbowTgG14"
};

/*
export class LoaderService {

  constructor() {

   }

   public load(): Promise<any> {
      return new Promise((resolve, reject) => {
            console.log(`initializeApp:: inside promise`);
   
            setTimeout(() => {
              console.log(`initializeApp:: inside setTimeout`);
              // doing something
   
              resolve();
            }, 3000);
          });
    }
}
function myInit(gl: LoaderService) {
  return () => gl.load();
};
*/

@NgModule({
  declarations: [AppComponent],
  entryComponents: [LoginPage, RegisterPage, AddQueuePage],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    QRCodeModule,
    AngularFireModule.initializeApp(config),
    AngularFirestoreModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    IonicStorageModule.forRoot(),
    HttpClientModule,
    SocketIoModule.forRoot(sio_config),
    FormsModule,
    AddQueuePageModule,
    LoginPageModule,
    RegisterPageModule,
  ],
  providers: [
    /*
    LoaderService,
    {
      provide: APP_INITIALIZER,
      useFactory: myInit,
      deps: [LoaderService],
      multi: true
    },*/
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    ZBar,
    Firebase,
    Clipboard,
    Push,
    SocialSharing,
    Geolocation
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
