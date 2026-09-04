import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const videoSafetyGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const snack = inject(MatSnackBar);
  const router = inject(Router);
  const valid = await auth.ensureSession();
  if (!valid) return router.createUrlTree(['/login'], { queryParams: { reason: 'session' } });

  if (!auth.user()?.dateOfBirth) {
    const ref = snack.open(
      'Age profile missing: Video Finder is using strict YouTube filtering and blocking age-restricted content.',
      'Add DOB',
      { duration: 9000, horizontalPosition: 'right', verticalPosition: 'top' }
    );
    ref.onAction().subscribe(() => void router.navigate(['/profile'], { queryParams: { prompt: 'age-safety' } }));
  }
  return true;
};
