import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-gray-100">
      <!-- Sidebar -->
      <aside class="w-64 bg-gray-900 text-white flex flex-col">
        <div class="p-6 border-b border-gray-700">
          <h1 class="text-xl font-bold">✂️ BarberOS</h1>
          <p class="text-xs text-gray-400 mt-1">{{ auth.currentUser()?.fullName }}</p>
        </div>
        <nav class="flex-1 py-4">
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="bg-indigo-600"
              class="flex items-center gap-3 px-6 py-3 text-sm hover:bg-gray-700 transition">
              <span>{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
        <div class="p-4 border-t border-gray-700">
          <button (click)="auth.logout()"
            class="w-full text-left text-sm text-gray-400 hover:text-white transition px-2 py-2">
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- Content -->
      <main class="flex-1 overflow-auto">
        <router-outlet />
      </main>
    </div>
  `
})
export class AdminLayoutComponent {
  auth = inject(AuthService);

  navItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/appointments', icon: '📅', label: 'Citas' },
    { path: '/admin/services', icon: '✂️', label: 'Servicios' },
    { path: '/admin/barbers', icon: '👤', label: 'Barberos' },
    { path: '/admin/customers', icon: '👥', label: 'Clientes' },
  ];
}
