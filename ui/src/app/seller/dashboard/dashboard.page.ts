import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { BusinessService, Pickup, Rate } from "../../core/business.service";
import { SellerHeaderComponent } from "../shared/seller-header/seller-header.component";
import { SellerSidebarComponent } from "../shared/seller-sidebar/seller-sidebar.component";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SellerSidebarComponent,
    SellerHeaderComponent,
  ],
  templateUrl: "./dashboard.page.html",
  styleUrls: ["./dashboard.page.scss"],
})
export class SellerDashboardPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(BusinessService);

  pickups: Pickup[] = [];
  rates: Rate[] = [];
  error = "";

  get isBulk(): boolean {
    return this.auth.session?.accountType === "BULK_SELLER";
  }

  get sellerLabel(): string {
    return this.isBulk ? "Bulk Seller" : "Home Seller";
  }

  get firstName(): string {
    return (this.auth.session?.fullName || this.sellerLabel)
      .trim()
      .split(/\s+/)[0];
  }

  get activeCount(): number {
    return this.pickups.filter((pickup) =>
      [
        "CONFIRMED",
        "SCHEDULED",
        "ASSIGNED",
        "ON_THE_WAY",
        "COLLECTED",
      ].includes(pickup.status),
    ).length;
  }

  get completedCount(): number {
    return this.pickups.filter((pickup) => pickup.status === "COMPLETED")
      .length;
  }

  async ngOnInit(): Promise<void> {
    try {
      this.pickups = await this.api.pickups();
      this.rates = await this.api.rates();
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        "Could not load your dashboard.",
      );
    }
  }

  pickupItemsLabel(pickup: Pickup): string {
    const value = pickup as any;
    const items = value.items || value.pickup_items || value.request_items;

    if (!Array.isArray(items) || !items.length) {
      return "Scrap pickup";
    }

    return items
      .map(
        (item: any) =>
          item.category_name || item.categoryName || item.name || "Scrap item",
      )
      .join(", ");
  }

  prettyStatus(status: string): string {
    return (status || "PENDING")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }
}
