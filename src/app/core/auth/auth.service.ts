import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser { id: string; name: string; email: string; role: string; timezone: string; }
export interface AuthResponse { token: string; user: AuthUser; }
export interface ForgotPasswordResponse { message: string; resetUrl?: string; }
export interface ResetPasswordResponse { message: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'learnflow_access_token';
  private readonly userState = signal<AuthUser | null>(null);
  private readonly tokenState = signal<string | null>(sessionStorage.getItem(this.tokenKey));

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenState());

  constructor(private readonly http: HttpClient) {}

  register(input: { name: string; email: string; password: string; timezone: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/v1/auth/register`, input).pipe(tap(response => this.persist(response)));
  }

  login(input: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/v1/auth/login`, input).pipe(tap(response => this.persist(response)));
  }

  forgotPassword(email: string) {
    return this.http.post<ForgotPasswordResponse>(`${environment.apiUrl}/api/v1/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post<ResetPasswordResponse>(`${environment.apiUrl}/api/v1/auth/reset-password`, { token, password });
  }

  loadProfile() {
    return this.http.get<AuthUser>(`${environment.apiUrl}/api/v1/auth/me`).pipe(tap(user => this.userState.set(user)));
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    this.tokenState.set(null);
    this.userState.set(null);
  }

  getToken(): string | null { return this.tokenState(); }

  private persist(response: AuthResponse): void {
    sessionStorage.setItem(this.tokenKey, response.token);
    this.tokenState.set(response.token);
    this.userState.set(response.user);
  }
}
