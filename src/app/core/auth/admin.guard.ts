import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const valid = await auth.ensureSession();
  if (!valid) return router.createUrlTree(['/login'], { queryParams: { reason: 'session' } });
  return auth.user()?.role === 'admin'
    ? true
    : router.createUrlTree(['/today'], { queryParams: { reason: 'forbidden' } });
};
