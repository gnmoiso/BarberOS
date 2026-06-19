import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicesApiService, ServiceDto } from '../../../core/api/services.service';

@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Servicios</h2>
        <button (click)="openNew()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          + Nuevo servicio
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-5 py-3 text-left">Nombre</th>
              <th class="px-5 py-3 text-left">Categoría</th>
              <th class="px-5 py-3 text-right">Duración</th>
              <th class="px-5 py-3 text-right">Precio</th>
              <th class="px-5 py-3 text-center">Estado</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (s of services(); track s.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-5 py-3 font-medium text-gray-900">{{ s.name }}</td>
                <td class="px-5 py-3 text-gray-500">{{ s.category ?? '—' }}</td>
                <td class="px-5 py-3 text-right">{{ s.durationMinutes }} min</td>
                <td class="px-5 py-3 text-right">{{ s.price | currency:'COP':'symbol':'1.0-0' }}</td>
                <td class="px-5 py-3 text-center">
                  <span class="text-xs px-2 py-0.5 rounded-full" [class]="s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                    {{ s.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-5 py-3 text-right space-x-2">
                  <button (click)="edit(s)" class="text-indigo-600 hover:underline text-xs">Editar</button>
                  <button (click)="remove(s.id)" class="text-red-500 hover:underline text-xs">Eliminar</button>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="6" class="text-center py-10 text-gray-400">Sin servicios. Crea el primero.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
            <h3 class="text-lg font-semibold mb-5">{{ editing() ? 'Editar' : 'Nuevo' }} servicio</h3>
            <div class="space-y-4">
              <input [(ngModel)]="form.name" placeholder="Nombre *" class="w-full border rounded-lg px-4 py-2 text-sm" />
              <input [(ngModel)]="form.category" placeholder="Categoría" class="w-full border rounded-lg px-4 py-2 text-sm" />
              <input [(ngModel)]="form.description" placeholder="Descripción" class="w-full border rounded-lg px-4 py-2 text-sm" />
              <div class="flex gap-3">
                <input [(ngModel)]="form.durationMinutes" type="number" placeholder="Duración (min) *" class="flex-1 border rounded-lg px-4 py-2 text-sm" />
                <input [(ngModel)]="form.price" type="number" placeholder="Precio *" class="flex-1 border rounded-lg px-4 py-2 text-sm" />
              </div>
              @if (editing()) {
                <label class="flex items-center gap-2 text-sm">
                  <input [(ngModel)]="form.isActive" type="checkbox" /> Activo
                </label>
              }
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
export class ServicesPageComponent implements OnInit {
  private api = inject(ServicesApiService);

  services = signal<ServiceDto[]>([]);
  showModal = signal(false);
  editing = signal<string | null>(null);
  form: Partial<ServiceDto> & { isActive: boolean } = { isActive: true };

  ngOnInit() { this.load(); }

  load() {
    this.api.list().subscribe(s => this.services.set(s));
  }

  openNew() {
    this.form = { isActive: true };
    this.editing.set(null);
    this.showModal.set(true);
  }

  edit(s: ServiceDto) {
    this.form = { ...s };
    this.editing.set(s.id);
    this.showModal.set(true);
  }

  save() {
    const body = { name: this.form.name!, durationMinutes: Number(this.form.durationMinutes), price: Number(this.form.price), description: this.form.description, category: this.form.category, isActive: this.form.isActive };
    const op = this.editing()
      ? this.api.update(this.editing()!, body)
      : this.api.create(body);
    op.subscribe(() => { this.showModal.set(false); this.load(); });
  }

  remove(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return;
    this.api.delete(id).subscribe(() => this.load());
  }
}
