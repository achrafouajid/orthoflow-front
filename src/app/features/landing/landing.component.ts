import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
})
export class LandingPageComponent {
  readonly featureCards = [
    { title: 'Patient Hub', body: 'Centralized dossiers and treatment tracking.' },
    { title: 'Smart Scheduler', body: 'Optimized booking for higher throughput.' },
    { title: 'Digital Billing', body: 'Seamless insurance and payment workflows.' },
  ];

  readonly stats = [
    { value: '2k+', label: 'Practices' },
    { value: '99.9%', label: 'Uptime' },
    { value: '1M+', label: 'Patients' },
  ];

  readonly testimonials = [
    { quote: 'The best investment we made this year.', name: 'Dr. Emily Chen', title: 'Ortho Specialist' },
    { quote: 'Finally, software that understands us.', name: 'Dr. Mark Sloan', title: 'Practice Owner' },
    { quote: 'Increased our efficiency by 40%.', name: 'Sarah Miller', title: 'Office Manager' },
  ];

  readonly news = [
    { tag: 'Product', title: 'New AI integration for x-rays', href: '#', body: 'Speed up diagnostics with our new tools.' },
    { tag: 'Company', title: 'OrthoFlow joins global tech summit', href: '#', body: 'Meet us in New York this fall.' },
    { tag: 'Tips', title: '5 ways to improve patient retention', href: '#', body: 'Simple steps for a better practice.' },
  ];

  readonly footerLinks = ['Product', 'Features', 'Pricing', 'Security', 'About', 'Contact'];
}
