import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-list',
  templateUrl: 'queues.page.html',
  styleUrls: ['queues.page.scss']
})
export class QueuesPage implements OnInit {
  private selectedItem: any;

  public items: Array<{ title: string; note: string; icon: string, uuid: string }> = [];

  constructor(public navCtrl: NavController) {
      this.items.push({
        title: 'Алексей и Анатолий играют в магазин',
        note: '',
        icon: "walk",
        uuid: "bec8c1b5db424d91a82de8e3b5c7c83a"
      });
  }

  ngOnInit() {
  }
  // add back when alpha.4 is out
  // navigate(item) {
  //   this.router.navigate(['/list', JSON.stringify(item)]);
  // }

  click(item: any) {
    this.navCtrl.navigateForward(['/queue', item.uuid]);
  }
}
