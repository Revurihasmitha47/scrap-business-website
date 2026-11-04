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
  selector: "app-staff-history",
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
  templateUrl: "./history.page.html",
  styleUrl: "./history.page.scss",
})
export class StaffHistoryPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(BusinessService);
  private readonly router = inject(Router);
  history: Pickup[] = [];
  search = "";
  selectedStatus = "";
  viewMode: "table" | "card" = "table";
  error = "";
  columns: CdnTableColumn<Pickup>[] = [
    {
      key: "id",
      header: "REQUEST",
      formatter: (row) => `PR-${row.id.slice(0, 8)}`,
    },
    { key: "seller_name", header: "SELLER" },
    { key: "preferred_date", header: "DATE" },
    {
      key: "actual_weight",
      header: "ACTUAL WEIGHT",
      formatter: (row) => `${row.actual_weight || 0} kg`,
    },
    {
      key: "status",
      header: "STATUS",
      formatter: (row) => this.pretty(row.status),
    },
  ];
  filters: QueryFilter[] = [
    { label: "Collected", value: "COLLECTED" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Unable to collect", value: "UNABLE_TO_COLLECT" },
  ];
  async ngOnInit(): Promise<void> {
    try {
      this.history = await this.api.staffHistory();
    } catch (e) {
      this.error = this.auth.errorMessage(e, "Could not load pickup history.");
    }
  }
  get filteredHistory(): Pickup[] {
    const term = this.search.trim().toLowerCase();
    return this.history.filter(
      (p) =>
        (!this.selectedStatus || p.status === this.selectedStatus) &&
        (!term ||
          `${p.seller_name || ""} ${p.id}`.toLowerCase().includes(term)),
    );
  }
  pretty(value: string): string {
    return (value || "")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  open(id: string): void {
    void this.router.navigate(["/staff/pickups", id]);
  }
  historyActions(row: Pickup): ActionMenuItem[] {
    return [
      {
        id: "view",
        label: "View details",
        icon: "◉",
        action: () => this.open(row.id),
      },
    ];
  }
}
