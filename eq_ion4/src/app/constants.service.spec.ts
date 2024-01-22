import { TestBed } from '@angular/core/testing';

import { Constants } from './constants.service';

describe('Constants', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: Constants = TestBed.get(Constants);
    expect(service).toBeTruthy();
  });
});
