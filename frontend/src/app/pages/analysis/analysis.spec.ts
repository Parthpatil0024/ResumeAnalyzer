import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Analysis } from './analysis';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Analysis', () => {
  let component: Analysis;
  let fixture: ComponentFixture<Analysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Analysis],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Analysis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
