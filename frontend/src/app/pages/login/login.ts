import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);

  readonly authMode = signal<'login' | 'register'>('login');
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly registerForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
  readonly emailErrorText = computed(() => {
    const control = this.loginForm.controls.email;
    if (control.hasError('required')) {
      return 'Email is required.';
    }
    if (control.hasError('email')) {
      return 'Use a valid email address.';
    }
    return '';
  });

  readonly passwordErrorText = computed(() => {
    const control = this.activeForm().controls.password;
    if (control.hasError('required')) {
      return 'Password is required.';
    }
    if (control.hasError('minlength')) {
      return 'Password must be at least 6 characters.';
    }
    return '';
  });

  readonly nameErrorText = computed(() => {
    const control = this.registerForm.controls.name;
    if (control.hasError('required')) {
      return 'Full name is required.';
    }
    if (control.hasError('minlength')) {
      return 'Name must be at least 2 characters.';
    }
    return '';
  });

  setMode(mode: 'login' | 'register'): void {
    if (this.authMode() === mode) {
      return;
    }

    this.authMode.set(mode);
    this.errorMessage.set(null);
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.authMode() === 'register') {
      this.submitRegistration();
      return;
    }

    this.submitLogin();
  }

  private submitLogin(): void {

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const credentials = this.loginForm.getRawValue();

    this.authService
      .login(credentials)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (responseError: { error?: { message?: string } }) => {
          this.errorMessage.set(responseError.error?.message ?? 'Unable to sign in. Check your details and try again.');
        },
      });
  }

  private submitRegistration(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const registrationData = this.registerForm.getRawValue();

    this.authService
      .register(registrationData)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (responseError: { error?: { message?: string } }) => {
          this.errorMessage.set(responseError.error?.message ?? 'Unable to create account. Try again in a moment.');
        },
      });
  }

  private activeForm() {
    return this.authMode() === 'login' ? this.loginForm : this.registerForm;
  }

  showEmailError(): boolean {
    const emailControl = this.activeForm().controls.email;
    return emailControl.touched && emailControl.invalid;
  }

  showPasswordError(): boolean {
    const passwordControl = this.activeForm().controls.password;
    return passwordControl.touched && passwordControl.invalid;
  }

  showNameError(): boolean {
    const nameControl = this.registerForm.controls.name;
    return nameControl.touched && nameControl.invalid;
  }
}
