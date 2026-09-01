import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth/auth.interceptor';
import { loadingInterceptor } from './app/core/loading/loading.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideNativeDateAdapter(),
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor])),
    provideRouter(routes, withPreloading(PreloadAllModules))
  ]
}).catch(console.error);
