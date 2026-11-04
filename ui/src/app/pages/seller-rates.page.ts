import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { BusinessService, Rate } from '../core/business.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="seller-shell">
      <aside class="seller-sidebar">
        <a routerLink="/seller/dashboard" class="seller-brand"><span>♻</span><strong>Scrap<span>Flow</span><small>{{ sellerLabel }}</small></strong></a>
        <nav>
          <a routerLink="/seller/dashboard" routerLinkActive="active">⌂ <span>Dashboard</span></a>
          <a routerLink="/seller/rates" routerLinkActive="active">▥ <span>Current Rates</span></a>
          <a routerLink="/seller/request" routerLinkActive="active">▣ <span>{{ isBulk ? 'Request Bulk Pickup' : 'Request Pickup' }}</span></a>
          <a routerLink="/seller/requests">▤ <span>My Requests</span></a>
          <a routerLink="/seller/history">◷ <span>Pickup History</span></a>
          <a *ngIf="isBulk" routerLink="/seller/profile">▦ <span>Business Profile</span></a>
          <a routerLink="/seller/notifications">♧ <span>Notifications</span></a>
          <a routerLink="/seller/profile">♙ <span>Profile</span></a>
        </nav>
        <button class="seller-logout" (click)="logout()">↪ <span>Logout</span></button>
      </aside>
      <main class="seller-main">
        <header class="seller-header"><span></span><div><span class="seller-bell">♧</span><span class="request-avatar">{{ initials }}</span><b>{{ auth.session?.fullName || sellerLabel }}</b><small>{{ sellerLabel }}</small></div></header>
        <section class="seller-content">
          <div class="seller-title"><div><p>SCRAPFLOW {{ isBulk ? 'BULK SELLER' : 'HOME SELLER' }}</p><h1>Current Scrap Rates</h1><span>View the rates applicable to your seller account.</span></div></div>
          <div class="seller-alert error" *ngIf="error">{{ error }}</div>
          <section class="seller-card rate-page-intro"><h2>{{ sellerLabel }} rates</h2><p>Only active categories and rates for your account type are shown. Rates are read-only.</p></section>
          <section class="seller-card">
            <div class="seller-card-head"><h2>Current Rates <small>(per kg)</small></h2><span class="seller-muted">Effective rates from the database</span></div>
            <div class="seller-rate-row seller-head"><span>Scrap Category</span><span>Rate (₹/kg)</span><span>Effective from</span></div>
            <div class="seller-rate-row" *ngFor="let rate of rates"><strong>{{ rate.name }}</strong><strong class="rate-value">₹{{ rate.rate | number:'1.0-2' }}</strong><span>{{ rate.effective_from ? (rate.effective_from | date:'mediumDate') : 'Active' }}</span></div>
            <div class="seller-empty" *ngIf="!loading && !rates.length">No active rates are available yet.</div>
            <div class="seller-empty" *ngIf="loading">Loading current rates...</div>
          </section>
        </section>
      </main>
    </div>
  `
})
export class SellerRatesPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(BusinessService);
  private readonly router = inject(Router);
  rates: Rate[] = [];
  error = '';
  loading = true;
  get isBulk() { return this.auth.session?.accountType === 'BULK_SELLER'; }
  get sellerLabel() { return this.isBulk ? 'Bulk Seller' : 'Home Seller'; }
  get initials() { return (this.auth.session?.fullName || this.sellerLabel).slice(0, 1).toUpperCase(); }
  async ngOnInit() { try { this.rates = await this.api.rates(); } catch (error) { this.error = this.auth.errorMessage(error, 'Could not load current rates.'); } finally { this.loading = false; } }
  async logout() { await this.auth.logout(); await this.router.navigateByUrl('/sign-in'); }
}
