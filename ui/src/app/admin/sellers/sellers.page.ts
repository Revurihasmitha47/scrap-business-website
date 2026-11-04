import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { BusinessService } from '../../core/business.service';
import { AdminSidebarComponent, AdminView } from '../../shared/admin-sidebar.component';
import { ActionsComponent } from '../../shared/components/actions/actions.component';
import {
  CdnTableActionsDirective,
  CdnTableCardDirective,
  CdnTableCellDirective,
  CdnTableComponent
} from '../../shared/components/cdn-table/cdn-table.component';
import { QueryBarComponent } from '../../shared/components/query-bar/query-bar.component';
import { ActionMenuItem } from '../../shared/interfaces/actions.interface';
import { CdnTableColumn } from '../../shared/interfaces/cdn-table.interface';

@Component({
  selector: 'app-sellers-page',
  standalone: true,
  imports: [
    CommonModule,
    AdminSidebarComponent,
    QueryBarComponent,
    CdnTableComponent,
    CdnTableCellDirective,
    CdnTableActionsDirective,
    CdnTableCardDirective,
    ActionsComponent
  ],
  templateUrl: './sellers.page.html',
  styleUrls: ['./sellers.page.scss']
})
export class SellersPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly api = inject(BusinessService);
  readonly router = inject(Router);

  sellers: any[] = [];
  search = '';
  filter = '';
  viewMode: 'table' | 'card' = 'table';
  profileMenu = false;
  error = '';
  selectedSeller: any;

  readonly filters = [
    { label: 'Home Seller', value: 'HOME_SELLER' },
    { label: 'Bulk Seller', value: 'BULK_SELLER' }
  ];

  readonly columns: CdnTableColumn<any>[] = [
    { key: 'name', header: 'Seller' },
    { key: 'email', header: 'Email' },
    { key: 'type', header: 'Seller Type' },
    { key: 'requests', header: 'Requests' },
    { key: 'last_request', header: 'Last Request' }
  ];

  get initials(): string {
    return (this.auth.session?.fullName || 'Admin')
      .split(' ')
      .map((name) => name[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  get filteredSellers(): any[] {
    const query = this.search.trim().toLowerCase();

    return this.sellers.filter((seller) => {
      const matchesQuery = !query ||
        `${seller.name} ${seller.email} ${seller.type}`
          .toLowerCase()
          .includes(query);
      const matchesFilter = !this.filter || seller.type === this.filter;

      return matchesQuery && matchesFilter;
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const pickups = await this.api.pickups();
      const sellerMap = new Map<string, any>();

      pickups.forEach((pickup: any) => {
        const key = pickup.seller_id || pickup.seller_email;
        const current = sellerMap.get(key) || {
          id: key,
          name: pickup.seller_name || 'Seller',
          email: pickup.seller_email || '',
          type: pickup.seller_type || 'Seller',
          requests: 0,
          last_request: pickup.preferred_date
        };

        current.requests += 1;

        if (String(pickup.preferred_date || '') > String(current.last_request || '')) {
          current.last_request = pickup.preferred_date;
        }

        sellerMap.set(key, current);
      });

      this.sellers = [...sellerMap.values()];
    } catch (error) {
      this.error = this.auth.errorMessage(error, 'Could not load sellers.');
    }
  }

  sellerActions(seller: any): ActionMenuItem[] {
    return [
      {
        id: 'view',
        label: 'View',
        icon: '◉',
        color: '#159b63',
        action: () => this.selectedSeller = seller
      }
    ];
  }

  closeView(): void {
    this.selectedSeller = undefined;
  }

  navigateView(view: AdminView): void {
    const paths: Record<string, string> = {
      dashboard: '/admin/dashboard',
      pickups: '/admin/pickups',
      categories: '/admin/categories',
      rates: '/admin/rates',
      staff: '/admin/staff',
      sellers: '/admin/sellers'
    };

    if (paths[view]) {
      void this.router.navigateByUrl(paths[view]);
    }
  }

  openProfile(): void {
    this.profileMenu = false;
    void this.router.navigateByUrl('/profile');
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    void this.router.navigateByUrl('/sign-in');
  }
}
