import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BarbersApiService, BarberDto } from '../../../core/api/barbers.service';

@Component({
  selector: 'app-barbers-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Barberos</h2>
        <button (click)="openNew()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Nuevo barbero
        </button>
      </div>

      <div class="grid grid-cols-3 gap-4">
        @for (b of barbers(); track b.id) {
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div class="flex items-center gap-4 mb-3">
              <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl">✂️</div>
              <div>
                <p class="font-semibold text-gray-900">{{ b.displayName }}</p>
                <p class="text-sm text-gray-500">{{ b.phone ?? 'Sin teléfono' }}</p>
              </div>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full" [class]="b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
              {{ b.isActive ? 'Activo' : 'Inactivo' }}
            </span>
            <div class="mt-3 flex gap-2">
              <button (click)="edit(b)" class="text-xs text-indigo-600 hover:underline">Editar</button>
            </div>
          </div>
        }
        @empty {
          <div class="col-span-3 text-center py-16 text-gray-400">Sin barberos. Crea el primero.</div>
        }
      </div>

      @if (showModal()) {
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm">
            <h3 class="text-lg font-semibold mb-5">{{ editing() ? 'Editar' : 'Nuevo' }} barbero</h3>
            <div class="space-y-4">
              <input [(ngModel)]="form.displayName" placeholder="Nombre *" class="w-full border rounded-lg px-4 py-2 text-sm" />
              <input [(ngModel)]="form.phone" placeholder="Teléfono" class="w-full border rounded-lg px-4 py-2 text-sm" />
              @if (editing()) {
                <label class="flex items-center gap-2 text-sm"><input [(ngModel)]="form.isActive" type="checkbox" /> Activo</label>
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
export class BarbersPageComponent implements OnInit {
  private api = inject(BarbersApiService);

  barbers = signal<BarberDto[]>([]);
  showModal = signal(false);
  editing = signal<string | null>(null);
  form: Partial<BarberDto> = {};

  ngOnInit() { this.load(); }
  load() { this.api.list().subscribe(b => this.barbers.set(b)); }

  openNew() { this.form = {}; this.editing.set(null); this.showModal.set(true); }
  edit(b: BarberDto) { this.form = { ...b }; this.editing.set(b.id); this.showModal.set(true); }

  save() {
    const op = this.editing()
      ? this.api.update(this.editing()!, { displayName: this.form.displayName!, phone: this.form.phone, isActive: this.form.isActive })
      : this.api.create({ displayName: this.form.displayName!, phone: this.form.phone });
    op.subscribe(() => { this.showModal.set(false); this.load(); });
  }
}
