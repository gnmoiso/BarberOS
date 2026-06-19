import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AppointmentDto {
  id: string;
  customerId: string;
  customerName: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  startsAt: string;
  endsAt: string;
  status: string;
  notes?: string;
  penaltyAmount?: number;
}

export interface SlotDto { startsAt: string; endsAt: string; }

@Injectable({ providedIn: 'root' })
export class AppointmentsApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/appointments`;

  list(from: string, to: string, barberId?: string) {
    const params: Record<string, string> = { from, to };
    if (barberId) params['barberId'] = barberId;
    return this.http.get<AppointmentDto[]>(this.base, { params });
  }

  availableSlots(barberId: string, serviceId: string, date: string) {
    return this.http.get<SlotDto[]>(`${this.base}/available-slots`, {
      params: { barberId, serviceId, date }
    });
  }

  book(body: { customerId: string; barberId: string; serviceId: string; startsAt: string; notes?: string }) {
    return this.http.post<AppointmentDto>(this.base, body);
  }

  cancel(id: string, reason: string, cancelledByBarber = false) {
    return this.http.post<AppointmentDto>(`${this.base}/${id}/cancel`, { reason, cancelledByBarber });
  }

  reschedule(id: string, barberId: string, newStartsAt: string) {
    return this.http.post<AppointmentDto>(`${this.base}/${id}/reschedule`, { barberId, newStartsAt });
  }

  markNoShow(id: string) {
    return this.http.post<AppointmentDto>(`${this.base}/${id}/no-show`, {});
  }
}
