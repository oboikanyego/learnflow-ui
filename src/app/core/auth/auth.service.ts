import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser { id: string; name: string; email: string; role: string; timezone: string; }
export interface AuthResponse { token: string; user: AuthUser; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'learnflow_access_token';
  private readonly userState = signal<AuthUser | null>(null);
  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.getToken());

  constructor(private readonly http: HttpClient) {}

  register(input: { name: string; email: string; password: string; timezone: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/v1/auth/register`, input).pipe(tap(response => this.persist(response)));
  }

  login(input: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/v1/auth/login`, input).pipe(tap(response => this.persist(response)));
  }

  loadProfile() {
    return this.http.get<AuthUser>(`${environment.apiUrl}/api/v1/auth/me`).pipe(tap(user => this.userState.set(user)));
  }

  logout() { sessionStorage.removeItem(this.tokenKey); this.userState.set(null); }
  getToken() { return sessionStorage.getItem(this.tokenKey); }

  private persist(response: AuthResponse) {
    sessionStorage.setItem(this.tokenKey, response.token);
    this.userState.set(response.user);
  }
}
