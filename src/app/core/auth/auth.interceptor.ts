import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        const returnUrl = router.url.startsWith('/') && !router.url.startsWith('/login') ? router.url : '/today';
        auth.logout();
        void router.navigate(['/login'], { queryParams: { returnUrl, reason: 'session-expired' } });
      }
      return throwError(() => error);
    })
  );
};
