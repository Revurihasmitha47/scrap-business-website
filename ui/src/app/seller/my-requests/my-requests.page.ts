import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { BusinessService, Pickup } from "../../core/business.service";
import {
  CdnTableCellDirective,
  CdnTableCardDirective,
  CdnTableComponent,
} from "../../shared/components/cdn-table/cdn-table.component";
import { QueryBarComponent } from "../../shared/components/query-bar/query-bar.component";
import { CdnTableColumn } from "../../shared/interfaces/cdn-table.interface";
import { SellerHeaderComponent } from "../shared/seller-header/seller-header.component";
import { SellerSidebarComponent } from "../shared/seller-sidebar/seller-sidebar.component";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SellerSidebarComponent,
    SellerHeaderComponent,
    QueryBarComponent,
    CdnTableComponent,
    CdnTableCellDirective,
    CdnTableCardDirective,
  ],
  templateUrl: "./my-requests.page.html",
  styleUrls: ["./my-requests.page.scss"],
})
export class SellerRecordsPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(BusinessService);
  private readonly route = inject(ActivatedRoute);

  pickups: Pickup[] = [];
  search = "";
  filter = "";
  viewMode: "table" | "card" = "table";
  error = "";
  loading = true;

  readonly filters = [
    { label: "Submitted", value: "SUBMITTED" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Collected", value: "COLLECTED" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  readonly columns: CdnTableColumn<Pickup>[] = [
    { key: "id", header: "Request" },
    { key: "preferred_date", header: "Pickup Date" },
    { key: "estimated_amount", header: "Amount" },
    { key: "status", header: "Status" },
  ];

  get isBulk(): boolean {
    return this.auth.session?.accountType === "BULK_SELLER";
  }

  get sellerLabel(): string {
    return this.isBulk ? "Bulk Seller" : "Home Seller";
  }

  get isHistory(): boolean {
    return this.route.snapshot.routeConfig?.path === "seller/history";
  }

  get filteredPickups(): Pickup[] {
    const query = this.search.trim().toLowerCase();

    return this.pickups.filter((pickup) => {
      const searchable = [
        pickup.id,
        pickup.preferred_date,
        pickup.preferred_time,
        pickup.status,
        pickup.estimated_amount,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (!this.filter || pickup.status === this.filter)
      );
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      this.pickups = this.isHistory
        ? await this.api.sellerHistory()
        : await this.api.pickups();
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        "Could not load your pickup records.",
      );
    } finally {
      this.loading = false;
    }
  }

  prettyStatus(status: string): string {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
