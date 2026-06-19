import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<LoginResponse | null>(this.loadFromStorage());

  login(email: string, password: string, tenantId: string) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
      email, password, tenantId
    }).pipe(tap(res => {
      localStorage.setItem('auth', JSON.stringify(res));
      this.currentUser.set(res);
    }));
  }

  logout() {
    localStorage.removeItem('auth');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  get token(): string | null {
    return this.currentUser()?.accessToken ?? null;
  }

  get isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  private loadFromStorage(): LoginResponse | null {
    try {
      const raw = localStorage.getItem('auth');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
