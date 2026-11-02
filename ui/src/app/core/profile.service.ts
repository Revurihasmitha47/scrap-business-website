import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Profile { id: string; email: string; full_name: string; middle_name?: string; phone?: string; gender?: string; country?: string; state?: string; city?: string; address_line1?: string; address_line2?: string; zip_code?: string; profile_image_url?: string; account_type: string; account_status: string; created_at?: string; business_name?: string; gstin?: string; approximate_quantity?: number; }
@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private readonly http: HttpClient) {}
  get() { return firstValueFrom(this.http.get<Profile>('/api/profile', { withCredentials: true })); }
  update(body: unknown) { return firstValueFrom(this.http.put<Profile>('/api/profile', body, { withCredentials: true })); }
}
