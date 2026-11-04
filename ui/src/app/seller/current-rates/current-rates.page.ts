import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { AuthService } from "../../auth/auth.service";
import { BusinessService, Rate } from "../../core/business.service";
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
    SellerSidebarComponent,
    SellerHeaderComponent,
    QueryBarComponent,
    CdnTableComponent,
    CdnTableCellDirective,
    CdnTableCardDirective,
  ],
  templateUrl: "./current-rates.page.html",
  styleUrls: ["./current-rates.page.scss"],
})
export class SellerRatesPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(BusinessService);

  rates: Rate[] = [];
  search = "";
  filter = "";
  viewMode: "table" | "card" = "table";
  error = "";
  loading = true;

  readonly filters = [{ label: "Active", value: "active" }];

  readonly columns: CdnTableColumn<Rate>[] = [
    { key: "name", header: "Category" },
    { key: "rate", header: "Rate (₹/kg)" },
    { key: "effective_from", header: "Effective From" },
    { key: "status", header: "Status" },
  ];

  get isBulk(): boolean {
    return this.auth.session?.accountType === "BULK_SELLER";
  }

  get sellerLabel(): string {
    return this.isBulk ? "Bulk Seller" : "Home Seller";
  }

  get filteredRates(): Rate[] {
    const query = this.search.trim().toLowerCase();

    return this.rates.filter((rate) => {
      const searchable =
        `${rate.name} ${rate.description || ""} ${rate.rate}`.toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (!this.filter || rate.is_active !== false)
      );
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      this.rates = await this.api.rates();
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        "Could not load current rates.",
      );
    } finally {
      this.loading = false;
    }
  }
}
