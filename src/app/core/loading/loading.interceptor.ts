import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from './loading.service';

const BLOCKING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  const backgroundRequest =
    req.url.includes('/api/v1/notifications') ||
    req.url.includes('/api/v1/ai/plan-jobs');
  const blockingRequest = BLOCKING_METHODS.has(req.method.toUpperCase()) && !backgroundRequest;

  if (!blockingRequest) return next(req);

  loading.start();
  return next(req).pipe(finalize(() => loading.stop()));
};
