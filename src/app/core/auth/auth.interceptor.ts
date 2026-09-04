import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

function friendlyError(error: HttpErrorResponse): string {
  const serverMessage = typeof error.error?.message === 'string' ? error.error.message : '';
  if (error.status === 0) return 'LearnFlow cannot reach the server. Check your connection and try again.';
  if (error.status === 400) return serverMessage || 'Some information is invalid. Review the form and try again.';
  if (error.status === 401) return 'Your session is no longer valid. Sign in again to continue securely.';
  if (error.status === 403) return serverMessage || 'You do not have permission to perform this action.';
  if (error.status === 404) return serverMessage || 'The requested item could not be found.';
  if (error.status === 409) return serverMessage || 'This change conflicts with existing data. Refresh and try again.';
  if (error.status === 429) return serverMessage || 'You have reached a temporary usage limit. Try again after it resets.';
  if (error.status === 503) return serverMessage || 'This LearnFlow service is temporarily unavailable. Try again shortly.';
  if (error.status >= 500) return 'LearnFlow hit an unexpected server error. Try again; if it continues, report it from Help.';
  return serverMessage || 'Something went wrong. Try again.';
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const snack = inject(MatSnackBar);
  const token = auth.getToken();
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        const returnUrl = router.url.startsWith('/') && !router.url.startsWith('/login') ? router.url : '/today';
        auth.logout();
        snack.open('Your session expired. Sign in again to continue securely.', 'Dismiss', { duration: 6000, horizontalPosition: 'right', verticalPosition: 'top' });
        void router.navigate(['/login'], { queryParams: { returnUrl, reason: 'session-expired' } });
      } else if (!(error.status === 401 && !token && req.url.includes('/auth/login'))) {
        snack.open(friendlyError(error), 'Dismiss', { duration: 6000, horizontalPosition: 'right', verticalPosition: 'top' });
      }
      return throwError(() => error);
    })
  );
};
