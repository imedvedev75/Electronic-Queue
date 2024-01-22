import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddQueuePage } from './add-queue.page';

describe('AddQueuePage', () => {
  let component: AddQueuePage;
  let fixture: ComponentFixture<AddQueuePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddQueuePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddQueuePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
