import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  imports: [RouterLink, TranslateModule],
  template: `
    <main class="min-h-screen bg-[#f8fafc]">
      <div class="grid min-h-screen lg:grid-cols-2">
        <!-- Login Side -->
        <section class="flex items-center justify-center px-8 py-12">
          <div class="w-full max-w-md">
            <div class="mb-10">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-ortho-navy text-white font-bold mb-4">O</div>
              <h1 class="text-3xl font-bold text-ortho-navy tracking-tight">{{ 'AUTH.SIGN_IN_TITLE' | translate }}</h1>
              <p class="mt-2 text-ortho-navy/50">{{ 'AUTH.SIGN_IN_SUBTITLE' | translate }}</p>
            </div>

            <form class="space-y-6">
              <div class="space-y-2">
                <label class="text-sm font-semibold text-ortho-navy/70" for="email">{{ 'AUTH.EMAIL_LABEL' | translate }}</label>
                <input 
                  id="email" 
                  type="email" 
                  placeholder="doctor@orthoflow.com" 
                  class="w-full rounded-xl border border-ortho-navy/10 bg-white px-4 py-3.5 outline-none transition-all focus:border-ortho-teal focus:ring-4 focus:ring-ortho-teal/5" 
                />
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-semibold text-ortho-navy/70" for="password">{{ 'AUTH.PASSWORD_LABEL' | translate }}</label>
                  <a href="#" class="text-xs font-bold text-ortho-teal hover:underline">{{ 'AUTH.FORGOT_PASSWORD' | translate }}</a>
                </div>
                <input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  class="w-full rounded-xl border border-ortho-navy/10 bg-white px-4 py-3.5 outline-none transition-all focus:border-ortho-teal focus:ring-4 focus:ring-ortho-teal/5" 
                />
              </div>

              <div class="flex items-center gap-3">
                <input 
                  id="remember" 
                  type="checkbox" 
                  class="h-4 w-4 rounded border-ortho-navy/10 text-ortho-teal focus:ring-ortho-teal" 
                />
                <label for="remember" class="text-sm font-medium text-ortho-navy/60">{{ 'AUTH.REMEMBER_ME' | translate }}</label>
              </div>

              <button 
                type="button" 
                class="w-full rounded-xl bg-ortho-navy py-4 font-bold text-white transition-all hover:bg-ortho-navy/90 hover:shadow-lg active:scale-[0.98]"
              >
                {{ 'AUTH.SIGN_IN_BUTTON' | translate }}
              </button>
            </form>

            <div class="mt-8 text-center">
              <p class="text-sm text-ortho-navy/50">
                {{ 'AUTH.NO_ACCOUNT' | translate }} 
                <a routerLink="/" class="font-bold text-ortho-teal hover:underline">{{ 'AUTH.REQUEST_DEMO' | translate }}</a>
              </p>
            </div>
          </div>
        </section>

        <!-- Visual Side -->
        <aside class="hidden bg-ortho-navy lg:flex items-center justify-center p-12">
          <div class="relative w-full max-w-lg">
            <div class="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-ortho-teal/20 blur-3xl"></div>
            <div class="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-ortho-sky/20 blur-3xl"></div>
            
            <div class="tile p-8 relative z-10 overflow-hidden bg-white/5 border-white/10 backdrop-blur-sm">
              <h2 class="text-3xl font-bold text-white tracking-tight">{{ 'AUTH.VISUAL_TITLE' | translate }}</h2>
              <p class="mt-4 text-white/60 leading-relaxed text-lg">
                {{ 'AUTH.VISUAL_SUBTITLE' | translate }}
              </p>
              
              <div class="mt-10 flex gap-4">
                <div class="h-12 w-12 rounded-full bg-white/10"></div>
                <div>
                  <p class="text-white font-bold">Dr. Sarah Jenkins</p>
                  <p class="text-white/40 text-sm">Ortho Clinic, London</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  `,
})
export class LoginPageComponent {}
