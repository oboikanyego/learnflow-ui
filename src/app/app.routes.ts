import { Routes } from '@angular/router';import { authGuard } from './core/auth/auth.guard';
export const routes:Routes=[
{path:'login',loadComponent:()=>import('./features/auth/login.component').then(m=>m.LoginComponent)},{path:'register',loadComponent:()=>import('./features/auth/register.component').then(m=>m.RegisterComponent)},
{path:'',pathMatch:'full',redirectTo:'dashboard'},
{path:'dashboard',canActivate:[authGuard],loadComponent:()=>import('./features/dashboard/dashboard.component').then(m=>m.DashboardComponent)},
{path:'learning-paths',canActivate:[authGuard],loadComponent:()=>import('./features/learning-paths/learning-paths.component').then(m=>m.LearningPathsComponent)},
{path:'learning-paths/:id',canActivate:[authGuard],loadComponent:()=>import('./features/learning-paths/learning-path-detail.component').then(m=>m.LearningPathDetailComponent)},
{path:'board',canActivate:[authGuard],loadComponent:()=>import('./features/board/board.component').then(m=>m.BoardComponent)},
{path:'import',canActivate:[authGuard],loadComponent:()=>import('./features/import/import.component').then(m=>m.ImportComponent)},
{path:'notifications',canActivate:[authGuard],loadComponent:()=>import('./features/notifications/notifications.component').then(m=>m.NotificationsComponent)},
{path:'ai-planner',canActivate:[authGuard],loadComponent:()=>import('./features/ai-planner/ai-planner.component').then(m=>m.AiPlannerComponent)},
{path:'**',redirectTo:'dashboard'}];
