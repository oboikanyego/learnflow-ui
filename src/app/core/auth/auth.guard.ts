import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const valid = await auth.ensureSession();
  return valid ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url, reason: 'session' } });
};
