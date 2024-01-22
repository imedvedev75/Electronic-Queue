import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminQueuePage } from './admin-queue.page';

describe('AdminQueuePage', () => {
  let component: AdminQueuePage;
  let fixture: ComponentFixture<AdminQueuePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminQueuePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminQueuePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
