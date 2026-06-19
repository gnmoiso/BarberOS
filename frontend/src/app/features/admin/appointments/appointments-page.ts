import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsApiService, AppointmentDto, SlotDto } from '../../../core/api/appointments.service';
import { BarbersApiService, BarberDto } from '../../../core/api/barbers.service';
import { ServicesApiService, ServiceDto } from '../../../core/api/services.service';
import { CustomersApiService, CustomerDto } from '../../../core/api/customers.service';

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="p-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Citas</h2>
        <button (click)="openNew()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Nueva cita
        </button>
      </div>

      <!-- Filtro fecha -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5 flex gap-4 items-center">
        <label class="text-sm text-gray-600">Fecha:</label>
        <input [(ngModel)]="selectedDate" (ngModelChange)="load()" type="date"
          class="border rounded-lg px-3 py-1.5 text-sm" />
        <label class="text-sm text-gray-600">Barbero:</label>
        <select [(ngModel)]="selectedBarber" (ngModelChange)="load()" class="border rounded-lg px-3 py-1.5 text-sm">
          <option value="">Todos</option>
          @for (b of barbers(); track b.id) {
            <option [value]="b.id">{{ b.displayName }}</option>
          }
        </select>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-5 py-3 text-left">Hora</th>
              <th class="px-5 py-3 text-left">Cliente</th>
              <th class="px-5 py-3 text-left">Servicio</th>
              <th class="px-5 py-3 text-left">Barbero</th>
              <th class="px-5 py-3 text-right">Precio</th>
              <th class="px-5 py-3 text-center">Estado</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (a of appointments(); track a.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-5 py-3 font-medium">{{ a.startsAt | date:'HH:mm' }}</td>
                <td class="px-5 py-3 text-gray-900">{{ a.customerName }}</td>
                <td class="px-5 py-3 text-gray-600">{{ a.serviceName }}</td>
                <td class="px-5 py-3 text-gray-600">{{ a.barberName }}</td>
                <td class="px-5 py-3 text-right">{{ a.servicePrice | currency:'COP':'symbol':'1.0-0' }}</td>
                <td class="px-5 py-3 text-center">
                  <span class="text-xs px-2 py-0.5 rounded-full" [class]="statusClass(a.status)">{{ a.status }}</span>
                </td>
                <td class="px-5 py-3 text-right">
                  @if (a.status === 'Pending' || a.status === 'Confirmed') {
                    <button (click)="cancel(a)" class="text-xs text-red-500 hover:underline mr-2">Cancelar</button>
                    <button (click)="noShow(a)" class="text-xs text-orange-500 hover:underline">No-show</button>
                  }
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="7" class="text-center py-10 text-gray-400">Sin citas para este día.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal nueva cita -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg">
            <h3 class="text-lg font-semibold mb-5">Nueva cita</h3>
            <div class="space-y-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Cliente</label>
                <select [(ngModel)]="bookForm.customerId" class="w-full border rounded-lg px-4 py-2 text-sm">
                  <option value="">Seleccionar cliente</option>
                  @for (c of customersList(); track c.id) {
                    <option [value]="c.id">{{ c.fullName }} — {{ c.phone }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Servicio</label>
                <select [(ngModel)]="bookForm.serviceId" (ngModelChange)="onServiceChange()" class="w-full border rounded-lg px-4 py-2 text-sm">
                  <option value="">Seleccionar servicio</option>
                  @for (s of servicesList(); track s.id) {
                    <option [value]="s.id">{{ s.name }} ({{ s.durationMinutes }} min — {{ s.price | currency:'COP':'symbol':'1.0-0' }})</option>
                  }
                </select>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Barbero</label>
                <select [(ngModel)]="bookForm.barberId" (ngModelChange)="onBarberChange()" class="w-full border rounded-lg px-4 py-2 text-sm">
                  <option value="">Seleccionar barbero</option>
                  @for (b of barbers(); track b.id) {
                    <option [value]="b.id">{{ b.displayName }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Fecha</label>
                <input [(ngModel)]="bookForm.date" (ngModelChange)="loadSlots()" type="date" class="w-full border rounded-lg px-4 py-2 text-sm" />
              </div>
              @if (availableSlots().length > 0) {
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">Horario disponible</label>
                  <div class="grid grid-cols-4 gap-2">
                    @for (slot of availableSlots(); track slot.startsAt) {
                      <button (click)="bookForm.startsAt = slot.startsAt"
                        [class]="bookForm.startsAt === slot.startsAt ? 'bg-indigo-600 text-white' : 'bg-gray-50 hover:bg-indigo-50 text-gray-700'"
                        class="text-xs py-2 rounded-lg border transition">
                        {{ slot.startsAt | date:'HH:mm' }}
                      </button>
                    }
                  </div>
                </div>
              }
              <input [(ngModel)]="bookForm.notes" placeholder="Notas (opcional)" class="w-full border rounded-lg px-4 py-2 text-sm" />
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button (click)="showModal.set(false)" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button (click)="book()" class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Confirmar cita</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AppointmentsPageComponent implements OnInit {
  private aptsApi = inject(AppointmentsApiService);
  private barbersApi = inject(BarbersApiService);
  private servicesApi = inject(ServicesApiService);
  private customersApi = inject(CustomersApiService);

  appointments = signal<AppointmentDto[]>([]);
  barbers = signal<BarberDto[]>([]);
  servicesList = signal<ServiceDto[]>([]);
  customersList = signal<CustomerDto[]>([]);
  availableSlots = signal<SlotDto[]>([]);

  selectedDate = new Date().toISOString().split('T')[0];
  selectedBarber = '';
  showModal = signal(false);
  bookForm: { customerId: string; barberId: string; serviceId: string; date: string; startsAt: string; notes: string } =
    { customerId: '', barberId: '', serviceId: '', date: '', startsAt: '', notes: '' };

  ngOnInit() {
    this.load();
    this.barbersApi.list().subscribe(b => this.barbers.set(b));
    this.servicesApi.list().subscribe(s => this.servicesList.set(s));
    this.customersApi.list(undefined, 1, 100).subscribe(r => this.customersList.set(r.items));
  }

  load() {
    const from = new Date(this.selectedDate + 'T00:00:00').toISOString();
    const to = new Date(this.selectedDate + 'T23:59:59').toISOString();
    this.aptsApi.list(from, to, this.selectedBarber || undefined).subscribe(a => this.appointments.set(a));
  }

  openNew() {
    this.bookForm = { customerId: '', barberId: '', serviceId: '', date: this.selectedDate, startsAt: '', notes: '' };
    this.availableSlots.set([]);
    this.showModal.set(true);
  }

  onServiceChange() { this.loadSlots(); }
  onBarberChange() { this.loadSlots(); }

  loadSlots() {
    if (!this.bookForm.barberId || !this.bookForm.serviceId || !this.bookForm.date) return;
    this.aptsApi.availableSlots(this.bookForm.barberId, this.bookForm.serviceId, this.bookForm.date).subscribe(s => this.availableSlots.set(s));
  }

  book() {
    if (!this.bookForm.customerId || !this.bookForm.startsAt) return;
    this.aptsApi.book({
      customerId: this.bookForm.customerId,
      barberId: this.bookForm.barberId,
      serviceId: this.bookForm.serviceId,
      startsAt: this.bookForm.startsAt,
      notes: this.bookForm.notes || undefined
    }).subscribe(() => { this.showModal.set(false); this.load(); });
  }

  cancel(a: AppointmentDto) {
    const reason = prompt('Motivo de cancelación:');
    if (!reason) return;
    this.aptsApi.cancel(a.id, reason, false).subscribe(() => this.load());
  }

  noShow(a: AppointmentDto) {
    if (!confirm('¿Marcar como no-show?')) return;
    this.aptsApi.markNoShow(a.id).subscribe(() => this.load());
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
