import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { BusinessService, Pickup } from '../core/business.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="seller-shell"><aside class="seller-sidebar">
      <a routerLink="/seller/dashboard" class="seller-brand"><span>♻</span><strong>Scrap<span>Flow</span><small>{{ sellerLabel }}</small></strong></a>
      <nav><a routerLink="/seller/dashboard" routerLinkActive="active">⌂ <span>Dashboard</span></a><a routerLink="/seller/rates" routerLinkActive="active">▥ <span>Current Rates</span></a><a routerLink="/seller/request" routerLinkActive="active">▣ <span>{{ isBulk ? 'Request Bulk Pickup' : 'Request Pickup' }}</span></a><a routerLink="/seller/requests" routerLinkActive="active">▤ <span>My Requests</span></a><a routerLink="/seller/history" routerLinkActive="active">◷ <span>Pickup History</span></a><a *ngIf="isBulk" routerLink="/seller/profile">▦ <span>Business Profile</span></a><a routerLink="/seller/notifications">♧ <span>Notifications</span></a><a routerLink="/seller/profile">♙ <span>Profile</span></a></nav>
      <button class="seller-logout" (click)="logout()">↪ <span>Logout</span></button>
    </aside><main class="seller-main"><header class="seller-header"><span></span><div><span class="seller-bell">♧</span><span class="request-avatar">{{ initials }}</span><b>{{ auth.session?.fullName || sellerLabel }}</b><small>{{ sellerLabel }}</small></div></header>
      <section class="seller-content"><div class="seller-title"><div><p>SCRAPFLOW {{ isBulk ? 'BULK SELLER' : 'HOME SELLER' }}</p><h1>{{ isHistory ? 'Pickup History' : 'My Requests' }}</h1><span>{{ isHistory ? 'Review your completed and past pickup requests.' : 'Track pickup requests submitted from your account.' }}</span></div></div>
      <div class="seller-alert error" *ngIf="error">{{ error }}</div><section class="seller-card"><div class="seller-card-head"><h2>{{ isHistory ? 'Past Pickups' : 'All Pickup Requests' }}</h2><span class="seller-muted">{{ pickups.length }} record(s)</span></div>
        <div class="seller-request-row seller-head"><span>Request</span><span>Pickup date</span><span>Amount</span><span>Status</span></div>
        <a class="seller-request-row seller-record-link" *ngFor="let pickup of pickups" [routerLink]="['/seller/requests', pickup.id]"><strong>REQ-{{ pickup.id | slice:0:8 }}</strong><span>{{ pickup.preferred_date }}<small>{{ pickup.preferred_time || 'Time not set' }}</small></span><strong>₹{{ pickup.estimated_amount || 0 }}</strong><span class="seller-pill">{{ prettyStatus(pickup.status) }}</span></a>
        <div class="seller-empty" *ngIf="!loading && !pickups.length">{{ isHistory ? 'No pickup history yet.' : 'You have not submitted a pickup request yet.' }}<a class="seller-link-button" routerLink="/seller/request">Create a pickup request</a></div>
        <div class="seller-empty" *ngIf="loading">Loading your requests...</div>
      </section></section></main></div>
  `
})
export class SellerRecordsPageComponent {
  readonly auth = inject(AuthService); private readonly api = inject(BusinessService); private readonly router = inject(Router); private readonly route = inject(ActivatedRoute);
  pickups: Pickup[] = []; error = ''; loading = true;
  get isBulk() { return this.auth.session?.accountType === 'BULK_SELLER'; }
  get sellerLabel() { return this.isBulk ? 'Bulk Seller' : 'Home Seller'; }
  get isHistory() { return this.route.snapshot.routeConfig?.path === 'seller/history'; }
  get initials() { return (this.auth.session?.fullName || this.sellerLabel).slice(0, 1).toUpperCase(); }
  async ngOnInit() { try { this.pickups = this.isHistory ? await this.api.sellerHistory() : await this.api.pickups(); } catch (error) { this.error = this.auth.errorMessage(error, 'Could not load your pickup records.'); } finally { this.loading = false; } }
  prettyStatus(status: string) { return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase()); }
  async logout() { await this.auth.logout(); await this.router.navigateByUrl('/sign-in'); }
}
