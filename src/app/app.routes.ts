import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page.component').then(m => m.LoginPageComponent),
  },
  {
    path: 'landing',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingPageComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'patients',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/patients/patient-list/patient-list.component').then(m => m.PatientListComponent),
          },
          {
            path: 'register',
            loadComponent: () => import('./features/patients/patient-registration/patient-registration.component').then(m => m.PatientRegistrationComponent),
          },
          {
            path: ':id',
            loadComponent: () => import('./features/patients/patient-dossier/patient-dossier.component').then(m => m.PatientDossierComponent),
          }
        ]
      },
      {
        path: 'schedule',
        loadComponent: () => import('./features/schedule/schedule.component').then(m => m.ScheduleComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
      },
      {
        path: 'billing',
        loadChildren: () => import('./features/billing/billing.routes').then(m => m.BILLING_ROUTES),
      },
    ]
  },
  {
    path: '**',
    redirectTo: '',
  },
];
