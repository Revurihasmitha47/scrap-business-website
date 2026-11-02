import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export type AccountType = 'ADMIN' | 'STAFF' | 'HOME_SELLER' | 'BULK_SELLER';
export interface Session { userId: string; email: string; fullName: string; accountType: AccountType; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly subject = new BehaviorSubject<Session | null>(null);
  readonly session$ = this.subject.asObservable();
  constructor(private readonly http: HttpClient) {}

  get session(): Session | null { return this.subject.value; }
  async initialize(): Promise<void> { try { this.subject.next(await firstValueFrom(this.http.get<Session>('/api/auth/session', { withCredentials: true }))); } catch { this.subject.next(null); } }
  async registerSeller(payload: unknown): Promise<void> { await this.createSession(this.http.post<Session>('/api/auth/register', payload, { withCredentials: true })); }
  async registerAdmin(payload: unknown): Promise<void> { await this.createSession(this.http.post<Session>('/api/auth/setup/admin', payload, { withCredentials: true })); }
  async acceptInvite(token: string, fullName: string, password: string): Promise<void> { await this.createSession(this.http.post<Session>('/api/auth/accept-invite', { token, fullName, password }, { withCredentials: true })); }
  async login(email: string, password: string): Promise<void> { await this.createSession(this.http.post<Session>('/api/auth/login', { email, password }, { withCredentials: true })); }
  async setupAvailable(): Promise<boolean> { return (await firstValueFrom(this.http.get<{ available: boolean }>('/api/auth/setup/status'))).available; }
  async logout(): Promise<void> { this.subject.next(null); await firstValueFrom(this.http.post('/api/auth/logout', {}, { withCredentials: true })); }
  errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const message = typeof error.error === 'string' ? error.error : error.error?.message;
      if (message) return message;
      if (error.status === 0) return 'API is unavailable. Start the ScrapFlow backend and try again.';
    }
    return fallback;
  }
  private async createSession(request: import('rxjs').Observable<Session>): Promise<void> { const response = await firstValueFrom(request); this.subject.next(response); }
}
