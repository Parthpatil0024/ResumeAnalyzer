import { TestBed } from '@angular/core/testing';
import { Resume } from './resume';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Resume', () => {
  let service: Resume;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Resume,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(Resume);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
