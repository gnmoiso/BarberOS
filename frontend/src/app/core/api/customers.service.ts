import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface CustomerDto {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  whatsappPhone?: string;
  notes?: string;
  lastVisitAt?: string;
  isBlocked: boolean;
}

export interface PagedResult<T> { items: T[]; total: number; page: number; size: number; }

@Injectable({ providedIn: 'root' })
export class CustomersApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/customers`;

  list(q?: string, page = 1, size = 20) {
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (q) params['q'] = q;
    return this.http.get<PagedResult<CustomerDto>>(this.base, { params });
  }

  create(body: { fullName: string; phone: string; email?: string; whatsappPhone?: string }) {
    return this.http.post<CustomerDto>(this.base, body);
  }
}
