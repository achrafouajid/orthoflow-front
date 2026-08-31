import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { CabinetService } from '../services/cabinet.service';
import { AuthService } from '../services/auth.service';

export const onboardingGuard: CanActivateFn = (route, state) => {
  const cabinetService = inject(CabinetService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Cabinet branding is saved to localStorage per-browser and is separate
  // from account state — a valid session (e.g. logging in from a browser
  // that never ran the wizard) must count as onboarded too, or an
  // authenticated user gets bounced back into the onboarding wizard here
  // before authGuard ever runs.
  const onboarded = cabinetService.isOnboarded() || authService.isAuthenticated();
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
