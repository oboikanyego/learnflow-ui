import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationPreferences {
  inAppReminders: boolean;
  emailReminders: boolean;
  reminderMinutes: number;
  missedSessionEmails: boolean;
  celebrationEmails: boolean;
  weeklyReviewEmails: boolean;
}

export interface Entitlement {
  plan: 'FREE' | 'PRO';
  status: 'ACTIVE' | 'INACTIVE' | 'GRACE';
  source: 'SYSTEM' | 'ADMIN' | 'BILLING';
  startsAt?: string;
  endsAt?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  timezone: string;
  entitlement?: Entitlement;
  notificationPreferences?: NotificationPreferences;
}
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

  updateProfile(input: { name: string; timezone: string }) {
    return this.http.patch<AuthUser>(`${environment.apiUrl}/api/v1/auth/profile`, input).pipe(tap(user => {
      const current = this.userState();
      this.userState.set(current ? { ...current, ...user } : user);
    }));
  }

  changePassword(input: { currentPassword: string; newPassword: string }) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/api/v1/auth/change-password`, input);
  }

  updateNotificationPreferences(preferences: NotificationPreferences) {
    return this.http.patch<{ notificationPreferences: NotificationPreferences }>(
      `${environment.apiUrl}/api/v1/auth/notification-preferences`,
      preferences
    ).pipe(tap(response => {
      const current = this.userState();
      if (current) this.userState.set({ ...current, notificationPreferences: response.notificationPreferences });
    }));
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
