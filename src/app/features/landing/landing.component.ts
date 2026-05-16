import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './landing.component.html',
})
export class LandingPageComponent {
  readonly featureCards = [
    { key: 'COMMON.PATIENTS', bodyKey: 'PATIENTS.SUBTITLE' },
    { key: 'COMMON.SCHEDULE', bodyKey: 'BILLING.QUOTES_SUBTITLE' },
    { key: 'COMMON.BILLING', bodyKey: 'BILLING.SUBTITLE' },
  ];

  readonly stats = [
    { value: '2k+', key: 'LANDING.PRACTICES' },
    { value: '99.9%', key: 'LANDING.UPTIME' },
    { value: '1M+', key: 'LANDING.PATIENTS_SERVED' },
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
