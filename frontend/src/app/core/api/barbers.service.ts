import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface BarberDto { id: string; displayName: string; phone?: string; photoUrl?: string; isActive: boolean; }
export interface ScheduleSlotDto { weekday: number; startTime: string; endTime: string; }

@Injectable({ providedIn: 'root' })
export class BarbersApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/barbers`;

  list() { return this.http.get<BarberDto[]>(this.base); }
  create(body: { displayName: string; phone?: string }) { return this.http.post<BarberDto>(this.base, body); }
  update(id: string, body: Partial<BarberDto>) { return this.http.put<BarberDto>(`${this.base}/${id}`, body); }
  setSchedule(id: string, slots: ScheduleSlotDto[]) { return this.http.put(`${this.base}/${id}/schedule`, { slots }); }
}
