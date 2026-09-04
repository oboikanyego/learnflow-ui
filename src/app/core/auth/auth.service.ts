import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom, tap } from 'rxjs';
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
  dateOfBirth?: string | null;
  profileImageUrl?: string | null;
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
  private readonly tokenState = signal<string | null>(this.validStoredToken());
  private sessionValidation?: Promise<boolean>;

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.isTokenValid(this.tokenState()));

  constructor(private readonly http: HttpClient) {}

  registrationPolicy() {
    return this.http.get<{ minimumAge: number }>(`${environment.apiUrl}/api/v1/auth/registration-policy`);
  }

  register(input: { name: string; email: string; password: string; timezone: string; dateOfBirth: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/v1/auth/register`, input).pipe(tap(response => this.persist(response)));
  }

  login(input: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/v1/auth/login`, input).pipe(tap(response => this.persist(response)));
  }

  forgotPassword(email: string) { return this.http.post<ForgotPasswordResponse>(`${environment.apiUrl}/api/v1/auth/forgot-password`, { email }); }
  resetPassword(token: string, password: string) { return this.http.post<ResetPasswordResponse>(`${environment.apiUrl}/api/v1/auth/reset-password`, { token, password }); }

  loadProfile() {
    return this.http.get<AuthUser>(`${environment.apiUrl}/api/v1/auth/me`).pipe(tap(user => this.userState.set(user)));
  }

  async ensureSession(): Promise<boolean> {
    if (!this.getToken()) return false;
    if (this.userState()) return true;
    if (!this.sessionValidation) {
      this.sessionValidation = firstValueFrom(this.loadProfile())
        .then(() => true)
        .catch(() => { this.logout(); return false; })
        .finally(() => { this.sessionValidation = undefined; });
    }
    return this.sessionValidation;
  }

  updateProfile(input: { name: string; timezone: string; dateOfBirth?: string }) {
    return this.http.patch<AuthUser>(`${environment.apiUrl}/api/v1/auth/profile`, input).pipe(tap(user => {
      const current = this.userState();
      this.userState.set(current ? { ...current, ...user } : user);
    }));
  }

  uploadProfileImage(file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<{ profileImageUrl: string; message: string }>(`${environment.apiUrl}/api/v1/auth/profile-image`, body).pipe(tap(response => {
      const current = this.userState();
      if (current) this.userState.set({ ...current, profileImageUrl: response.profileImageUrl });
    }));
  }

  removeProfileImage() {
    return this.http.delete<{ profileImageUrl: null; message: string }>(`${environment.apiUrl}/api/v1/auth/profile-image`).pipe(tap(() => {
      const current = this.userState();
      if (current) this.userState.set({ ...current, profileImageUrl: null });
    }));
  }

  changePassword(input: { currentPassword: string; newPassword: string }) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/api/v1/auth/change-password`, input);
  }

  updateNotificationPreferences(preferences: NotificationPreferences) {
    return this.http.patch<{ notificationPreferences: NotificationPreferences }>(`${environment.apiUrl}/api/v1/auth/notification-preferences`, preferences).pipe(tap(response => {
      const current = this.userState();
      if (current) this.userState.set({ ...current, notificationPreferences: response.notificationPreferences });
    }));
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    this.tokenState.set(null);
    this.userState.set(null);
    this.sessionValidation = undefined;
  }

  getToken(): string | null {
    const token = this.tokenState();
    if (!this.isTokenValid(token)) {
      if (token) this.logout();
      return null;
    }
    return token;
  }

  private validStoredToken(): string | null {
    const token = sessionStorage.getItem(this.tokenKey);
    if (this.isTokenValid(token)) return token;
    sessionStorage.removeItem(this.tokenKey);
    return null;
  }

  private isTokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const payload = JSON.parse(atob(padded)) as { exp?: number };
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch { return false; }
  }

  private persist(response: AuthResponse): void {
    sessionStorage.setItem(this.tokenKey, response.token);
    this.tokenState.set(response.token);
    this.userState.set(response.user);
  }
}
