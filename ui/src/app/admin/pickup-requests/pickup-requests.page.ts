import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { BusinessService, Pickup } from '../../core/business.service';
import { Profile, ProfileService } from '../../core/profile.service';
import { AdminSidebarComponent, AdminView } from '../../shared/admin-sidebar.component';
import {
  CdnTableActionsDirective,
  CdnTableCardDirective,
  CdnTableCellDirective,
  CdnTableComponent
} from '../../shared/components/cdn-table/cdn-table.component';
import { ActionsComponent } from '../../shared/components/actions/actions.component';
import { QueryBarComponent, QueryFilter } from '../../shared/components/query-bar/query-bar.component';
import { ActionMenuItem } from '../../shared/interfaces/actions.interface';
import { CdnTableColumn } from '../../shared/interfaces/cdn-table.interface';

@Component({
  selector: 'app-pickup-requests-page',
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
  templateUrl: './pickup-requests.page.html',
  styleUrls: ['./pickup-requests.page.scss']
})
export class PickupRequestsPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly api = inject(BusinessService);
  readonly profileApi = inject(ProfileService);
  readonly router = inject(Router);

  profile?: Profile;
  pickups: Pickup[] = [];
  error = '';
  message = '';
  profileMenu = false;

  search = '';
  selectedStatus = '';
  viewMode: 'table' | 'card' = 'table';
  pageSize = 10;

  readonly statuses = [
    'SUBMITTED',
    'CONFIRMED',
    'SCHEDULED',
    'ASSIGNED',
    'ON_THE_WAY',
    'COLLECTED',
    'COMPLETED',
    'REJECTED',
    'CANCELLED',
    'UNABLE_TO_COLLECT'
  ];

  readonly filters: QueryFilter[] = this.statuses.map((status) => ({
    label: this.prettyStatus(status),
    value: status
  }));

  readonly columns: CdnTableColumn<Pickup>[] = [
    { key: 'request', header: 'Request' },
    { key: 'seller', header: 'Seller' },
    { key: 'seller_email', header: 'Email' },
    { key: 'preferred_date', header: 'Date' },
    { key: 'estimated_amount', header: 'Amount' },
    { key: 'status', header: 'Status' }
  ];

  get initials(): string {
    return (this.profile?.full_name || this.auth.session?.fullName || 'AD')
      .split(' ')
      .map((name) => name[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  get filteredPickups(): Pickup[] {
    const query = this.search.trim().toLowerCase();

    return this.pickups.filter((pickup) => {
      const matchesSearch = !query || [
        pickup.id,
        pickup.seller_name,
        pickup.seller_email
      ].some((value) => String(value || '').toLowerCase().includes(query));

      const matchesStatus = !this.selectedStatus || pickup.status === this.selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      [this.profile, this.pickups] = await Promise.all([
        this.profileApi.get(),
        this.api.pickups()
      ]);
    } catch {
      this.error = 'Could not load pickup requests.';
    }
  }

  navigateView(view: AdminView): void {
    if (view === 'dashboard') {
      void this.router.navigateByUrl('/admin/dashboard');
      return;
    }

    if (view === 'staff') {
      void this.router.navigateByUrl('/admin/staff');
    }
  }

  getPickupActions(pickup: Pickup): ActionMenuItem[] {
    return [
      {
        id: 'view',
        label: 'View',
        action: () => this.openDetails(pickup)
      },
      {
        id: 'assign',
        label: 'Assign Staff',
        action: () => this.openAssignment(pickup)
      },
      {
        id: 'status',
        label: `Move to ${this.nextStatusLabel(pickup.status)}`,
        action: () => void this.advanceStatus(pickup)
      }
    ];
  }

  async advanceStatus(pickup: Pickup): Promise<void> {
    const currentIndex = this.statuses.indexOf(pickup.status);
    const nextStatus = this.statuses[Math.min(this.statuses.length - 1, currentIndex + 1)] || 'CONFIRMED';

    try {
      await this.api.updateAdminStatus(pickup.id, nextStatus);
      pickup.status = nextStatus;
      this.message = 'Pickup status updated.';
    } catch {
      this.error = 'Could not update pickup status.';
    }
  }

  openAssignment(pickup: Pickup): void {
    void this.router.navigate(['/admin/pickups', pickup.id, 'assign']);
  }

  openDetails(pickup: Pickup): void {
    void this.router.navigate(['/admin/pickups', pickup.id, 'view']);
  }

  nextStatusLabel(status: string): string {
    const currentIndex = this.statuses.indexOf(status);
    const nextStatus = this.statuses[Math.min(this.statuses.length - 1, currentIndex + 1)] || 'CONFIRMED';
    return this.prettyStatus(nextStatus);
  }

  prettyStatus(status: string): string {
    return status
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
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
