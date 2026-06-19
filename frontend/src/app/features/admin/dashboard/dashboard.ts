import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentsApiService, AppointmentDto } from '../../../core/api/appointments.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div class="grid grid-cols-4 gap-4 mb-8">
        @for (card of stats(); track card.label) {
          <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p class="text-3xl font-bold text-indigo-600">{{ card.value }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ card.label }}</p>
          </div>
        }
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 class="font-semibold text-gray-900">Citas de hoy</h3>
          <a routerLink="/admin/appointments" class="text-sm text-indigo-600 hover:underline">Ver todas</a>
        </div>
        <div class="divide-y divide-gray-50">
          @for (apt of todayAppointments(); track apt.id) {
            <div class="p-4 flex justify-between items-center">
              <div>
                <p class="font-medium text-gray-900">{{ apt.customerName }}</p>
                <p class="text-sm text-gray-500">{{ apt.serviceName }} con {{ apt.barberName }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">{{ apt.startsAt | date:'HH:mm' }}</p>
                <span class="text-xs px-2 py-0.5 rounded-full" [class]="statusClass(apt.status)">
                  {{ apt.status }}
                </span>
              </div>
            </div>
          }
          @empty {
            <p class="p-6 text-center text-gray-400 text-sm">No hay citas para hoy</p>
          }
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private appointmentsApi = inject(AppointmentsApiService);

  todayAppointments = signal<AppointmentDto[]>([]);
  stats = signal<{ label: string; value: number }[]>([]);

  ngOnInit() {
    const today = new Date();
    const from = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const to = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    this.appointmentsApi.list(from, to).subscribe(apts => {
      this.todayAppointments.set(apts);
      this.stats.set([
        { label: 'Citas hoy', value: apts.length },
        { label: 'Confirmadas', value: apts.filter(a => a.status === 'Confirmed').length },
        { label: 'Completadas', value: apts.filter(a => a.status === 'Completed').length },
        { label: 'No-show', value: apts.filter(a => a.status === 'NoShow').length },
      ]);
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      Pending: 'bg-yellow-100 text-yellow-700',
      Confirmed: 'bg-blue-100 text-blue-700',
      InProgress: 'bg-indigo-100 text-indigo-700',
      Completed: 'bg-green-100 text-green-700',
      CancelledByCustomer: 'bg-red-100 text-red-700',
      CancelledByBarber: 'bg-orange-100 text-orange-700',
      NoShow: 'bg-gray-100 text-gray-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-700';
  }
}
