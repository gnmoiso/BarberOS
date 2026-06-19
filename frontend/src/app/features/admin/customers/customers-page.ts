import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersApiService, CustomerDto } from '../../../core/api/customers.service';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Clientes</h2>
        <button (click)="openNew()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Nuevo cliente
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 p-4">
        <input [(ngModel)]="searchQuery" (ngModelChange)="search()" placeholder="Buscar por nombre o teléfono..."
          class="w-full text-sm border-0 outline-none" />
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-5 py-3 text-left">Nombre</th>
              <th class="px-5 py-3 text-left">Teléfono</th>
              <th class="px-5 py-3 text-left">Email</th>
              <th class="px-5 py-3 text-left">Última visita</th>
              <th class="px-5 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (c of customers(); track c.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-5 py-3 font-medium text-gray-900">{{ c.fullName }}</td>
                <td class="px-5 py-3 text-gray-600">{{ c.phone }}</td>
                <td class="px-5 py-3 text-gray-500">{{ c.email ?? '—' }}</td>
                <td class="px-5 py-3 text-gray-500">{{ c.lastVisitAt ? (c.lastVisitAt | date:'dd/MM/yyyy') : 'Sin visitas' }}</td>
                <td class="px-5 py-3 text-center">
                  @if (c.isBlocked) {
                    <span class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Bloqueado</span>
                  } @else {
                    <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Activo</span>
                  }
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="5" class="text-center py-10 text-gray-400">Sin clientes.</td></tr>
            }
          </tbody>
        </table>
        <div class="p-4 flex justify-between text-sm text-gray-500">
          <span>Total: {{ total() }}</span>
          <div class="flex gap-2">
            <button (click)="prevPage()" [disabled]="page() === 1" class="px-3 py-1 border rounded disabled:opacity-40">‹</button>
            <span class="px-3 py-1">{{ page() }}</span>
            <button (click)="nextPage()" [disabled]="page() * size >= total()" class="px-3 py-1 border rounded disabled:opacity-40">›</button>
          </div>
        </div>
      </div>

      @if (showModal()) {
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm">
            <h3 class="text-lg font-semibold mb-5">Nuevo cliente</h3>
            <div class="space-y-4">
              <input [(ngModel)]="form.fullName" placeholder="Nombre completo *" class="w-full border rounded-lg px-4 py-2 text-sm" />
              <input [(ngModel)]="form.phone" placeholder="Teléfono *" class="w-full border rounded-lg px-4 py-2 text-sm" />
              <input [(ngModel)]="form.email" placeholder="Email" class="w-full border rounded-lg px-4 py-2 text-sm" />
              <input [(ngModel)]="form.whatsappPhone" placeholder="WhatsApp" class="w-full border rounded-lg px-4 py-2 text-sm" />
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button (click)="showModal.set(false)" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button (click)="save()" class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Guardar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CustomersPageComponent implements OnInit {
  private api = inject(CustomersApiService);

  customers = signal<CustomerDto[]>([]);
  total = signal(0);
  page = signal(1);
  size = 20;
  searchQuery = '';
  showModal = signal(false);
  form: Partial<CustomerDto> = {};

  ngOnInit() { this.load(); }

  load() {
    this.api.list(this.searchQuery || undefined, this.page(), this.size).subscribe(r => {
      this.customers.set(r.items);
      this.total.set(r.total);
    });
  }

  search() { this.page.set(1); this.load(); }
  prevPage() { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage() { this.page.update(p => p + 1); this.load(); }
  openNew() { this.form = {}; this.showModal.set(true); }
  save() {
    this.api.create({ fullName: this.form.fullName!, phone: this.form.phone!, email: this.form.email, whatsappPhone: this.form.whatsappPhone }).subscribe(() => {
      this.showModal.set(false);
      this.load();
    });
  }
}
