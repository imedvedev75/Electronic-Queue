import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../global.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit {
  items: any;
  geo: any;
  distanceText: number;

  constructor(private global: GlobalService,
    public navCtrl: NavController) { }

  ngOnInit() {
    this.init();
    this.distanceText = 5;
  }

  async init() {
    this.geo = await this.global.getGeo();
  }

  async search() {
    try {
      var { body } = await this.global.post('/search', {geo:this.geo, dist:this.distanceText});
      this.items = body;
    }
    catch(error) {}
  }

  click(item) {
    this.navCtrl.navigateForward(['/queue', item.queue_uuid]);
  }

}
