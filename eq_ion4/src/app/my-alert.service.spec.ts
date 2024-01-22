import { TestBed } from '@angular/core/testing';

import { MyAlertService } from './my-alert.service';

describe('MyAlertService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MyAlertService = TestBed.get(MyAlertService);
    expect(service).toBeTruthy();
  });
});
