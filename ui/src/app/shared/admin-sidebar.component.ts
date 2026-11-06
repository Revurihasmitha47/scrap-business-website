import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export type AdminView = 'dashboard' | 'pickups' | 'categories' | 'rates' | 'staff' | 'sellers' | 'reports' | 'profile';

type AdminNavItem = {
  label: string;
  icon: string;
  view?: AdminView;
  route?: string;
  queryParams?: Record<string, string>;
};

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <button class="mobile-nav-toggle admin-mobile-nav-toggle" type="button" aria-label="Open navigation" [attr.aria-expanded]="mobileOpen" (click)="mobileOpen = !mobileOpen">☰</button>
    <div class="mobile-nav-backdrop" *ngIf="mobileOpen" (click)="mobileOpen = false"></div>
    <aside class="admin-sidebar admin-shared-sidebar" [class.mobile-open]="mobileOpen">
      <a routerLink="/admin/dashboard" class="admin-brand">
        <span class="admin-brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path [attr.d]="iconPath('brand')" /></svg></span>
        ScrapFlow
      </a>
      <nav aria-label="Admin navigation">
        <ng-container *ngFor="let item of items">
          <a *ngIf="item.route; else viewItem" [routerLink]="item.route" [queryParams]="item.queryParams" [class.active]="isItemActive(item)" (click)="mobileOpen = false">
            <span class="admin-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path [attr.d]="iconPath(item.icon)" /></svg></span>
            <span>{{ item.label }}</span>
          </a>
          <ng-template #viewItem>
            <button type="button" [class.active]="activeView === item.view" (click)="select(item); mobileOpen = false">
              <span class="admin-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path [attr.d]="iconPath(item.icon)" /></svg></span>
              <span>{{ item.label }}</span>
            </button>
          </ng-template>
        </ng-container>
      </nav>
      <button class="admin-logout" type="button" (click)="mobileOpen = false; logout()">
        <span class="admin-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path [attr.d]="iconPath('logout')" /></svg></span>
        <span>Logout</span>
      </button>
    </aside>
  `
})
export class AdminSidebarComponent {
  @Input() activeView: AdminView = 'dashboard';
  @Output() viewChange = new EventEmitter<AdminView>();
  mobileOpen = false;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly items: AdminNavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', view: 'dashboard', route: '/admin/dashboard' },
    { label: 'Pickup Requests', icon: 'requests', view: 'pickups', route: '/admin/pickups' },
    { label: 'Scrap Categories', icon: 'categories', view: 'categories', route: '/admin/categories' },
    { label: 'Scrap Rates', icon: 'rates', view: 'rates', route: '/admin/rates' },
    { label: 'Staff', icon: 'staff', view: 'staff', route: '/admin/staff' },
    { label: 'Sellers', icon: 'sellers', view: 'sellers', route: '/admin/sellers' },
    { label: 'Reports', icon: 'reports', view: 'reports', route: '/admin/dashboard', queryParams: { view: 'reports' } },
    { label: 'Email Configuration', icon: 'email', route: '/admin/email/configuration' },
    { label: 'Email Templates', icon: 'email', route: '/admin/email/templates' }
  ];

  select(item: AdminNavItem): void { if (item.view) this.viewChange.emit(item.view); }

  isItemActive(item: AdminNavItem): boolean {
    return this.activeView === item.view || !!item.route?.includes(`view=${item.view}`) && this.router.url.includes(`view=${item.view}`);
  }

  iconPath(icon: string): string {
    const paths: Record<string, string> = {
      brand: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4 5 5h-3v6h-4v-6H7l5-5Z',
      dashboard: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
      requests: 'M5 4h14v16H5V4Zm3 4h8M8 12h8M8 16h5',
      categories: 'M4 5h16M4 12h16M4 19h16',
      rates: 'M5 19V9m7 10V5m7 14v-7',
      staff: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19a5 5 0 0 1 10 0m1 0a4 4 0 0 1 8 0',
      sellers: 'M12 3 4 8l8 5 8-5-8-5Zm-8 9 8 5 8-5M4 17l8 5 8-5',
      reports: 'M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-3', email: 'M3 5h18v14H3V5Zm1 1 8 6 8-6',
      logout: 'M10 5H5v14h5m5-4 4-3-4-3m4 3H9'
    };
    return paths[icon] || paths['dashboard'];
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/sign-in');
  }
}
