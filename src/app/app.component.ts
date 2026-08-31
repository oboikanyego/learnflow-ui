import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    @if (auth.isAuthenticated()) {
      <div class="jira-workspace">
        <aside class="workspace-sidebar">
          <a routerLink="/dashboard" class="sidebar-brand" aria-label="LearnFlow dashboard">
            <span class="brand-mark">LF</span>
            <span><strong>LearnFlow</strong><small>Learning workspace</small></span>
          </a>

          <div class="sidebar-space">
            <span class="space-avatar">L</span>
            <div><strong>Learning</strong><small>Personal workspace</small></div>
            <span class="space-chevron">⌄</span>
          </div>

          <nav class="sidebar-nav" aria-label="Workspace navigation">
            <span class="sidebar-label">Workspace</span>
            <a routerLink="/dashboard" routerLinkActive="active"><span class="nav-icon">⌂</span><span>Dashboard</span></a>
            <a routerLink="/board" routerLinkActive="active"><span class="nav-icon">▦</span><span>Board</span></a>
            <a routerLink="/learning-paths" routerLinkActive="active"><span class="nav-icon">◆</span><span>Learning paths</span></a>

            <span class="sidebar-label sidebar-label-spaced">Tools</span>
            <a routerLink="/ai-planner" routerLinkActive="active"><span class="nav-icon">✦</span><span>AI planner</span></a>
            <a routerLink="/import" routerLinkActive="active"><span class="nav-icon">⇧</span><span>Import</span></a>
            <a routerLink="/notifications" routerLinkActive="active"><span class="nav-icon">◉</span><span>Notifications</span></a>
          </nav>

          <div class="sidebar-footer">
            <button type="button" class="sidebar-account" (click)="logout()">
              <span class="account-avatar">BK</span>
              <span><strong>Account</strong><small>Log out</small></span>
              <span>↗</span>
            </button>
          </div>
        </aside>

        <div class="workspace-main">
          <header class="workspace-topbar">
            <div class="workspace-breadcrumb"><span>LearnFlow</span><span>/</span><strong>Workspace</strong></div>
            <div class="topbar-actions">
              <a routerLink="/notifications" class="topbar-icon" aria-label="Notifications">◉</a>
              <a routerLink="/ai-planner" class="create-work-item">＋ Create lesson plan</a>
            </div>
          </header>
          <main class="shell workspace-shell"><router-outlet /></main>
        </div>
      </div>
    } @else {
      <header class="app-header public-header">
        <a routerLink="/" class="brand-lockup" aria-label="LearnFlow home">
          <span class="brand-mark">LF</span>
          <span><strong>LearnFlow</strong><small>Learning operations</small></span>
        </a>
        <nav class="public-nav" aria-label="Public navigation">
          <a routerLink="/" fragment="how-it-works">How it works</a>
          <a routerLink="/login">Sign in</a>
          <a routerLink="/register" class="header-primary-action">Get started</a>
        </nav>
      </header>
      <main class="shell public-shell"><router-outlet /></main>
    }
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
