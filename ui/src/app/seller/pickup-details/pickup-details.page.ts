import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { BusinessService } from '../../core/business.service';
import { SellerSidebarComponent } from '../shared/seller-sidebar/seller-sidebar.component';
import { SellerHeaderComponent } from '../shared/seller-header/seller-header.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SellerSidebarComponent,
    SellerHeaderComponent,
  ],
  templateUrl: './pickup-details.page.html',
  styleUrls: ['./pickup-details.page.scss'],
})
export class HomeSellerDetailPageComponent {
  readonly auth = inject(AuthService);

  private readonly api = inject(BusinessService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  pickup: any;
  items: any[] = [];
  history: any[] = [];

  error = '';
  cancelReason = '';
  saving = false;

  get canCancel() {
    return ['SUBMITTED', 'CONFIRMED'].includes(this.pickup?.status);
  }

  async ngOnInit() {
    try {
      const requestId = this.route.snapshot.paramMap.get('id');

      if (!requestId) {
        this.error = 'Pickup request ID is missing.';
        return;
      }

      const result = await this.api.sellerRequestDetail(requestId);

      this.pickup = result.pickup;
      this.items = result.items || [];
      this.history = result.history || [];
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        'Could not load this pickup request.',
      );
    }
  }

  pretty(value: string) {
    return (value || 'UNKNOWN')
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  statusClass(status: string) {
    return `status-${(status || 'unknown').toLowerCase().replaceAll('_', '-')}`;
  }

  addressText(value: any) {
    let currentValue = value;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (typeof currentValue === 'string') {
        const text = currentValue.trim();

        if (!text) {
          return 'Address not provided';
        }

        try {
          currentValue = JSON.parse(text);
          continue;
        } catch {
          return text;
        }
      }

      if (!currentValue || typeof currentValue !== 'object') {
        return currentValue == null
          ? 'Address not provided'
          : String(currentValue);
      }

      if (currentValue.text) {
        return String(currentValue.text);
      }

      if (currentValue.address) {
        currentValue = currentValue.address;
        continue;
      }

      if (currentValue.value !== undefined) {
        currentValue = currentValue.value;
        continue;
      }

      const parts = [
        currentValue.addressLine1,
        currentValue.addressLine2,
        currentValue.landmark,
        currentValue.city,
        currentValue.state,
        currentValue.pincode,
      ].filter(Boolean);

      return parts.length ? parts.join(', ') : 'Address not provided';
    }

    return 'Address not provided';
  }

  async cancel() {
    if (!this.cancelReason.trim()) {
      this.error = 'Cancellation reason is required.';
      return;
    }

    this.saving = true;
    this.error = '';

    try {
      const result = await this.api.cancelSellerRequest(
        this.pickup.id,
        this.cancelReason.trim(),
      );

      this.pickup = result.pickup;
      this.items = result.items || this.items;
      this.history = result.history || this.history;
      this.cancelReason = '';
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        'Could not cancel this request.',
      );
    } finally {
      this.saving = false;
    }
  }

  async logout() {
    await this.auth.logout();
    void this.router.navigateByUrl('/sign-in');
  }
}