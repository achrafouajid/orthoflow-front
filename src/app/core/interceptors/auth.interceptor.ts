import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.token();
  const authedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError(err => {
      if (err.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
        authService.logout();
        router.navigate(['/login']);
      }
      // Every backend response carries X-Correlation-Id (CorrelationIdFilter);
      // logging it on every failed request means a support report can be
      // grepped straight to the matching backend log line (audit VII.5/P3#41).
      const correlationId = err.headers?.get?.('X-Correlation-Id');
      if (correlationId) {
        console.error(`[${req.method} ${req.url}] failed — correlation id: ${correlationId}`, err);
      }
      return throwError(() => err);
    })
  );
};
