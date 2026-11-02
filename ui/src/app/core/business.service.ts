import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Category { id: string; name: string; }
export interface Rate extends Category { rate: number; home_seller_rate: number; bulk_seller_rate: number; }
export interface Pickup { id: string; status: string; seller_id: string; seller_name?: string; seller_email?: string; pickup_address: unknown; preferred_date: string; preferred_time?: string; estimated_amount: number; actual_amount?: number; assigned_staff_id?: string; actual_weight?: number; collection_notes?: string; }

@Injectable({ providedIn: 'root' })
export class BusinessService {
  constructor(private readonly http: HttpClient) {}
  categories() { return firstValueFrom(this.http.get<Category[]>('/api/categories', { withCredentials: true })); }
  rates() { return firstValueFrom(this.http.get<Rate[]>('/api/rates', { withCredentials: true })); }
  pickups() { return firstValueFrom(this.http.get<Pickup[]>('/api/pickups', { withCredentials: true })); }
  staff() { return firstValueFrom(this.http.get<any[]>('/api/admin/staff', { withCredentials: true })); }
  inviteStaff(email: string) { return firstValueFrom(this.http.post<any>('/api/admin/staff/invite', { email }, { withCredentials: true })); }
  createCategory(name: string) { return firstValueFrom(this.http.post('/api/admin/categories', { name }, { withCredentials: true })); }
  publishRates(body: unknown) { return firstValueFrom(this.http.post('/api/admin/rates', body, { withCredentials: true })); }
  createPickup(body: unknown) { return firstValueFrom(this.http.post('/api/pickups', body, { withCredentials: true })); }
  cancelPickup(id: string) { return firstValueFrom(this.http.post(`/api/pickups/${id}/cancel`, {}, { withCredentials: true })); }
  updateAdminStatus(id: string, status: string, reason = '') { return firstValueFrom(this.http.post(`/api/admin/pickups/${id}/status`, { status, reason }, { withCredentials: true })); }
  assign(id: string, staffId: string) { return firstValueFrom(this.http.post(`/api/admin/pickups/${id}/assign`, { staffId }, { withCredentials: true })); }
  collect(id: string, actualWeight: number, notes: string) { return firstValueFrom(this.http.post(`/api/staff/pickups/${id}/collect`, { actualWeight, notes }, { withCredentials: true })); }
  unable(id: string, reason: string) { return firstValueFrom(this.http.post(`/api/staff/pickups/${id}/unable`, { status: 'UNABLE_TO_COLLECT', reason }, { withCredentials: true })); }
  updateStaffStatus(id: string, status: string) { return firstValueFrom(this.http.post(`/api/staff/pickups/${id}/status`, { status }, { withCredentials: true })); }
}
