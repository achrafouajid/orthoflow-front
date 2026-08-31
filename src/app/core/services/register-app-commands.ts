import { Router } from '@angular/router';
import { CommandRegistryService, Command } from './command-registry.service';

/**
 * The candidate first command set from audit XII.6 — navigation and
 * safe/read commands go straight through; nothing here writes clinical or
 * financial data (those stay behind their existing confirm dialogs, reached
 * by navigating to the relevant screen first). Called once from
 * AppComponent's constructor.
 */
export function registerAppCommands(registry: CommandRegistryService, router: Router): void {
  const nav = (path: string): void => {
    router.navigateByUrl(path);
  };

  const commands: Command[] = [
    // ── Navigation (safe, always available) ────────────────────────────
    {
      id: 'nav.dashboard',
      label: 'Go to Dashboard',
      category: 'navigation',
      icon: 'dashboard',
      keywords: ['home', 'overview'],
      execute: () => nav('/'),
    },
    {
      id: 'nav.patients',
      label: 'Go to Patients',
      category: 'navigation',
      icon: 'people',
      keywords: ['patient list'],
      execute: () => nav('/patients'),
    },
    {
      id: 'nav.patients.register',
      label: 'New Patient Registration',
      category: 'action',
      icon: 'person_add',
      keywords: ['add patient', 'create patient', 'register'],
      execute: () => nav('/patients/register'),
    },
    {
      id: 'nav.schedule',
      label: 'Go to Schedule',
      category: 'navigation',
      icon: 'event',
      keywords: ['calendar', 'appointments'],
      execute: () => nav('/schedule'),
    },
    {
      id: 'nav.billing',
      label: 'Go to Billing',
      category: 'navigation',
      icon: 'payments',
      keywords: ['invoices', 'invoicing'],
      execute: () => nav('/billing/invoices'),
    },
    {
      id: 'nav.billing.create',
      label: 'New Invoice',
      category: 'action',
      icon: 'receipt_long',
      keywords: ['create invoice', 'bill patient'],
      execute: () => nav('/billing/invoices/create'),
    },
    {
      id: 'nav.stock',
      label: 'Go to Stock & Inventory',
      category: 'navigation',
      icon: 'inventory_2',
      keywords: ['inventory', 'catalog'],
      execute: () => nav('/stock'),
    },
    {
      id: 'nav.stock.procurement',
      label: 'Go to Procurement (Purchase Orders)',
      category: 'navigation',
      icon: 'local_shipping',
      keywords: ['purchase order', 'po', 'delivery note', 'grni'],
      execute: () => nav('/stock/procurement'),
    },
    {
      id: 'nav.stock.sales',
      label: 'Go to Patient OTC Sales',
      category: 'navigation',
      icon: 'point_of_sale',
      keywords: ['sales order', 'so'],
      execute: () => nav('/stock/direct-sales'),
    },
    {
      id: 'nav.stock.sessions',
      label: 'Go to Treatment Sessions Logger',
      category: 'navigation',
      icon: 'medical_information',
      keywords: ['treatment session', 'consumables'],
      execute: () => nav('/stock/treatment-sessions'),
    },
    {
      id: 'nav.treatments',
      label: 'Go to Treatments Catalog',
      category: 'navigation',
      icon: 'healing',
      keywords: ['procedures', 'treatment catalog'],
      execute: () => nav('/treatments'),
    },
    {
      id: 'nav.settings',
      label: 'Go to Settings',
      category: 'navigation',
      icon: 'settings',
      keywords: ['preferences', 'configuration'],
      execute: () => nav('/settings'),
    },

    // ── Global actions ────────────────────────────────────────────────
    {
      id: 'action.schedule.new',
      label: 'Schedule New Appointment',
      category: 'action',
      icon: 'event_available',
      keywords: ['book appointment', 'new appointment'],
      execute: () => nav('/schedule'),
    },
  ];

  registry.registerMany(commands);
}
