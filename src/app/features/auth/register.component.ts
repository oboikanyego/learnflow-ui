import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';

@Component({ selector: 'app-register', standalone: true, imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule], template: `
<section class="auth-page"><mat-card><h1>Create your LearnFlow account</h1><p>Start turning learning plans into scheduled progress.</p><form [formGroup]="form" (ngSubmit)="submit()"><mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name"></mat-form-field><mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" formControlName="email"></mat-form-field><mat-form-field appearance="outline"><mat-label>Password</mat-label><input matInput type="password" formControlName="password"></mat-form-field>@if (error()) { <p class="error">{{ error() }}</p> }<button mat-flat-button type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Creating account…' : 'Create account' }}</button></form><p>Already registered? <a routerLink="/login">Sign in</a></p></mat-card></section>`, styles: [`.auth-page{min-height:70vh;display:grid;place-items:center;padding:24px}mat-card{width:min(100%,440px);padding:28px}form{display:grid;gap:12px}mat-form-field{width:100%}.error{color:#b3261e}`] })
export class RegisterComponent {
  readonly loading = signal(false); readonly error = signal(''); readonly form;
  constructor(fb: FormBuilder, private readonly auth: AuthService, private readonly router: Router) { this.form = fb.nonNullable.group({ name: ['', [Validators.required, Validators.minLength(2)]], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(8)]] }); }
  submit() { if (this.form.invalid) return; this.loading.set(true); this.error.set(''); this.auth.register(this.form.getRawValue()).subscribe({ next: () => this.router.navigateByUrl('/dashboard'), error: err => { this.error.set(err?.error?.message ?? 'Unable to create account'); this.loading.set(false); } }); }
}
