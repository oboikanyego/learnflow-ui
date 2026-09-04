import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="auth-layout page-enter">
      <div class="auth-context">
        <span class="eyebrow">Welcome back</span>
        <h1>Pick up where your learning left off.</h1>
        <p>Return to today's focus session, reviews and progress without rebuilding the context every time you sign in.</p>
        <div class="auth-points"><span>Know what matters today</span><span>Track real focused study time</span><span>Turn mastery into useful evidence</span></div>
      </div>
      <mat-card class="auth-card">
        <span class="mini-label">Secure access</span>
        <h2>Sign in to LearnFlow</h2>
        <p class="muted">Enter your details to continue to your workspace.</p>
        @if (sessionExpired()) { <p class="session-note">Your session expired. Sign in again to continue securely.</p> }
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" formControlName="email" autocomplete="email"></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="current-password">
            <button mat-button matSuffix type="button" class="password-toggle" (click)="togglePassword()">{{ showPassword() ? 'Hide' : 'Show' }}</button>
          </mat-form-field>
          <div class="forgot-row"><a routerLink="/forgot-password">Forgot password?</a></div>
          @if (error()) { <p class="error">{{ error() }}</p> }
          <button mat-flat-button class="primary-cta" type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Signing in…' : 'Sign in' }}</button>
        </form>
        <p class="auth-switch">New to LearnFlow? <a routerLink="/register">Create an account</a></p>
      </mat-card>
    </section>
  `,
  styles: [`
    .auth-layout{min-height:calc(100vh - 74px);display:grid;grid-template-columns:1fr minmax(380px,480px);align-items:center;gap:70px;padding:70px max(7vw,28px);background:radial-gradient(circle at 10% 15%,#eef4ff,transparent 38%),#f8fafc}
    .auth-context{max-width:680px}.auth-context h1{color:#10233f;margin:14px 0 20px}.auth-context>p{font-size:1.08rem;color:#66758a;max-width:620px}.auth-points{display:grid;gap:10px;margin-top:28px;color:#40516a;font-weight:700}.auth-points span:before{content:'✓';color:#16805c;margin-right:9px}.auth-card{padding:34px!important;border-radius:22px!important;border:1px solid #dde4ee!important;box-shadow:0 24px 55px rgba(25,45,75,.11)!important}.auth-card h2{margin:8px 0 6px}form{display:grid;gap:10px;margin-top:22px}mat-form-field{width:100%}.password-toggle{font-size:.76rem;font-weight:800;color:#0c66e4;min-width:56px}.forgot-row{display:flex;justify-content:flex-end;margin-top:-8px}.forgot-row a,.auth-switch a{color:#0c66e4;font-weight:800;text-decoration:none}.forgot-row a:hover,.auth-switch a:hover{text-decoration:underline}.error{color:#bb3f4b}.session-note{margin:14px 0 0;padding:10px 12px;border-radius:10px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-size:.78rem}.auth-switch{margin:22px 0 0;color:#66758a}
    @media(max-width:850px){.auth-layout{grid-template-columns:1fr;padding:42px 20px}.auth-context{display:none}.auth-card{width:min(100%,500px);margin:auto}}
  `]
})
export class LoginComponent {
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly sessionExpired = signal(false);
  readonly form;

  constructor(
    fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.form = fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(8)]] });
    this.sessionExpired.set(this.route.snapshot.queryParamMap.get('reason') === 'session-expired');
  }

  togglePassword(): void { this.showPassword.set(!this.showPassword()); }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true); this.error.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(this.safeReturnUrl()),
      error: err => { this.error.set(err?.error?.message ?? 'Unable to sign in'); this.loading.set(false); }
    });
  }

  private safeReturnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');
    return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/login') ? value : '/today';
  }
}
