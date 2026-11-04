import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Category { id: string; name: string; description?: string; is_active?: boolean; created_at?: string; }
export interface Rate extends Category { rate: number; home_seller_rate: number; bulk_seller_rate: number; effective_from?: string; }
export interface Pickup { id: string; status: string; seller_id: string; seller_name?: string; seller_email?: string; seller_phone?: string; seller_type?: string; pickup_address: unknown; preferred_date: string; preferred_time?: string; estimated_amount: number; estimated_weight?: number; actual_amount?: number; assigned_staff_id?: string; actual_weight?: number; collection_notes?: string; seller_notes?: string; photo_url?: string; }
export interface DashboardSummary { newRequests: number; confirmedPickups: number; inProgressPickups: number; completedPickups: number; activeStaff: number; homeSellers: number; bulkSellers: number; recentRequests: Pickup[]; staffOverview: any[]; rateOverview: Rate[]; }

@Injectable({ providedIn: 'root' })
export class BusinessService {
  constructor(private readonly http: HttpClient) {}
  adminDashboard() { return firstValueFrom(this.http.get<DashboardSummary>('/api/admin/dashboard', { withCredentials: true })); }
  categories() { return firstValueFrom(this.http.get<Category[]>('/api/categories', { withCredentials: true })); }
  adminCategories() { return firstValueFrom(this.http.get<Category[]>('/api/admin/categories', { withCredentials: true })); }
  rates() { return firstValueFrom(this.http.get<Rate[]>('/api/rates', { withCredentials: true })); }
  pickups() { return firstValueFrom(this.http.get<Pickup[]>('/api/pickups', { withCredentials: true })); }
  pagedAdminPickups(params: Record<string, string | number> = {}) { return firstValueFrom(this.http.get<{items: Pickup[]; page: number; size: number; totalItems: number; totalPages: number}>('/api/admin/pickups', { params: params as any, withCredentials: true })); }
  staff() { return firstValueFrom(this.http.get<any[]>('/api/admin/staff', { withCredentials: true })); }
  updateStaff(id: string, body: unknown) { return firstValueFrom(this.http.patch(`/api/admin/staff/${id}`, body, { withCredentials: true })); }
  deleteStaff(id: string) { return firstValueFrom(this.http.delete(`/api/admin/staff/${id}`, { withCredentials: true })); }
  inviteStaff(email: string, details: Record<string, unknown> = {}) { return firstValueFrom(this.http.post<any>('/api/admin/staff/invite', { email, ...details }, { withCredentials: true })); }
  createCategory(body: string | { name: string; description?: string; isActive: boolean }) { const payload = typeof body === 'string' ? { name: body } : body; return firstValueFrom(this.http.post('/api/admin/categories', payload, { withCredentials: true })); }
  updateCategory(id: string, body: { name: string; description?: string; isActive: boolean }) { return firstValueFrom(this.http.patch(`/api/admin/categories/${id}`, body, { withCredentials: true })); }
  deleteCategory(id: string) { return firstValueFrom(this.http.delete(`/api/admin/categories/${id}`, { withCredentials: true })); }
  publishRates(body: unknown) { return firstValueFrom(this.http.post('/api/admin/rates', body, { withCredentials: true })); }
  deleteRate(categoryId: string) { return firstValueFrom(this.http.delete(`/api/admin/rates/${categoryId}`, { withCredentials: true })); }
  createPickup(body: unknown, idempotencyKey?: string) { return firstValueFrom(this.http.post('/api/pickups', body, { withCredentials: true, headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined })); }
  uploadPickupPhotos(id: string, files: File[]) { const form = new FormData(); files.forEach(file => form.append('files', file, file.name)); return firstValueFrom(this.http.post<any[]>(`/api/pickups/${id}/photos`, form, { withCredentials: true })); }
  cancelPickup(id: string) { return firstValueFrom(this.http.post(`/api/pickups/${id}/cancel`, {}, { withCredentials: true })); }
  updateAdminStatus(id: string, status: string, reason = '') { return firstValueFrom(this.http.post(`/api/admin/pickups/${id}/status`, { status, reason }, { withCredentials: true })); }
  assign(id: string, staffId: string) { return firstValueFrom(this.http.post(`/api/admin/pickups/${id}/assign`, { staffId }, { withCredentials: true })); }
  assignmentContext(id: string) { return firstValueFrom(this.http.get<any>(`/api/admin/pickups/${id}/assignment-context`, { withCredentials: true })); }
  assignableStaff(id: string, params: Record<string, string> = {}) { return firstValueFrom(this.http.get<any[]>(`/api/admin/pickups/${id}/assignable-staff`, { params, withCredentials: true })); }
  assignStaff(id: string, body: { staffId: string; note?: string; reason?: string }) { return firstValueFrom(this.http.post<any>(`/api/admin/pickups/${id}/assign`, body, { withCredentials: true })); }
  assignmentHistory(id: string) { return firstValueFrom(this.http.get<any[]>(`/api/admin/pickups/${id}/assignment-history`, { withCredentials: true })); }
  collect(id: string, actualWeight: number, notes: string) { return firstValueFrom(this.http.post(`/api/staff/pickups/${id}/collect`, { actualWeight, notes }, { withCredentials: true })); }
  unable(id: string, reason: string) { return firstValueFrom(this.http.post(`/api/staff/pickups/${id}/unable`, { status: 'UNABLE_TO_COLLECT', reason }, { withCredentials: true })); }
  updateStaffStatus(id: string, status: string) { return firstValueFrom(this.http.post(`/api/staff/pickups/${id}/status`, { status }, { withCredentials: true })); }
  sellerDashboard() { return firstValueFrom(this.http.get<any>('/api/seller/dashboard', { withCredentials: true })); }
  sellerRequestDetail(id: string) { return firstValueFrom(this.http.get<any>(`/api/seller/requests/${id}`, { withCredentials: true })); }
  sellerHistory() { return firstValueFrom(this.http.get<Pickup[]>('/api/seller/history', { withCredentials: true })); }
  cancelSellerRequest(id: string, reason: string) { return firstValueFrom(this.http.post<any>(`/api/seller/requests/${id}/cancel`, { reason }, { withCredentials: true })); }
  sellerNotifications() { return firstValueFrom(this.http.get<any[]>('/api/seller/notifications', { withCredentials: true })); }
  markSellerNotificationRead(id: string) { return firstValueFrom(this.http.patch(`/api/seller/notifications/${id}/read`, {}, { withCredentials: true })); }
  staffMe() { return firstValueFrom(this.http.get<any>('/api/staff/me', { withCredentials: true })); }
  staffPickups(params: Record<string, string> = {}) { return firstValueFrom(this.http.get<Pickup[]>('/api/staff/pickups', { params, withCredentials: true })); }
  staffPickupDetail(id: string) { return firstValueFrom(this.http.get<any>(`/api/staff/pickups/${id}`, { withCredentials: true })); }
  startStaffPickup(id: string) { return firstValueFrom(this.http.post<any>(`/api/staff/pickups/${id}/start`, {}, { withCredentials: true })); }
  completeStaffPickup(id: string, body: unknown) { return firstValueFrom(this.http.post<any>(`/api/staff/pickups/${id}/complete`, body, { withCredentials: true })); }
  addStaffPayments(id: string, body: unknown) { return firstValueFrom(this.http.post<any>(`/api/staff/pickups/${id}/payments`, body, { withCredentials: true })); }
  unableStaffPickup(id: string, reason: string) { return firstValueFrom(this.http.post<any>(`/api/staff/pickups/${id}/unable-to-collect`, { reason }, { withCredentials: true })); }
  staffHistory() { return firstValueFrom(this.http.get<Pickup[]>('/api/staff/history', { withCredentials: true })); }
  staffNotifications() { return firstValueFrom(this.http.get<any[]>('/api/staff/notifications', { withCredentials: true })); }
  markStaffNotificationRead(id: string) { return firstValueFrom(this.http.patch(`/api/staff/notifications/${id}/read`, {}, { withCredentials: true })); }
}
