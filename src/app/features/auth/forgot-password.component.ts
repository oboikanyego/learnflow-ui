import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
        <span class="mini-label">Password recovery</span>
        <h2>Reset your password</h2>
        <p class="muted">Enter the email linked to your LearnFlow account. If the account exists, we’ll send a reset link.</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" formControlName="email" autocomplete="email"></mat-form-field>
          @if (error()) { <p class="error">{{ error() }}</p> }
          @if (message()) { <div class="success-box">{{ message() }}</div> }
          <button mat-flat-button class="primary-cta" type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Sending…' : 'Send reset link' }}</button>
        </form>
        @if (resetUrl()) {
          <div class="dev-reset"><strong>Development reset link</strong><a [href]="resetUrl()">Open password reset</a></div>
        }
        <p class="auth-switch"><a routerLink="/login">← Back to sign in</a></p>
      </mat-card>
    </section>
  `,
  styles: [`
    .auth-layout{min-height:calc(100vh - 74px);display:grid;place-items:center;padding:56px 20px;background:radial-gradient(circle at 15% 15%,#eef4ff,transparent 40%),#f8fafc}.auth-card{width:min(100%,520px);padding:34px!important;border-radius:22px!important;border:1px solid #dde4ee!important;box-shadow:0 24px 55px rgba(25,45,75,.11)!important}.auth-card h2{margin:8px 0 6px}form{display:grid;gap:12px;margin-top:22px}mat-form-field{width:100%}.error{color:#bb3f4b}.success-box{padding:12px 14px;border-radius:10px;background:#ecfdf5;color:#047857;font-weight:700}.dev-reset{margin-top:18px;padding:14px;border:1px dashed #9fbce8;border-radius:10px;background:#f7fbff;display:flex;flex-direction:column;gap:6px}.dev-reset a,.auth-switch a{color:#0c66e4;font-weight:800;text-decoration:none}.dev-reset a:hover,.auth-switch a:hover{text-decoration:underline}.auth-switch{margin:20px 0 0}
  `]
})
export class ForgotPasswordComponent {
  readonly loading = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly resetUrl = signal('');
  readonly form;

  constructor(fb: FormBuilder, private readonly auth: AuthService) {
    this.form = fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true); this.error.set(''); this.message.set(''); this.resetUrl.set('');
    this.auth.forgotPassword(this.form.controls.email.value).subscribe({
      next: response => { this.message.set(response.message); this.resetUrl.set(response.resetUrl ?? ''); this.loading.set(false); },
      error: err => { this.error.set(err?.error?.message ?? 'Unable to request a password reset'); this.loading.set(false); }
    });
  }
}
