import { TestBed } from '@angular/core/testing';
import { Analysis } from './analysis';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Analysis', () => {
  let service: Analysis;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Analysis,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(Analysis);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
