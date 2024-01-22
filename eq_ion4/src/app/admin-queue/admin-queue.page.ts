import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GlobalService } from '../global.service';
import { Socket } from 'ng-socket-io';
import { Constants } from '../constants.service';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import * as Clipboardjs from 'clipboard/dist/clipboard.min.js';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';

@Component({
  selector: 'app-admin-queue',
  templateUrl: './admin-queue.page.html',
  styleUrls: ['./admin-queue.page.scss'],
})
export class AdminQueuePage implements OnInit {

  public queue: any = {};
  public queueName: string;
  public curr_num: number;
  public count_num: number;
  public queueURLText: string;
  public footer: string;
  public myAngularxQrCode: string;
  public geolocLink: string;

  private queue_uuid: string;
  private clipboardjs: any;

  constructor(private route: ActivatedRoute,
    private global: GlobalService,
    private socket: Socket,
    private clipboard: Clipboard,
    private socialSharing: SocialSharing) { 
      this.clipboardjs = new Clipboardjs('#cpyBtn');
    }

  ngOnInit() {
    this.queue_uuid = this.route.snapshot.paramMap.get('id');
    this.queueURLText = document.baseURI + 'queue/' + this.queue_uuid;

    this.load();

    this.socket.on('connect', this.onConnect.bind(this));

    setTimeout(function() {
      console.log('calling connect ');
      this.socket.connect();      
      this.socket.emit('client-connected', this.global.get_client_uuid());
    }.bind(this), 200);
  }

  async getGeo() {
    try {
      var geo = await this.global.getGeo();
      this.queue.lat = geo.lat;
      this.queue.longit = geo.longit;
      
    }
    catch(error){
       console.log('Error getting location', error);
     };
  }

  load() {
    this.global.post("/get_queue", {queue_uuid:this.queue_uuid}).then(
      function(resp) { 
        this.queue = resp.body;
        this.geolocLink = this.global.getGeoLink2(this.queue.lat, this.queue.longit);
      }.bind(this))      
  }

  onConnect() {
    console.log('onConnect received ');
  }

  ionViewDidEnter() {
    this.get_status();
  }

  process() {
    this.global.post("/process", {queue_uuid:this.queue_uuid}).then(
      function(resp) {
        this.get_status();
      }.bind(this))  
  }

  get_status() {
    this.global.post("/status_queue", {queue_uuid:this.queue_uuid}).then(
      function(resp) {
        this.curr_num = null != resp.body.curr_num ? resp.body.curr_num : '-';
        this.count_num = resp.body.count_num;
      }.bind(this)) 
  }

  reset() {
    try {
      this.global.post('/reset_queue', {queue_uuid:this.queue_uuid});
      this.load();
      this.get_status();
    }
    catch(error) {this.footer = error}
  }

  copy() {
    this.clipboard.copy(this.queueURLText);
  }
  
  share() {
    //this.socialSharing.share(this.queueURLText);

    let newVariable: any;
    newVariable = window.navigator;
    console.log("newVariable "+newVariable);
    console.log("newVariable.share "+newVariable.share);
    if (newVariable && newVariable.share) {
      newVariable.share({
        'title': 'Share',
        'text': 'Queue URL',
        'url': this.queueURLText
      })
    }
  }

  async save() {
    try {
      await this.global.post("/update_queue", this.queue);
    }
    catch(error) {
      this.footer = error;
    }
  }

  refresh() {
    this.load();
    this.get_status();
  }
}
