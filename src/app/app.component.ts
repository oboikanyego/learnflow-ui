import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { LoadingService } from './core/loading/loading.service';
import { NotificationCenterService } from './core/notifications/notification-center.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  styleUrl: './app.component.css',
  template: `
    @if (loading.isLoading()) {
      <div class="global-api-loader" role="progressbar" aria-label="Loading application data"><span></span></div>
    }

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

            <span class="sidebar-label sidebar-label-spaced">AI & tools</span>
            <a routerLink="/ai-planner" routerLinkActive="active"><span class="nav-icon">✦</span><span>AI planner</span></a>
            <a routerLink="/ai-requests" routerLinkActive="active"><span class="nav-icon">☷</span><span>AI requests</span></a>
            <a routerLink="/ai-coach" routerLinkActive="active"><span class="nav-icon">✺</span><span>AI coach</span></a>
            <a routerLink="/import" routerLinkActive="active"><span class="nav-icon">⇧</span><span>Import</span></a>
            <a routerLink="/notifications" routerLinkActive="active"><span class="nav-icon">◉</span><span>Notifications</span></a>
          </nav>

          <div class="sidebar-footer">
            <button type="button" class="sidebar-account" (click)="logout()">
              <span class="account-avatar">{{ accountInitials() }}</span>
              <span><strong>{{ auth.user()?.name || 'Account' }}</strong><small>Log out</small></span>
              <span>↗</span>
            </button>
          </div>
        </aside>

        <div class="workspace-main">
          <header class="workspace-topbar">
            <div class="workspace-breadcrumb"><span>LearnFlow</span><span>/</span><strong>Workspace</strong></div>
            <div class="topbar-actions">
              <a routerLink="/notifications" class="topbar-icon notification-icon" aria-label="Notifications">
                ◉
                @if (notifications.unreadCount() > 0) { <span class="notification-badge">{{ notifications.unreadCount() > 99 ? '99+' : notifications.unreadCount() }}</span> }
              </a>
              <a routerLink="/ai-planner" class="create-work-item">＋ Create lesson plan</a>
            </div>
          </header>
          <main class="shell workspace-shell"><router-outlet /></main>
        </div>
      </div>

      @if (notifications.toast(); as toast) {
        <aside class="app-toast" [class.toast-error]="toast.type === 'AI_PLAN_FAILED'" aria-live="polite">
          <div class="toast-icon">{{ toast.type === 'AI_PLAN_FAILED' ? '!' : '✓' }}</div>
          <div class="toast-copy"><strong>{{ toast.title }}</strong><p>{{ toast.message }}</p></div>
          @if (toast.actionUrl) { <button type="button" class="toast-action" (click)="openNotification(toast.actionUrl)">View</button> }
          <button type="button" class="toast-close" aria-label="Dismiss notification" (click)="notifications.dismissToast()">×</button>
        </aside>
      }
    } @else {
      <header class="app-header public-header">
        <a routerLink="/" class="brand-lockup" aria-label="LearnFlow home">
          <span class="brand-mark">LF</span>
          <span><strong>LearnFlow</strong><small>Learning operations</small></span>
        </a>
        <nav class="public-nav" aria-label="Public navigation">
          <a routerLink="/">Home</a>
          <a routerLink="/about" routerLinkActive="active">About us</a>
          <a routerLink="/contact" routerLinkActive="active">Contact us</a>
          <a routerLink="/login" class="header-login-action">Sign in</a>
          <a routerLink="/register" class="header-primary-action">Get started</a>
        </nav>
      </header>
      <main class="shell public-shell"><router-outlet /></main>
    }
  `
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly loading = inject(LoadingService);
  readonly notifications = inject(NotificationCenterService);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) this.notifications.start();
      else this.notifications.stop();
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }

  openNotification(actionUrl: string): void {
    this.notifications.dismissToast();
    void this.router.navigateByUrl(actionUrl);
  }

  accountInitials(): string {
    const name = this.auth.user()?.name?.trim();
    if (!name) return 'LF';
    return name.split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase();
  }
}
