import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ServiceDto {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  currency: string;
  description?: string;
  category?: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ServicesApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/services`;

  list() { return this.http.get<ServiceDto[]>(this.base); }
  create(body: Omit<ServiceDto, 'id' | 'currency' | 'isActive'>) { return this.http.post<ServiceDto>(this.base, body); }
  update(id: string, body: Partial<ServiceDto>) { return this.http.put<ServiceDto>(`${this.base}/${id}`, body); }
  delete(id: string) { return this.http.delete(`${this.base}/${id}`); }
}
