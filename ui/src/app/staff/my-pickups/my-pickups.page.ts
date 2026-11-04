import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { BusinessService, Pickup } from "../../core/business.service";
import { ActionsComponent } from "../../shared/components/actions/actions.component";
import {
  CdnTableActionsDirective,
  CdnTableCardDirective,
  CdnTableCellDirective,
  CdnTableComponent,
} from "../../shared/components/cdn-table/cdn-table.component";
import {
  QueryBarComponent,
  QueryFilter,
} from "../../shared/components/query-bar/query-bar.component";
import { CdnTableColumn } from "../../shared/interfaces/cdn-table.interface";
import { ActionMenuItem } from "../../shared/interfaces/actions.interface";
import { StaffHeaderComponent } from "../shared/staff-header/staff-header.component";
import { StaffSidebarComponent } from "../shared/staff-sidebar/staff-sidebar.component";

@Component({
  selector: "app-staff-my-pickups",
  standalone: true,
  imports: [
    CommonModule,
    StaffSidebarComponent,
    StaffHeaderComponent,
    QueryBarComponent,
    CdnTableComponent,
    CdnTableCellDirective,
    CdnTableActionsDirective,
    CdnTableCardDirective,
    ActionsComponent,
  ],
  templateUrl: "./my-pickups.page.html",
  styleUrl: "./my-pickups.page.scss",
})
export class StaffMyPickupsPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(BusinessService);
  private readonly router = inject(Router);
  pickups: Pickup[] = [];
  search = "";
  selectedStatus = "";
  viewMode: "table" | "card" = "table";
  error = "";
  columns: CdnTableColumn<Pickup>[] = [
    { key: "seller_name", header: "SELLER" },
    {
      key: "pickup_address",
      header: "ADDRESS",
      formatter: (row) => this.addressText(row.pickup_address),
    },
    { key: "preferred_date", header: "PICKUP DATE" },
    { key: "preferred_time", header: "PREFERRED TIME" },
    {
      key: "estimated_amount",
      header: "ESTIMATED AMOUNT",
      formatter: (row) => `₹${row.estimated_amount || 0}`,
    },
    {
      key: "status",
      header: "STATUS",
      formatter: (row) => this.pretty(row.status),
    },
  ];
  filters: QueryFilter[] = [
    { label: "Assigned", value: "ASSIGNED" },
    { label: "On the way", value: "ON_THE_WAY" },
    { label: "Collected", value: "COLLECTED" },
    { label: "Unable to collect", value: "UNABLE_TO_COLLECT" },
  ];

  get initials(): string {
    return (this.auth.session?.fullName || "Staff").slice(0, 1).toUpperCase();
  }
  get assignedToday(): number {
    return this.pickups.length;
  }
  get completed(): number {
    return this.pickups.filter((p) =>
      ["COLLECTED", "COMPLETED"].includes(p.status),
    ).length;
  }
  get inProgress(): number {
    return this.pickups.filter((p) => p.status === "ON_THE_WAY").length;
  }
  get remaining(): number {
    return Math.max(0, this.assignedToday - this.completed);
  }

  async ngOnInit(): Promise<void> {
    await this.load();
  }
  async load(): Promise<void> {
    try {
      this.pickups = await this.api.staffPickups({
        search: this.search,
        status: this.selectedStatus,
      });
      this.error = "";
    } catch (e) {
      this.error = this.auth.errorMessage(
        e,
        "Could not load assigned pickups.",
      );
    }
  }
  async onSearch(value: string): Promise<void> {
    this.search = value;
    await this.load();
  }
  async onStatus(value: string): Promise<void> {
    this.selectedStatus = value;
    await this.load();
  }
  open(id: string): void {
    void this.router.navigate(["/staff/pickups", id]);
  }
  pickupActions(row: Pickup): ActionMenuItem[] {
    const items: ActionMenuItem[] = [
      {
        id: "view",
        label: "View details",
        icon: "◉",
        action: () => this.open(row.id),
      },
    ];
    if (row.status === "ASSIGNED") {
      items.push({
        id: "start",
        label: "Start pickup",
        icon: "▶",
        color: "#ff6333",
        action: () => void this.start(row),
      });
    }
    return items;
  }
  async start(row: Pickup): Promise<void> {
    try {
      await this.api.startStaffPickup(row.id);
      await this.load();
    } catch (e) {
      this.error = this.auth.errorMessage(e, "Could not start pickup.");
    }
  }
  pretty(value: string): string {
    return (value || "")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  initialsFor(value?: string): string {
    return (value || "Seller")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  addressText(value: unknown): string {
    if (typeof value === "string") {
      try {
        return this.addressText(JSON.parse(value));
      } catch {
        return value;
      }
    }
    if (value && typeof value === "object") {
      const item = value as any;
      const candidate =
        item.text ??
        item.address ??
        item.value ??
        item.addressLine ??
        item.line1;
      if (
        candidate !== undefined &&
        candidate !== null &&
        candidate !== value
      ) {
        return this.addressText(candidate);
      }
    }
    return "Address not available";
  }
}
