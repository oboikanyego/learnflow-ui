import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header class="app-header">
      <a routerLink="/" class="brand-lockup" aria-label="LearnFlow home">
        <span class="brand-mark">LF</span>
        <span><strong>LearnFlow</strong><small>Learning operations</small></span>
      </a>

      @if (auth.isAuthenticated()) {
        <nav class="workspace-nav" aria-label="Workspace navigation">
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/learning-paths" routerLinkActive="active">Paths</a>
          <a routerLink="/board" routerLinkActive="active">Board</a>
          <a routerLink="/import" routerLinkActive="active">Import</a>
          <a routerLink="/ai-planner" routerLinkActive="active">AI Planner</a>
          <a routerLink="/notifications" routerLinkActive="active">Notifications</a>
        </nav>
        <button class="header-ghost-action" type="button" (click)="logout()">Log out</button>
      } @else {
        <nav class="public-nav" aria-label="Public navigation">
          <a routerLink="/" fragment="how-it-works">How it works</a>
          <a routerLink="/login">Sign in</a>
          <a routerLink="/register" class="header-primary-action">Get started</a>
        </nav>
      }
    </header>

    <main class="shell" [class.public-shell]="!auth.isAuthenticated()">
      <router-outlet />
    </main>
  `
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
