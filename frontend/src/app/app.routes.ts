import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/layout/admin-layout').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'services',
        loadComponent: () => import('./features/admin/services/services-page').then(m => m.ServicesPageComponent)
      },
      {
        path: 'barbers',
        loadComponent: () => import('./features/admin/barbers/barbers-page').then(m => m.BarbersPageComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/admin/customers/customers-page').then(m => m.CustomersPageComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./features/admin/appointments/appointments-page').then(m => m.AppointmentsPageComponent)
      },
    ]
  },
  { path: '**', redirectTo: 'admin/dashboard' }
];
