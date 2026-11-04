import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import {
  BusinessService,
  Category,
  Rate,
} from '../../core/business.service';
import { Profile, ProfileService } from '../../core/profile.service';
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
  templateUrl: './request-pickup.page.html',
  styleUrls: ['./request-pickup.page.scss'],
})
export class HomeSellerPageComponent {
  readonly auth = inject(AuthService);

  private readonly api = inject(BusinessService);
  private readonly profileApi = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly draftKey = 'scrapflow-pickup-request-draft';

  profile?: Profile;
  categories: Category[] = [];
  rates: Rate[] = [];

  error = '';
  message = '';
  saving = false;

  timeSlots = [
    '10:00 AM - 1:00 PM',
    '1:00 PM - 4:00 PM',
    '4:00 PM - 7:00 PM',
  ];

  form: any = {
    address: '',
    landmark: '',
    date: '',
    time: '',
    notes: '',
    gstin: '',
    contactPerson: '',
    contactMobile: '',
    items: [{ categoryId: '', quantity: null }],
  };

  photos: File[] = [];

  get isBulk() {
    return this.auth.session?.accountType === 'BULK_SELLER';
  }

  get sellerLabel() {
    return this.isBulk ? 'Bulk Seller' : 'Home Seller';
  }

  get minDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  get estimatedWeight() {
    return this.form.items.reduce(
      (total: number, item: any) => total + Number(item.quantity || 0),
      0,
    );
  }

  get estimatedAmount() {
    return this.form.items.reduce(
      (total: number, item: any) => total + this.lineAmount(item),
      0,
    );
  }

  get validationHint() {
    if (!this.form.items.length) {
      return 'Add at least one scrap item.';
    }

    if (
      this.form.items.some(
        (item: any) => !item.categoryId || Number(item.quantity) <= 0,
      )
    ) {
      return 'Select a category and enter a positive quantity for every item.';
    }

    return '';
  }

  async ngOnInit() {
    this.restoreDraft();

    try {
      this.profile = await this.profileApi.get();

      this.form.gstin = this.form.gstin || this.profile.gstin || '';

      if (this.isBulk && this.profile.phone) {
        this.form.contactMobile =
          this.form.contactMobile || this.profile.phone;
      }

      this.categories = await this.api.categories();
      this.rates = await this.api.rates();

      if (!this.categories.length || !this.rates.length) {
        this.error = `No active ${this.sellerLabel.toLowerCase()} categories or rates are available.`;
      }
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        `Could not load ${this.sellerLabel.toLowerCase()} request form.`,
      );
    }
  }

  categoryName(item: any) {
    return (
      this.categories.find((category) => category.id === item.categoryId)?.name ||
      'Select item'
    );
  }

  itemRate(item: any) {
    return Number(
      this.rates.find((rate) => rate.id === item.categoryId)?.rate || 0,
    );
  }

  lineAmount(item: any) {
    return Number(item.quantity || 0) * this.itemRate(item);
  }

  addItem() {
    this.form.items.push({ categoryId: '', quantity: null });
  }

  removeItem(index: number) {
    if (this.form.items.length > 1) {
      this.form.items.splice(index, 1);
    }
  }

  saveDraft() {
    try {
      sessionStorage.setItem(this.draftKey, JSON.stringify(this.form));
      this.message = 'Pickup request draft saved in this browser session.';
      this.error = '';
    } catch {
      this.error = 'Could not save the draft in this browser.';
    }
  }

  private restoreDraft() {
    try {
      const savedDraft = sessionStorage.getItem(this.draftKey);

      if (savedDraft) {
        this.form = { ...this.form, ...JSON.parse(savedDraft) };
      }
    } catch {
      sessionStorage.removeItem(this.draftKey);
    }
  }

  onPhotosSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files || []);

    if (this.photos.length + selected.length > 5) {
      this.error = 'You can upload a maximum of 5 photos.';
      input.value = '';
      return;
    }

    const invalid = selected.find(
      (file) =>
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 5 * 1024 * 1024,
    );

    if (invalid) {
      this.error = 'Only JPG, PNG, or WEBP photos up to 5 MB each are allowed.';
      input.value = '';
      return;
    }

    this.photos = [...this.photos, ...selected];
    this.error = '';
  }

  removePhoto(photo: File) {
    this.photos = this.photos.filter((item) => item !== photo);
  }

  async submitRequest() {
    this.error = '';
    this.message = '';

    const selectedCategoryIds = this.form.items
      .filter((item: any) => item.categoryId)
      .map((item: any) => item.categoryId);

    if (new Set(selectedCategoryIds).size !== selectedCategoryIds.length) {
      this.error = 'Each scrap category can be added only once.';
      return;
    }

    if (!this.form.address.trim()) {
      this.error = 'Pickup address is required.';
      return;
    }

    if (
      this.isBulk &&
      (!this.form.contactPerson.trim() || !this.form.contactMobile.trim())
    ) {
      this.error =
        'Contact person and mobile number are required for Bulk Pickup.';
      return;
    }

    if (!this.form.date || this.form.date < this.minDate) {
      this.error = 'Select a valid pickup date.';
      return;
    }

    if (!this.form.time) {
      this.error = 'Select a preferred time slot.';
      return;
    }

    if (
      this.form.items.some(
        (item: any) =>
          !item.categoryId ||
          Number(item.quantity) <= 0 ||
          Number(item.quantity) > 10000000,
      )
    ) {
      this.error =
        'Select a category and enter a positive quantity for every item.';
      return;
    }

    this.saving = true;
    let requestCreated = false;

    try {
      const idempotencyKey = crypto.randomUUID();

      const address = {
        text: this.form.address,
        landmark: this.form.landmark || null,
        contactPerson: this.form.contactPerson || null,
        contactMobile: this.form.contactMobile || null,
      };

      const created: any = await this.api.createPickup(
        {
          address,
          preferredDate: this.form.date,
          preferredTime: this.form.time,
          sellerNotes: this.form.notes,
          items: this.form.items.map((item: any) => ({
            categoryId: item.categoryId,
            estimatedQuantity: Number(item.quantity),
          })),
        },
        idempotencyKey,
      );

      requestCreated = true;

      if (this.photos.length) {
        await this.api.uploadPickupPhotos(created.id, this.photos);
      }

      sessionStorage.removeItem(this.draftKey);

      this.message = `${this.sellerLabel} request submitted successfully.`;

      this.form = {
        ...this.form,
        address: '',
        landmark: '',
        date: '',
        time: '',
        notes: '',
        items: [{ categoryId: '', quantity: null }],
      };

      this.photos = [];

      await this.router.navigateByUrl('/seller/requests');
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        requestCreated
          ? 'Pickup request was created, but photo upload failed. Open your requests to check it.'
          : `Could not submit ${this.sellerLabel.toLowerCase()} request.`,
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