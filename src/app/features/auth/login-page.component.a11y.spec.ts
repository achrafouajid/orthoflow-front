import '@angular/compiler';
import { describe, it, beforeEach, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LoginPageComponent } from './login-page.component';
import { expectNoA11yViolations } from '../../testing/axe';

describe('LoginPageComponent accessibility', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ defaultLanguage: 'fr' }),
      ],
    }).compileComponents();
  });

  it('has no WCAG 2.1 A/AA violations on first render', async () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    await expectNoA11yViolations(fixture.nativeElement);
  });
});
