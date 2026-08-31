import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="auth-layout page-enter">
      <mat-card class="auth-card">
        <span class="mini-label">Create a new password</span>
        <h2>Update your LearnFlow password</h2>
        <p class="muted">Choose a new password with at least 8 characters.</p>

        @if (!token) {
          <div class="error-box">This reset link is missing its security token. Request a new password reset link.</div>
          <a mat-flat-button class="primary-cta" routerLink="/forgot-password">Request new link</a>
        } @else if (success()) {
          <div class="success-box">{{ success() }}</div>
          <a mat-flat-button class="primary-cta" routerLink="/login">Continue to sign in</a>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>New password</mat-label>
              <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="new-password">
              <button mat-button matSuffix type="button" class="password-toggle" (click)="showPassword.update(value => !value)">{{ showPassword() ? 'Hide' : 'Show' }}</button>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Confirm password</mat-label>
              <input matInput [type]="showConfirmPassword() ? 'text' : 'password'" formControlName="confirmPassword" autocomplete="new-password">
              <button mat-button matSuffix type="button" class="password-toggle" (click)="showConfirmPassword.update(value => !value)">{{ showConfirmPassword() ? 'Hide' : 'Show' }}</button>
            </mat-form-field>
            @if (passwordMismatch()) { <p class="error">Passwords do not match.</p> }
            @if (error()) { <div class="error-box">{{ error() }}</div> }
            <button mat-flat-button class="primary-cta" type="submit" [disabled]="form.invalid || passwordMismatch() || loading()">{{ loading() ? 'Updating…' : 'Update password' }}</button>
          </form>
        }
        <p class="auth-switch"><a routerLink="/login">← Back to sign in</a></p>
      </mat-card>
    </section>
  `,
  styles: [`
    .auth-layout{min-height:calc(100vh - 74px);display:grid;place-items:center;padding:56px 20px;background:radial-gradient(circle at 15% 15%,#eef4ff,transparent 40%),#f8fafc}.auth-card{width:min(100%,540px);padding:34px!important;border-radius:22px!important;border:1px solid #dde4ee!important;box-shadow:0 24px 55px rgba(25,45,75,.11)!important}.auth-card h2{margin:8px 0 6px}form{display:grid;gap:12px;margin-top:22px}mat-form-field{width:100%}.password-toggle{font-size:.76rem;font-weight:800;color:#0c66e4;min-width:56px}.error{color:#bb3f4b;margin:0}.error-box,.success-box{padding:12px 14px;border-radius:10px;margin:18px 0;font-weight:700}.error-box{background:#fef2f2;color:#b91c1c}.success-box{background:#ecfdf5;color:#047857}.auth-switch{margin:20px 0 0}.auth-switch a{color:#0c66e4;font-weight:800;text-decoration:none}.auth-switch a:hover{text-decoration:underline}
  `]
})
export class ResetPasswordComponent {
  readonly token: string;
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly form;

  constructor(fb: FormBuilder, route: ActivatedRoute, private readonly auth: AuthService, private readonly router: Router) {
    this.token = route.snapshot.queryParamMap.get('token') ?? '';
    this.form = fb.nonNullable.group({
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]]
    });
  }

  passwordMismatch(): boolean {
    const { password, confirmPassword } = this.form.getRawValue();
    return !!confirmPassword && password !== confirmPassword;
  }

  submit(): void {
    if (!this.token || this.form.invalid || this.passwordMismatch()) return;
    this.loading.set(true); this.error.set('');
    this.auth.resetPassword(this.token, this.form.controls.password.value).subscribe({
      next: response => { this.success.set(response.message); this.loading.set(false); setTimeout(() => void this.router.navigateByUrl('/login'), 1800); },
      error: err => { this.error.set(err?.error?.message ?? 'Unable to reset password'); this.loading.set(false); }
    });
  }
}
