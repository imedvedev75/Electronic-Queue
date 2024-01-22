import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GlobalService } from '../global.service';
import { Socket } from 'ng-socket-io';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.page.html',
  styleUrls: ['./queue.page.scss'],
})
export class QueuePage implements OnInit {

  public myAngularxQrCode: string;

  public queue: any = {};
  public queue_uuid: string;
  public num: string;
  public curr_num: string;
  public status_str: string;
  public in_queue: boolean;
  public distance: number;
  public geolocLink: string;

  private audio: any;
  private audioPlayed: boolean;
  private pullStatus: boolean;

  constructor(private route: ActivatedRoute,
    private global: GlobalService,
    private socket: Socket) { }

  ngOnInit() {
    //this.myAngularxQrCode = this.note;

    this.queue_uuid = this.route.snapshot.paramMap.get('id');
    this.get_queue();

    this.audio = new Audio(); 
    this.audio.src = '../../assets/audio/ring.mp3'; 
    this.audio.load(); 
    this.audioPlayed = false;

    this.socket.on('connect', this.onConnect.bind(this));
    this.socket.on('disconnect', this.onConnect.bind(this));
    this.socket.on('status', this.onStatus.bind(this));
    this.socket.connect();

    this.global.initialized.then(() => {
      this.socket.emit('client-connected', this.global.get_client_uuid());
    });
  }

  async computeDistance() {
    try {
      var geo = await this.global.getGeo();
      this.distance = this.global.distanceBetween(geo.lat, geo.longit, this.queue.lat, this.queue.longit);
    }
    catch(error) {};
  }

  async get_queue() {
    await this.global.initialized;
    this.global.post("/get_queue", {queue_uuid:this.queue_uuid, client_uuid:this.global.get_client_uuid()}).then(
      function(resp) {
        this.queue = resp.body;
        this.geolocLink = this.global.getGeoLink2(this.queue.lat, this.queue.longit);
        this.computeDistance();
      }.bind(this))     
  }

  ngOnDestroy() {
    this.socket.disconnect();
  }

  async ionViewDidEnter() {
    this.get_status();
  }

  ionViewDidLeave() {
    //this.pullStatus = false;
  }

  onConnect() {
    console.log('onConnect');
  }

  onDisconnect() {
    this.socket.emit('client-disconnected', this.global.get_client_uuid());
  }

  onStatus() {
    console.log('status update came');
    this.get_status();
  }

  join() {
    this.global.post("/join", {queue_uuid:this.queue_uuid, client_uuid:this.queue_uuid}).then(
      function(resp) {
        this.num = resp.body.num;
        this.socket.emit('client-connected', this.global.get_client_uuid());
        this.get_status();
      }.bind(this))  
  }

  leave() {
    this.global.post("/leave", {queue_uuid:this.queue_uuid, client_uuid:this.global.get_client_uuid()}).then(
      function(resp) {
        this.socket.emit('client-disconnected', this.global.get_client_uuid());
        this.get_status();
      }.bind(this))  
  }  

  get_status() {
    this.global.post("/status", {queue_uuid:this.queue_uuid, client_uuid:this.global.get_client_uuid()}).then(
      function(resp) {
        var status = resp.body;
        if (status.num != null) {
          if (status.curr_num == status.num) {
            this.status_str = "Настала Ваша очередь! Идите на кассу!";
            this.in_queue = true;
            if (!this.audioPlayed) {
              this.audioPlayed = true;
              this.audio.play();
            }            
          }
          else {
            this.status_str = "Вы в очереди! Ждите...";
            this.in_queue = true;
          }
        }
        else {
          this.status_str = "Вы не в очереди! Если хотите можете туда встать";
          this.in_queue = false;
        }
        this.num = status.num;
        this.curr_num = status.curr_num;
      }.bind(this)) 
      if (this.pullStatus)
        setTimeout(this.get_status.bind(this), 2000);
  }

  refresh() {
    this.get_status();
  }
}
