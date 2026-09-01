import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="auth-layout page-enter">
      <div class="auth-context">
        <span class="eyebrow">Create your workspace</span>
        <h1>Give your learning goals the same structure as important work.</h1>
        <p>Build learning paths, schedule sessions, track completion and review your progress in one focused operating system.</p>
        <div class="auth-points"><span>Plan with phases, modules and lessons</span><span>Import Excel learning plans</span><span>Track progress and missed commitments</span></div>
      </div>
      <mat-card class="auth-card">
        <span class="mini-label">Get started</span>
        <h2>Create your LearnFlow account</h2>
        <p class="muted">Set up your personal learning workspace in a few seconds.</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name" autocomplete="name"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" formControlName="email" autocomplete="email"></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="new-password">
            <button mat-button matSuffix type="button" class="password-toggle" (click)="togglePassword()">{{ showPassword() ? 'Hide' : 'Show' }}</button>
          </mat-form-field>
          @if (error()) { <p class="error">{{ error() }}</p> }
          <button mat-flat-button class="primary-cta" type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Creating account…' : 'Create account' }}</button>
        </form>
        <p class="timezone-note">Sessions will use <strong>{{ timezone }}</strong>.</p>
        <p class="auth-switch">Already registered? <a routerLink="/login">Sign in</a></p>
      </mat-card>
    </section>
  `,
  styles: [`
    .auth-layout{min-height:calc(100vh - 74px);display:grid;grid-template-columns:1fr minmax(380px,500px);align-items:center;gap:70px;padding:70px max(7vw,28px);background:radial-gradient(circle at 10% 15%,#eef4ff,transparent 38%),#f8fafc}
    .auth-context{max-width:680px}.auth-context h1{color:#10233f;margin:14px 0 20px}.auth-context>p{font-size:1.08rem;color:#66758a;max-width:620px}.auth-points{display:grid;gap:10px;margin-top:28px;color:#40516a;font-weight:700}.auth-points span:before{content:'✓';color:#16805c;margin-right:9px}.auth-card{padding:34px!important;border-radius:22px!important;border:1px solid #dde4ee!important;box-shadow:0 24px 55px rgba(25,45,75,.11)!important}.auth-card h2{margin:8px 0 6px}form{display:grid;gap:10px;margin-top:22px}mat-form-field{width:100%}.password-toggle{font-size:.76rem;font-weight:800;color:#0c66e4;min-width:56px}.error{color:#bb3f4b}.timezone-note,.auth-switch{color:#66758a;margin:15px 0 0}.auth-switch a{color:#0c66e4;font-weight:800;text-decoration:none}.auth-switch a:hover{text-decoration:underline}
    @media(max-width:850px){.auth-layout{grid-template-columns:1fr;padding:42px 20px}.auth-context{display:none}.auth-card{width:min(100%,520px);margin:auto}}
  `]
})
export class RegisterComponent {
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  readonly form;

  constructor(fb: FormBuilder, private readonly auth: AuthService, private readonly router: Router) {
    this.form = fb.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  togglePassword(): void { this.showPassword.set(!this.showPassword()); }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true); this.error.set('');
    this.auth.register({ ...this.form.getRawValue(), timezone: this.timezone }).subscribe({
      next: () => void this.router.navigateByUrl('/onboarding'),
      error: err => { this.error.set(err?.error?.message ?? 'Unable to create account'); this.loading.set(false); }
    });
  }
}
