import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthUser } from '../models/user.model';

const TOKEN_KEY = 'orthoflow_auth_token';
const USER_KEY = 'orthoflow_auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(AuthApiService);

  private tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private userSignal = signal<AuthUser | null>(this.readStoredUser());

  token = computed(() => this.tokenSignal());
  currentUser = computed(() => this.userSignal());
  isAuthenticated = computed(() => !!this.tokenSignal());

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  login(email: string, password: string): Observable<{ token: string; user: AuthUser }> {
    return this.api.login(email, password).pipe(
      tap(response => {
        this.tokenSignal.set(response.token);
        this.userSignal.set(response.user);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      })
    );
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  hasRole(...roles: AuthUser['role'][]): boolean {
    const user = this.userSignal();
    return !!user && roles.includes(user.role);
  }
}
