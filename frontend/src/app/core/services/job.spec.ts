import { TestBed } from '@angular/core/testing';
import { Job } from './job';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Job', () => {
  let service: Job;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Job,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(Job);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
