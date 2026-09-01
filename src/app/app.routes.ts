import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'about', loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent) },
  { path: 'contact', loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'onboarding', canActivate: [authGuard], loadComponent: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'progress', canActivate: [authGuard], loadComponent: () => import('./features/progress/progress.component').then(m => m.ProgressComponent) },
  { path: 'goals', canActivate: [authGuard], loadComponent: () => import('./features/goals/goals.component').then(m => m.GoalsComponent) },
  { path: 'learning-paths', canActivate: [authGuard], loadComponent: () => import('./features/learning-paths/learning-paths.component').then(m => m.LearningPathsComponent) },
  { path: 'learning-paths/:id', canActivate: [authGuard], loadComponent: () => import('./features/learning-paths/learning-path-detail.component').then(m => m.LearningPathDetailComponent) },
  { path: 'board', canActivate: [authGuard], loadComponent: () => import('./features/board/board.component').then(m => m.BoardComponent) },
  { path: 'import', canActivate: [authGuard], loadComponent: () => import('./features/import/import.component').then(m => m.ImportComponent) },
  { path: 'notifications', canActivate: [authGuard], loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'billing', canActivate: [authGuard], loadComponent: () => import('./features/billing/billing.component').then(m => m.BillingComponent) },
  { path: 'settings', canActivate: [authGuard], loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
  { path: 'ai-planner', canActivate: [authGuard], loadComponent: () => import('./features/ai-planner/ai-planner.component').then(m => m.AiPlannerComponent) },
  { path: 'ai-requests', canActivate: [authGuard], loadComponent: () => import('./features/ai-requests/ai-requests.component').then(m => m.AiRequestsComponent) },
  { path: 'ai-coach', canActivate: [authGuard], loadComponent: () => import('./features/ai-coach/ai-coach.component').then(m => m.AiCoachComponent) },
  { path: 'ai-usage', canActivate: [authGuard], loadComponent: () => import('./features/ai-usage/ai-usage.component').then(m => m.AiUsageComponent) },
  { path: 'admin', canActivate: [authGuard], loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent) },
  { path: 'admin/entitlements', canActivate: [authGuard], loadComponent: () => import('./features/admin/entitlements.component').then(m => m.EntitlementsComponent) },
  { path: 'admin/billing', canActivate: [authGuard], loadComponent: () => import('./features/admin/billing-settings.component').then(m => m.BillingSettingsComponent) },
  { path: 'admin/billing-events', canActivate: [authGuard], loadComponent: () => import('./features/admin/billing-events.component').then(m => m.BillingEventsComponent) },
  { path: '**', redirectTo: '' }
];
