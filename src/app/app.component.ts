import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { LoadingService } from './core/loading/loading.service';
import { NotificationCenterService } from './core/notifications/notification-center.service';

type NavGroup = 'workspace' | 'learning' | 'career' | 'tools' | 'account' | 'admin';

const TOUR_STEPS = [
  { kicker: 'Start here', title: 'Today is your home base', copy: 'Use Today for the single next action and only the few sessions immediately after it.', link: '/today', action: 'Open Today' },
  { kicker: 'Plan ahead', title: 'Keep future work in Backlog', copy: 'Use Backlog to browse the full upcoming plan without crowding the active Board or your Today view.', link: '/backlog', action: 'Open Backlog' },
  { kicker: 'Do the work', title: 'Board is for active work', copy: 'The Board now focuses on scheduled, in-progress and missed lessons. Move completed work out of the active workflow as you finish it.', link: '/board', action: 'Open Board' },
  { kicker: 'See the big picture', title: 'Learning paths hold the curriculum', copy: 'Use Learning Paths to inspect phases, modules, lesson structure and overall curriculum progress.', link: '/learning-paths', action: 'View Learning Paths' }
] as const;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  styleUrls: ['./app.component.css', './loader.component.css'],
  template: `
    @if (loading.isLoading()) {
      <div class="global-api-loader" role="status" aria-live="polite" aria-label="LearnFlow is processing your request">
        <div class="learning-loader-card"><div class="learning-loader-visual" aria-hidden="true"><span class="learning-orbit learning-orbit-one"></span><span class="learning-orbit learning-orbit-two"></span><span class="learning-orbit learning-orbit-three"></span><div class="learning-logo-shell"><img src="/learnflow-logo.svg" alt=""></div></div><div class="learning-loader-copy"><span class="learning-loader-eyebrow">LearnFlow</span><strong>Getting things ready…</strong><div class="learning-loader-messages" aria-hidden="true"><span>Loading your workspace</span><span>Checking your latest progress</span><span>Preparing the next step</span></div></div><div class="learning-loader-track" aria-hidden="true"><span></span></div><small>This should only take a moment.</small></div>
      </div>
    }

    @if (auth.isAuthenticated()) {
      <div class="jira-workspace">
        <aside class="workspace-sidebar">
          <a routerLink="/today" class="sidebar-brand" aria-label="LearnFlow today">
            <img class="brand-logo brand-logo-sidebar" src="/learnflow-logo.svg" alt="" aria-hidden="true">
            <span><strong>LearnFlow</strong><small>Learning workspace</small></span>
          </a>

          <nav class="sidebar-nav" aria-label="Workspace navigation">
            <section class="nav-group" [class.collapsed]="!groupOpen('workspace')">
              <button type="button" class="nav-group-toggle" (click)="toggleGroup('workspace')"><span>Workspace</span><span class="group-chevron">⌄</span></button>
              @if (groupOpen('workspace')) {<div class="nav-group-links">
                <a routerLink="/today" routerLinkActive="active"><span class="nav-icon">⌂</span><span>Today</span></a>
                <a routerLink="/dashboard" routerLinkActive="active"><span class="nav-icon">▦</span><span>Dashboard</span></a>
                <a routerLink="/goals" routerLinkActive="active"><span class="nav-icon">◎</span><span>Goals</span></a>
                <a routerLink="/board" routerLinkActive="active"><span class="nav-icon">▤</span><span>Board</span></a>
                <a routerLink="/backlog" routerLinkActive="active"><span class="nav-icon">☷</span><span>Backlog</span></a>
                <a routerLink="/learning-paths" routerLinkActive="active"><span class="nav-icon">◇</span><span>Learning paths</span></a>
                <a routerLink="/progress" routerLinkActive="active"><span class="nav-icon">◒</span><span>Progress</span></a>
              </div>}
            </section>

            <section class="nav-group" [class.collapsed]="!groupOpen('learning')">
              <button type="button" class="nav-group-toggle" (click)="toggleGroup('learning')"><span>Learning</span><span class="group-chevron">⌄</span></button>
              @if (groupOpen('learning')) {<div class="nav-group-links">
                <a routerLink="/retention" routerLinkActive="active"><span class="nav-icon">↻</span><span>Review queue</span></a>
                <a routerLink="/mastery" routerLinkActive="active"><span class="nav-icon">✓</span><span>Mastery</span></a>
                <a routerLink="/study-history" routerLinkActive="active"><span class="nav-icon">◷</span><span>Study history</span></a>
                <a routerLink="/achievements" routerLinkActive="active"><span class="nav-icon">★</span><span>Achievements</span></a>
                <a routerLink="/social" routerLinkActive="active"><span class="nav-icon">◉</span><span>Study groups</span></a>
              </div>}
            </section>

            <section class="nav-group" [class.collapsed]="!groupOpen('career')">
              <button type="button" class="nav-group-toggle" (click)="toggleGroup('career')"><span>Career</span><span class="group-chevron">⌄</span></button>
              @if (groupOpen('career')) {<div class="nav-group-links">
                <a routerLink="/career" routerLinkActive="active"><span class="nav-icon">◇</span><span>Readiness</span></a>
                <a routerLink="/career/jobs" routerLinkActive="active"><span class="nav-icon">⌕</span><span>Job matching</span></a>
                <a routerLink="/career/applications" routerLinkActive="active"><span class="nav-icon">▤</span><span>Applications</span></a>
                <a routerLink="/career/outcomes" routerLinkActive="active"><span class="nav-icon">◆</span><span>Offers & outcomes</span></a>
              </div>}
            </section>

            <section class="nav-group" [class.collapsed]="!groupOpen('tools')">
              <button type="button" class="nav-group-toggle" (click)="toggleGroup('tools')"><span>Tools</span><span class="group-chevron">⌄</span></button>
              @if (groupOpen('tools')) {<div class="nav-group-links">
                <a routerLink="/ai-planner" routerLinkActive="active"><span class="nav-icon">＋</span><span>Plan with AI</span></a>
                <a routerLink="/import" routerLinkActive="active"><span class="nav-icon">⇧</span><span>Import plan</span></a>
                <a routerLink="/ai-coach" routerLinkActive="active"><span class="nav-icon">✦</span><span>Coach</span></a>
                <a routerLink="/share-progress" routerLinkActive="active"><span class="nav-icon">↗</span><span>Share progress</span></a>
                <a routerLink="/notifications" routerLinkActive="active"><span class="nav-icon">◉</span><span>Notifications</span>@if (notifications.unreadCount() > 0) {<em class="sidebar-count">{{ notifications.unreadCount() > 99 ? '99+' : notifications.unreadCount() }}</em>}</a>
              </div>}
            </section>

            @if (auth.user()?.role === 'admin') {
              <section class="nav-group admin-group" [class.collapsed]="!groupOpen('admin')">
                <button type="button" class="nav-group-toggle" (click)="toggleGroup('admin')"><span>Administration</span><span class="group-chevron">⌄</span></button>
                @if (groupOpen('admin')) {<div class="nav-group-links">
                  <a routerLink="/admin" routerLinkActive="active"><span class="nav-icon">◫</span><span>Overview</span></a>
                  <a routerLink="/admin/entitlements" routerLinkActive="active"><span class="nav-icon">◇</span><span>Entitlements</span></a>
                  <a routerLink="/admin/billing" routerLinkActive="active"><span class="nav-icon">¤</span><span>Billing operations</span></a>
                  <a routerLink="/admin/system-health" routerLinkActive="active"><span class="nav-icon">♥</span><span>System health</span></a>
                </div>}
              </section>
            }

            <section class="nav-group" [class.collapsed]="!groupOpen('account')">
              <button type="button" class="nav-group-toggle" (click)="toggleGroup('account')"><span>Account</span><span class="group-chevron">⌄</span></button>
              @if (groupOpen('account')) {<div class="nav-group-links">
                <a routerLink="/profile" routerLinkActive="active"><span class="nav-icon">◎</span><span>Profile & plan</span></a>
                <a routerLink="/billing" routerLinkActive="active"><span class="nav-icon">¤</span><span>Billing</span></a>
                <a routerLink="/settings" routerLinkActive="active"><span class="nav-icon">⚙</span><span>Settings</span></a>
              </div>}
            </section>
          </nav>

          <div class="sidebar-help"><button type="button" class="sidebar-help-button" (click)="startTour()"><span class="help-mark">?</span><span><strong>Need a hand?</strong><small>Take the 2-minute tour</small></span></button></div>
          <div class="sidebar-footer">
            <button type="button" class="sidebar-account" (click)="logout()">
              <span class="account-avatar" style="overflow:hidden">
                @if (auth.user()?.profileImageUrl) {
                  <img [src]="auth.user()?.profileImageUrl ?? ''" [alt]="(auth.user()?.name || 'Account') + ' profile picture'" style="width:30px;height:30px;border-radius:50%;object-fit:cover;display:block">
                } @else {
                  {{ accountInitials() }}
                }
              </span>
              <span><strong>{{ auth.user()?.name || 'Account' }}</strong><small>{{ auth.user()?.entitlement?.plan || 'FREE' }} · Sign out</small></span><span>↗</span>
            </button>
          </div>
        </aside>

        <div class="workspace-main">
          <header class="workspace-topbar">
            <div class="workspace-breadcrumb"><strong>My workspace</strong><span class="workspace-status">Learning active</span></div>
            <div class="topbar-actions"><a routerLink="/help" class="topbar-help">Help</a><a routerLink="/notifications" class="topbar-icon notification-icon" aria-label="Notifications">◉@if (notifications.unreadCount() > 0) {<span class="notification-badge">{{ notifications.unreadCount() > 99 ? '99+' : notifications.unreadCount() }}</span>}</a><a routerLink="/ai-planner" class="create-work-item">New plan</a></div>
          </header>
          <main id="main-content" class="shell workspace-shell"><router-outlet /></main>
        </div>
      </div>

      <nav class="mobile-app-nav" aria-label="Mobile navigation">
        <a routerLink="/today" routerLinkActive="active"><span>⌂</span><small>Today</small></a>
        <a routerLink="/ai-planner" routerLinkActive="active"><span>＋</span><small>Plan</small></a>
        <a routerLink="/retention" routerLinkActive="active"><span>↻</span><small>Review</small></a>
        <a routerLink="/career" routerLinkActive="active"><span>◇</span><small>Career</small></a>
        <button type="button" [class.active]="mobileMoreOpen()" (click)="toggleMobileMore()"><span>•••</span><small>More</small></button>
      </nav>

      @if (mobileMoreOpen()) {
        <button class="mobile-more-backdrop" type="button" aria-label="Close mobile menu" (click)="mobileMoreOpen.set(false)"></button>
        <section class="mobile-more-sheet" aria-label="More navigation">
          <header><div><strong>More</strong><span>Learning, tools and account</span></div><button type="button" (click)="mobileMoreOpen.set(false)" aria-label="Close">×</button></header>
          <div class="mobile-more-grid">
            <a routerLink="/dashboard" (click)="mobileMoreOpen.set(false)"><span>▦</span><strong>Dashboard</strong><small>Overview and metrics</small></a>
            <a routerLink="/goals" (click)="mobileMoreOpen.set(false)"><span>◎</span><strong>Goals</strong><small>Targets and commitments</small></a>
            <a routerLink="/learning-paths" (click)="mobileMoreOpen.set(false)"><span>◇</span><strong>Learning paths</strong><small>Curriculum and progress</small></a>
            <a routerLink="/board" (click)="mobileMoreOpen.set(false)"><span>▤</span><strong>Board</strong><small>Active learning work</small></a>
            <a routerLink="/backlog" (click)="mobileMoreOpen.set(false)"><span>☷</span><strong>Backlog</strong><small>Upcoming and full plan</small></a>
            <a routerLink="/mastery" (click)="mobileMoreOpen.set(false)"><span>✓</span><strong>Mastery</strong><small>Checkpoint results</small></a>
            <a routerLink="/study-history" (click)="mobileMoreOpen.set(false)"><span>◷</span><strong>Study history</strong><small>Actual focus time</small></a>
            <a routerLink="/ai-coach" (click)="mobileMoreOpen.set(false)"><span>✦</span><strong>Coach</strong><small>Learning guidance</small></a>
            <a routerLink="/career/applications" (click)="mobileMoreOpen.set(false)"><span>▤</span><strong>Applications</strong><small>Career pipeline</small></a>
            <a routerLink="/notifications" (click)="mobileMoreOpen.set(false)"><span>◉</span><strong>Notifications</strong><small>Updates and reminders</small></a>
            <a routerLink="/help" (click)="mobileMoreOpen.set(false)"><span>?</span><strong>Help & guide</strong><small>Learn how it works</small></a>
            <a routerLink="/profile" (click)="mobileMoreOpen.set(false)"><span>◎</span><strong>Profile</strong><small>Account and plan</small></a>
            <a routerLink="/settings" (click)="mobileMoreOpen.set(false)"><span>⚙</span><strong>Settings</strong><small>Preferences</small></a>
          </div>
        </section>
      }

      @if (showTour()) {
        <div class="product-tour-backdrop" role="dialog" aria-modal="true" aria-labelledby="tour-title"><section class="product-tour-card"><div class="tour-progress" aria-label="Tutorial progress"><span [style.width.%]="((tourStep() + 1) / tourSteps.length) * 100"></span></div><div class="tour-header"><span class="tour-kicker">{{ tourSteps[tourStep()].kicker }}</span><button type="button" class="tour-close" (click)="finishTour()" aria-label="Close tutorial">×</button></div><h2 id="tour-title">{{ tourSteps[tourStep()].title }}</h2><p>{{ tourSteps[tourStep()].copy }}</p><div class="tour-footer"><span>Step {{ tourStep() + 1 }} of {{ tourSteps.length }}</span><div class="tour-actions">@if (tourStep() > 0) {<button type="button" class="lf-btn lf-btn-secondary" (click)="previousTourStep()">Back</button>}<a [routerLink]="tourSteps[tourStep()].link" class="tour-link" (click)="finishTour()">{{ tourSteps[tourStep()].action }}</a>@if (tourStep() < tourSteps.length - 1) {<button type="button" class="lf-btn lf-btn-primary" (click)="nextTourStep()">Next</button>} @else {<button type="button" class="lf-btn lf-btn-primary" (click)="finishTour()">Done</button>}</div></div></section></div>
      }

      @if (notifications.toast(); as toast) {
        <aside class="app-toast" [class.toast-error]="toast.type === 'AI_PLAN_FAILED'" aria-live="polite"><div class="toast-icon">{{ toast.type === 'AI_PLAN_FAILED' ? '!' : '✓' }}</div><div class="toast-copy"><strong>{{ toast.title }}</strong><p>{{ toast.message }}</p></div>@if (toast.actionUrl) {<button type="button" class="toast-action" (click)="openNotification(toast.actionUrl)">View</button>}<button type="button" class="toast-close" (click)="notifications.dismissToast()">×</button></aside>
      }
    } @else {
      <header class="app-header public-header"><a routerLink="/" class="brand-lockup" aria-label="LearnFlow home"><img class="brand-logo brand-logo-public" src="/learnflow-logo.svg" alt="" aria-hidden="true"><span><strong>LearnFlow</strong><small>Learning operations</small></span></a><nav class="public-nav"><a routerLink="/">Home</a><a routerLink="/about">About</a><a routerLink="/contact">Contact</a><a routerLink="/login" class="header-login-action">Sign in</a><a routerLink="/register" class="header-primary-action">Get started</a></nav></header><main id="main-content" class="shell public-shell"><router-outlet /></main>
    }
  `
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly loading = inject(LoadingService);
  readonly notifications = inject(NotificationCenterService);
  readonly tourSteps = TOUR_STEPS;
  readonly tourStep = signal(0);
  readonly showTour = signal(false);
  readonly mobileMoreOpen = signal(false);
  private readonly router = inject(Router);
  private readonly openGroups = signal<Record<NavGroup, boolean>>(this.loadNavState());

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.notifications.start();
        if (!localStorage.getItem('learnflow_product_tour_v1')) this.showTour.set(true);
      } else {
        this.notifications.stop();
        this.showTour.set(false);
        this.mobileMoreOpen.set(false);
      }
    });
  }

  groupOpen(group: NavGroup) { return this.openGroups()[group]; }
  toggleGroup(group: NavGroup) { const current = this.openGroups(); const next = { ...current, [group]: !current[group] }; this.openGroups.set(next); localStorage.setItem('learnflow_nav_groups_v2', JSON.stringify(next)); }
  toggleMobileMore() { this.mobileMoreOpen.update(open => !open); }
  logout() { this.auth.logout(); void this.router.navigateByUrl('/'); }
  openNotification(actionUrl: string) { this.notifications.dismissToast(); void this.router.navigateByUrl(actionUrl); }
  accountInitials() { const name = this.auth.user()?.name?.trim(); if (!name) return 'LF'; return name.split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase(); }
  startTour() { this.tourStep.set(0); this.showTour.set(true); }
  nextTourStep() { this.tourStep.update(step => Math.min(step + 1, this.tourSteps.length - 1)); }
  previousTourStep() { this.tourStep.update(step => Math.max(step - 1, 0)); }
  finishTour() { localStorage.setItem('learnflow_product_tour_v1', 'completed'); this.showTour.set(false); }

  private loadNavState(): Record<NavGroup, boolean> {
    const fallback = { workspace: true, learning: true, career: false, tools: false, account: false, admin: true };
    try { const saved = localStorage.getItem('learnflow_nav_groups_v2'); return saved ? { ...fallback, ...JSON.parse(saved) } : fallback; } catch { return fallback; }
  }
}