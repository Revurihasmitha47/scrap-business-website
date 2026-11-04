import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { BusinessService, Category, Rate } from "../../core/business.service";
import {
  AdminSidebarComponent,
  AdminView,
} from "../../shared/admin-sidebar.component";
import { ActionsComponent } from "../../shared/components/actions/actions.component";
import {
  CdnTableActionsDirective,
  CdnTableCardDirective,
  CdnTableCellDirective,
  CdnTableComponent,
} from "../../shared/components/cdn-table/cdn-table.component";
import { QueryBarComponent } from "../../shared/components/query-bar/query-bar.component";
import { ActionMenuItem } from "../../shared/interfaces/actions.interface";
import { CdnTableColumn } from "../../shared/interfaces/cdn-table.interface";

@Component({
  selector: "app-rates-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminSidebarComponent,
    QueryBarComponent,
    CdnTableComponent,
    CdnTableCellDirective,
    CdnTableActionsDirective,
    CdnTableCardDirective,
    ActionsComponent,
  ],
  templateUrl: "./rates.page.html",
  styleUrls: ["./rates.page.scss"],
})
export class RatesPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly api = inject(BusinessService);
  readonly router = inject(Router);
  rates: Rate[] = [];
  categories: Category[] = [];
  search = "";
  filter = "";
  viewMode: "table" | "card" = "table";
  profileMenu = false;
  error = "";
  message = "";
  modalOpen = false;
  selectedRate?: Rate;
  rateCategoryId = "";
  homeRate: number | null = null;
  bulkRate: number | null = null;
  readonly filters = [
    { label: "Published", value: "published" },
    { label: "Missing rate", value: "missing" },
  ];
  readonly columns: CdnTableColumn<Rate>[] = [
    { key: "name", header: "Category" },
    { key: "home_seller_rate", header: "Home Seller" },
    { key: "bulk_seller_rate", header: "Bulk Seller" },
    { key: "effective_from", header: "Created At" },
  ];
  get initials(): string {
    return (this.auth.session?.fullName || "Admin")
      .split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  get filteredRates(): Rate[] {
    const q = this.search.trim().toLowerCase();
    return this.rates.filter(
      (rate) =>
        (!q || rate.name.toLowerCase().includes(q)) &&
        (!this.filter ||
          (this.filter === "published"
            ? rate.home_seller_rate != null || rate.bulk_seller_rate != null
            : rate.home_seller_rate == null && rate.bulk_seller_rate == null)),
    );
  }
  async ngOnInit(): Promise<void> {
    await this.load();
  }
  async load(): Promise<void> {
    try {
      [this.rates, this.categories] = await Promise.all([
        this.api.rates(),
        this.api.categories(),
      ]);
    } catch (error) {
      this.error = this.auth.errorMessage(error, "Could not load scrap rates.");
    }
  }
  openAdd(): void {
    this.selectedRate = undefined;
    this.rateCategoryId = "";
    this.homeRate = null;
    this.bulkRate = null;
    this.modalOpen = true;
  }
  openEdit(rate: Rate): void {
    this.selectedRate = rate;
    this.rateCategoryId = rate.id;
    this.homeRate = rate.home_seller_rate ?? null;
    this.bulkRate = rate.bulk_seller_rate ?? null;
    this.modalOpen = true;
  }
  closeModal(): void {
    this.modalOpen = false;
    this.selectedRate = undefined;
  }
  async saveRate(): Promise<void> {
    if (!this.rateCategoryId || !this.homeRate || !this.bulkRate) return;
    this.error = "";
    try {
      await this.api.publishRates({
        categoryId: this.rateCategoryId,
        homeSellerRate: this.homeRate,
        bulkSellerRate: this.bulkRate,
      });
      this.message = "Rate published successfully.";
      this.closeModal();
      await this.load();
    } catch (error) {
      this.error = this.auth.errorMessage(error, "Could not publish rate.");
    }
  }
  rateActions(rate: Rate): ActionMenuItem[] {
    return [
      {
        id: "view",
        label: "View",
        icon: "◉",
        color: "#159b63",
        action: () => this.openView(rate),
      },
      {
        id: "edit",
        label: "Edit",
        icon: "✎",
        color: "#00a878",
        action: () => this.openEdit(rate),
      },
      {
        id: "delete",
        label: "Delete",
        icon: "▣",
        color: "#ef3d3d",
        action: () => void this.deleteRate(rate),
      },
    ];
  }
  async deleteRate(rate: Rate): Promise<void> {
    if (!window.confirm(`Delete the latest rate for ${rate.name}?`)) return;
    this.error = "";
    try {
      await this.api.deleteRate(rate.id);
      this.message = "Rate deleted successfully.";
      await this.load();
    } catch (error) {
      this.error = this.auth.errorMessage(error, "Could not delete rate.");
    }
  }
  openView(rate: Rate): void {
    this.selectedRate = rate;
    this.rateCategoryId = rate.id;
    this.homeRate = rate.home_seller_rate ?? null;
    this.bulkRate = rate.bulk_seller_rate ?? null;
    this.modalOpen = true;
  }
  categoryName(id: string): string {
    return this.categories.find((category) => category.id === id)?.name || "";
  }
  navigateView(view: AdminView): void {
    if (view === "dashboard")
      void this.router.navigateByUrl("/admin/dashboard");
    else if (view === "pickups")
      void this.router.navigateByUrl("/admin/pickups");
    else if (view === "categories")
      void this.router.navigateByUrl("/admin/categories");
    else if (view === "staff") void this.router.navigateByUrl("/admin/staff");
  }
  openProfile(): void {
    this.profileMenu = false;
    void this.router.navigateByUrl("/profile");
  }
  async logout(): Promise<void> {
    await this.auth.logout();
    void this.router.navigateByUrl("/sign-in");
  }
}
