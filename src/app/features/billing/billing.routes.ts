import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'invoices',
        loadComponent: () => import('./pages/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent),
      },
      {
        path: 'invoices/create',
        loadComponent: () => import('./pages/invoice-create/invoice-create.component').then(m => m.InvoiceCreateComponent),
      },
      {
        path: 'quotes',
        loadComponent: () => import('./pages/quote-list/quote-list.component').then(m => m.QuoteListComponent),
      },
      {
        path: 'invoices/:id',
        loadComponent: () => import('./pages/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent),
      },
      {
        path: '',
        redirectTo: 'invoices',
        pathMatch: 'full'
      }
    ]
  }
];
