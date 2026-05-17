import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { CabinetService } from '../services/cabinet.service';

export const onboardingGuard: CanActivateFn = (route, state) => {
  const cabinetService = inject(CabinetService);
  const router = inject(Router);

  const onboarded = cabinetService.isOnboarded();
  const isOnboardingRoute = state.url.startsWith('/onboarding');

  if (!onboarded) {
    if (!isOnboardingRoute) {
      // Redirect to onboarding if not onboarded yet
      return router.createUrlTree(['/onboarding']);
    }
    return true; // Allow access to /onboarding
  } else {
    if (isOnboardingRoute) {
      // If already onboarded, don't allow going back to onboarding page; redirect to root dashboard
      return router.createUrlTree(['/']);
    }
    return true; // Allow access to app routes
  }
};
