import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-900">
      <div class="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">BarberOS</h1>
          <p class="text-gray-500 mt-1">Panel de administración</p>
        </div>

        <form (ngSubmit)="submit()" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input [(ngModel)]="email" name="email" type="email" required
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin@barberia.com" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input [(ngModel)]="password" name="password" type="password" required
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tenant ID</label>
            <input [(ngModel)]="tenantId" name="tenantId" required
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="00000000-0000-0000-0000-000000000000" />
          </div>

          @if (error()) {
            <p class="text-red-600 text-sm text-center">{{ error() }}</p>
          }

          <button type="submit" [disabled]="loading()"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
            {{ loading() ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  tenantId = '';
  loading = signal(false);
  error = signal('');

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password, this.tenantId).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: (err) => {
        this.error.set(err?.error?.detail ?? 'Credenciales incorrectas');
        this.loading.set(false);
      }
    });
  }
}
