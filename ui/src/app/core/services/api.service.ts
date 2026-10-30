import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Me { id: string; full_name: string; phone: string | null; account_type: string; account_status: string; memberships: Membership[]; }
export interface Membership { id: string; client_id: string; membership_role: string; is_active: boolean; }
export interface Client { id: string; name: string; slug: string; is_active: boolean; }
export interface Category { id: string; client_id: string; name: string; is_active: boolean; }
export interface Rate { id: string; client_id: string; category_id: string; category_name: string; rate_per_kg: number; effective_from: string; }
export interface PickupItem { id: string; category_id: string; estimated_quantity: number; actual_weight: number | null; rate_at_pickup: number; line_amount: number | null; }
export interface Pickup { id: string; client_id: string; seller_id: string; estimated_quantity: number; actual_weight: number | null; preferred_date: string; preferred_time: string | null; status: string; final_amount: number | null; pickup_request_items: PickupItem[]; }
export interface Staff { id: string; full_name: string; account_type: string; account_status: string; }

export interface ApiHealth { status: string; service: string; }
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  health(): Observable<ApiHealth> { return this.http.get<ApiHealth>('/api/health'); }
  me(): Observable<Me> { return this.http.get<Me>('/api/me'); }
  clients(): Observable<Client[]> { return this.http.get<Client[]>('/api/clients'); }
  categories(clientId: string): Observable<Category[]> { return this.http.get<Category[]>('/api/categories', { params: { clientId } }); }
  rates(clientId: string): Observable<Rate[]> { return this.http.get<Rate[]>('/api/rates', { params: { clientId } }); }
  pickups(): Observable<Pickup[]> { return this.http.get<Pickup[]>('/api/pickups'); }
  staff(clientId: string): Observable<Staff[]> { return this.http.get<Staff[]>('/api/staff', { params: { clientId } }); }
  submitPickup(body: unknown): Observable<unknown> { return this.http.post('/api/pickups', body); }
  createCategory(body: unknown): Observable<unknown> { return this.http.post('/api/admin/categories', body); }
  createClient(body: unknown): Observable<unknown> { return this.http.post('/api/admin/clients', body); }
  publishRate(body: unknown): Observable<unknown> { return this.http.post('/api/admin/rates', body); }
  assignPickup(id: string, staffUserId: string): Observable<unknown> { return this.http.post(`/api/admin/pickups/${id}/assign`, { staffUserId }); }
  reassignPickup(id: string, staffUserId: string): Observable<unknown> { return this.http.post(`/api/admin/pickups/${id}/reassign`, { staffUserId }); }
  changePickupStatus(id: string, status: string): Observable<unknown> { return this.http.post(`/api/admin/pickups/${id}/status`, { status }); }
  markPickedUp(id: string, itemWeights: unknown[]): Observable<unknown> { return this.http.post(`/api/staff/pickups/${id}/picked-up`, { status: 'PICKED_UP', itemWeights }); }
}
