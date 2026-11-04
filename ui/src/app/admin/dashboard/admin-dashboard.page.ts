import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import {
  BusinessService,
  Category,
  DashboardSummary,
  Pickup,
  Rate,
} from "../../core/business.service";
import { Profile, ProfileService } from "../../core/profile.service";
import {
  AdminSidebarComponent,
  AdminView,
} from "../../shared/admin-sidebar.component";
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
import { ActionsComponent } from "../../shared/components/actions/actions.component";
import { ActionMenuItem } from "../../shared/interfaces/actions.interface";
import { CdnTableColumn } from "../../shared/interfaces/cdn-table.interface";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AdminSidebarComponent,
    QueryBarComponent,
    CdnTableComponent,
    CdnTableCellDirective,
    CdnTableActionsDirective,
    CdnTableCardDirective,
    ActionsComponent,
  ],
  template: `
    <div class="admin-shell">
      <app-admin-sidebar
        [activeView]="view"
        (viewChange)="selectView($event)"
      ></app-admin-sidebar>
      <main class="admin-main">
        <header class="admin-header">
          <span>ScrapFlow</span>
          <div class="admin-user">
            <button class="notification-button" type="button">♧<i></i></button
            ><button
              class="profile-trigger"
              type="button"
              (click)="profileMenu = !profileMenu"
            >
              <span class="admin-avatar">{{ initials }}</span
              ><strong>{{
                profile?.full_name || auth.session?.fullName || "Admin"
              }}</strong
              ><span>⌄</span>
            </button>
            <div class="profile-menu" *ngIf="profileMenu">
              <button type="button" (click)="openProfile()">Profile</button
              ><button type="button" (click)="openProfile()">
                Edit profile</button
              ><button type="button" (click)="logout()">Logout</button>
            </div>
          </div>
        </header>
        <section class="admin-content">
          <div class="admin-page-title">
            <div>
              <p class="eyebrow">
                {{ view === "dashboard" ? "SCRAPFLOW ADMIN" : "OPERATIONS" }}
              </p>
              <h1>{{ pageTitle }}</h1>
            </div>
            <div class="admin-page-actions">
              <button
                *ngIf="view !== 'dashboard'"
                type="button"
                class="admin-back"
                (click)="selectView('dashboard')"
              >
                ← Back</button
              ><span *ngIf="view === 'dashboard'" class="admin-date"
                >▣ &nbsp; {{ todayLabel }}</span
              >
            </div>
          </div>
          <div class="alert error" *ngIf="error">{{ error }}</div>
          <div class="alert success" *ngIf="message">{{ message }}</div>

          <ng-container *ngIf="view === 'dashboard'"
            ><div class="admin-metrics">
              <div>
                <span class="admin-metric-icon blue-icon">▤</span
                ><small>New Requests</small><strong>{{ newRequests }}</strong>
              </div>
              <div>
                <span class="admin-metric-icon green-icon">▦</span
                ><small>Scheduled Today</small
                ><strong>{{ scheduledCount }}</strong>
              </div>
              <div>
                <span class="admin-metric-icon orange-icon">▣</span
                ><small>In Progress</small
                ><strong>{{ inProgressCount }}</strong>
              </div>
              <div>
                <span class="admin-metric-icon red-icon">✓</span
                ><small>Completed</small><strong>{{ completedCount }}</strong>
              </div>
            </div>
            <section class="admin-card request-table-card">
              <div class="admin-card-heading">
                <h2>Recent Pickup Requests</h2>
                <button
                  class="outline-orange"
                  type="button"
                  (click)="selectView('pickups')"
                >
                  View all
                </button>
              </div>
              <div class="admin-table admin-table-head">
                <span>#</span><span>Request ID</span><span>Seller Details</span
                ><span>Scrap Type</span><span>Est. Weight</span
                ><span>Pickup Date</span><span>Status</span><span>Actions</span>
              </div>
              <div
                class="admin-table"
                *ngFor="let p of pickups | slice: 0 : 6; let i = index"
              >
                <span>{{ i + 1 }}</span
                ><span class="request-code">#PR-{{ p.id | slice: 0 : 6 }}</span
                ><span
                  ><strong>{{ p.seller_name || "Seller" }}</strong
                  ><small>{{ sellerType(p) }}</small></span
                ><span>◉ &nbsp; Scrap</span
                ><span>{{ p.estimated_weight || 0 }} kg</span
                ><span>{{ p.preferred_date }}</span
                ><span
                  class="status-pill"
                  [class.status-green]="p.status === 'COMPLETED'"
                  [class.status-blue]="p.status === 'SUBMITTED'"
                  [class.status-orange]="p.status === 'ON_THE_WAY'"
                  >{{ prettyStatus(p.status) }}</span
                ><span
                  ><button
                    class="review-button"
                    type="button"
                    (click)="selectView('pickups')"
                  >
                    Review
                  </button></span
                >
              </div>
              <p class="empty" *ngIf="!pickups.length">
                No pickup requests yet.
              </p>
            </section></ng-container
          >

          <ng-container *ngIf="view === 'pickups'"
            ><section class="admin-card full-admin-card admin-list-page">
              <div class="admin-list-heading">
                <div>
                  <h2>Pickup Requests</h2>
                  <p>Review, filter, and manage pickup operations.</p>
                </div>
                <button
                  type="button"
                  class="outline-orange"
                  (click)="selectView('dashboard')"
                >
                  Dashboard
                </button>
              </div>
              <app-query-bar
                searchPlaceholder="Search pickup requests..."
                [searchValue]="pickupSearch"
                [filters]="pickupFilters"
                [selectedFilter]="pickupStatus"
                [viewMode]="pickupViewMode === 'table' ? 'table' : 'card'"
                (searchChange)="pickupSearch = $event; pickupPage = 1"
                (filterChange)="pickupStatus = $event; pickupPage = 1"
                (viewModeChange)="
                  pickupViewMode = $event === 'table' ? 'table' : 'card'
                "
              ></app-query-bar
              ><app-cdn-table
                [columns]="pickupColumns"
                [rows]="pagedPickups"
                [loading]="false"
                [viewMode]="pickupViewMode === 'table' ? 'list' : 'card'"
                [pageSize]="pickupPageSize"
                [currentPage]="1"
                [pageSizeOptions]="[5, 10, 25]"
                [trackByFn]="trackByPickup"
                pagination="true"
                (pageSizeChange)="pickupPageSize = $event; pickupPage = 1"
                (pageChange)="pickupPage = $event"
                ><ng-template cdnTableCell="request" let-row
                  ><span class="request-code"
                    >#PR-{{ row.id | slice: 0 : 6 }}</span
                  ></ng-template
                ><ng-template cdnTableCell="seller" let-row
                  ><strong>{{ row.seller_name || "Seller" }}</strong
                  ><small>{{ row.seller_email }}</small></ng-template
                ><ng-template cdnTableCell="status" let-row
                  ><span
                    class="status-pill"
                    [class.status-green]="row.status === 'COMPLETED'"
                    [class.status-orange]="row.status !== 'COMPLETED'"
                    >{{ prettyStatus(row.status) }}</span
                  ></ng-template
                ><ng-template cdnTableActions let-row
                  ><app-actions
                    [items]="getPickupActions(row)"
                  ></app-actions></ng-template
                ><ng-template cdnTableCard let-rows="rows"
                  ><div class="cms-basic-cards">
                    <article *ngFor="let row of rows">
                      <strong
                        >#PR-{{ row.id | slice: 0 : 6 }} ·
                        {{ row.seller_name || "Seller" }}</strong
                      ><span
                        >{{ row.preferred_date }} · ₹{{
                          row.estimated_amount || 0
                        }}</span
                      ><span
                        class="status-pill"
                        [class.status-green]="row.status === 'COMPLETED'"
                        >{{ prettyStatus(row.status) }}</span
                      ><app-actions
                        [items]="getPickupActions(row)"
                      ></app-actions>
                    </article></div></ng-template
              ></app-cdn-table></section
          ></ng-container>

          <ng-container *ngIf="view === 'categories'"
            ><section class="admin-card full-admin-card admin-list-page">
              <div class="admin-list-heading">
                <div>
                  <h2>Scrap Categories</h2>
                  <p>Manage the materials sellers can submit.</p>
                </div>
                <form class="inline-admin-form" (ngSubmit)="addCategory()">
                  <input
                    name="newCategory"
                    [(ngModel)]="newCategory"
                    required
                    placeholder="New category"
                  /><button class="primary-button">Add</button>
                </form>
              </div>
              <div class="admin-simple-table admin-simple-head">
                <span>Name</span><span>Status</span><span>Actions</span>
              </div>
              <div class="admin-simple-table" *ngFor="let c of categories">
                <strong>{{ c.name }}</strong
                ><span class="active-label">Active</span
                ><span
                  ><button class="text-action" type="button">⋮</button></span
                >
              </div>
            </section></ng-container
          >
          <ng-container *ngIf="view === 'rates'"
            ><section class="admin-card full-admin-card admin-list-page">
              <div class="admin-list-heading">
                <div>
                  <h2>Scrap Rates</h2>
                  <p>Publish current rates for home and bulk sellers.</p>
                </div>
                <button class="outline-orange" type="button">Export PDF</button>
              </div>
              <form class="rate-form" (ngSubmit)="(publishRate)">
                <label
                  >Category<select
                    name="rateCategory"
                    [(ngModel)]="rateCategoryId"
                    required
                  >
                    <option value="">Choose category</option>
                    <option *ngFor="let c of categories" [value]="c.id">
                      {{ c.name }}
                    </option>
                  </select></label
                ><label
                  >Home Seller rate<input
                    type="number"
                    name="homeRate"
                    [(ngModel)]="homeRate"
                    min=".01"
                    required /></label
                ><label
                  >Bulk Seller rate<input
                    type="number"
                    name="bulkRate"
                    [(ngModel)]="bulkRate"
                    min=".01"
                    required /></label
                ><button class="primary-button">Publish rate</button>
              </form>
              <div class="admin-simple-table admin-simple-head">
                <span>Category</span><span>Home Seller</span
                ><span>Bulk Seller</span>
              </div>
              <div class="admin-simple-table" *ngFor="let r of rates">
                <strong>{{ r.name }}</strong
                ><span>₹ {{ r.home_seller_rate || "—" }}</span
                ><span>₹ {{ r.bulk_seller_rate || "—" }}</span>
              </div>
            </section></ng-container
          >
          <ng-container *ngIf="view === 'staff'"
            ><section class="admin-card full-admin-card admin-list-page">
              <div class="admin-list-heading">
                <div>
                  <h2>Staff</h2>
                  <p>Manage your pickup operations team.</p>
                </div>
                <button
                  class="primary-button"
                  type="button"
                  (click)="router.navigateByUrl('/admin/staff/add')"
                >
                  Add Staff
                </button>
              </div>
              <div class="admin-simple-table admin-simple-head">
                <span>Name</span><span>Email</span><span>Status</span>
              </div>
              <div class="admin-simple-table" *ngFor="let s of staff">
                <strong>{{ s.full_name }}</strong
                ><span>{{ s.email }}</span
                ><span class="active-label">{{ s.account_status }}</span>
              </div>
            </section></ng-container
          >
          <ng-container *ngIf="view === 'sellers'"
            ><section class="admin-card full-admin-card admin-list-page">
              <div class="admin-list-heading">
                <div>
                  <h2>Sellers</h2>
                  <p>View seller accounts and pickup activity.</p>
                </div>
                <button class="outline-orange" type="button">Export PDF</button>
              </div>
              <div class="admin-simple-table admin-simple-head">
                <span>Seller</span><span>Email</span><span>Requests</span>
              </div>
              <div class="admin-simple-table" *ngFor="let s of sellers">
                <strong>{{ s.name }}</strong
                ><span>{{ s.email }}</span
                ><span>{{ s.count }}</span>
              </div>
            </section></ng-container
          >
          <ng-container *ngIf="view === 'reports'"
            ><section class="admin-card narrow-admin-card admin-list-page">
              <div class="admin-list-heading">
                <div>
                  <h2>Reports</h2>
                  <p>Business activity summary from current records.</p>
                </div>
                <button class="outline-orange" type="button">Export PDF</button>
              </div>
              <div class="admin-metrics report-metrics">
                <div>
                  <small>Total requests</small
                  ><strong>{{ pickups.length }}</strong>
                </div>
                <div>
                  <small>Completed</small><strong>{{ completedCount }}</strong>
                </div>
                <div>
                  <small>Active staff</small><strong>{{ staff.length }}</strong>
                </div>
                <div>
                  <small>Published rates</small
                  ><strong>{{ rates.length }}</strong>
                </div>
              </div>
            </section></ng-container
          >
        </section>
      </main>
    </div>
  `,
})
export class AdminDashboardPageComponent {
  readonly auth = inject(AuthService);
  readonly api = inject(BusinessService);
  readonly profileApi = inject(ProfileService);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  view: AdminView = "dashboard";
  profileMenu = false;
  profile?: Profile;
  dashboard?: DashboardSummary;
  categories: Category[] = [];
  rates: Rate[] = [];
  pickups: Pickup[] = [];
  staff: any[] = [];
  error = "";
  message = "";
  newCategory = "";
  rateCategoryId = "";
  homeRate = 0;
  bulkRate = 0;
  pickupSearch = "";
  pickupStatus = "";
  pickupViewMode: "table" | "card" = "table";
  pickupPage = 1;
  pickupPageSize = 10;
  statuses = [
    "SUBMITTED",
    "CONFIRMED",
    "SCHEDULED",
    "ASSIGNED",
    "ON_THE_WAY",
    "COLLECTED",
    "COMPLETED",
    "REJECTED",
    "CANCELLED",
    "UNABLE_TO_COLLECT",
  ];
  pickupFilters: QueryFilter[] = this.statuses.map((status) => ({
    label: this.prettyStatus(status),
    value: status,
  }));
  pickupColumns: CdnTableColumn<Pickup>[] = [
    { key: "request", header: "Request" },
    { key: "seller", header: "Seller" },
    { key: "preferred_date", header: "Date" },
    { key: "estimated_amount", header: "Amount" },
    { key: "status", header: "Status" },
  ];
  get pageTitle(): string {
    return (
      {
        dashboard: "Admin Dashboard",
        pickups: "Pickup Requests",
        categories: "Scrap Categories",
        rates: "Scrap Rates",
        staff: "Staff",
        sellers: "Sellers",
        reports: "Reports",
        profile: "Profile",
      } as Record<AdminView, string>
    )[this.view];
  }
  get initials() {
    return (this.profile?.full_name || this.auth.session?.fullName || "AD")
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  get todayLabel() {
    return new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  get newRequests() {
    return (
      this.dashboard?.newRequests ??
      this.pickups.filter((p) => p.status === "SUBMITTED").length
    );
  }
  get scheduledCount() {
    return (
      this.dashboard?.confirmedPickups ??
      this.pickups.filter(
        (p) => p.status === "CONFIRMED" || p.status === "SCHEDULED",
      ).length
    );
  }
  get inProgressCount() {
    return (
      this.dashboard?.inProgressPickups ??
      this.pickups.filter((p) => p.status === "ON_THE_WAY").length
    );
  }
  get completedCount() {
    return (
      this.dashboard?.completedPickups ??
      this.pickups.filter((p) => p.status === "COMPLETED").length
    );
  }
  get sellers() {
    const map = new Map<string, any>();
    this.pickups.forEach((p) => {
      const key = p.seller_email || p.seller_id;
      const current = map.get(key) || {
        name: p.seller_name || "Seller",
        email: p.seller_email || "",
        count: 0,
      };
      current.count++;
      map.set(key, current);
    });
    return [...map.values()];
  }
  get filteredPickups() {
    const q = this.pickupSearch.trim().toLowerCase();
    return this.pickups.filter(
      (p) =>
        (!q ||
          [p.id, p.seller_name, p.seller_email].some((v) =>
            String(v || "")
              .toLowerCase()
              .includes(q),
          )) &&
        (!this.pickupStatus || p.status === this.pickupStatus),
    );
  }
  get pagedPickups() {
    return this.filteredPickups;
  }
  trackByPickup(index: number, row: Pickup) {
    return row?.id || index;
  }
  getPickupActions(p: Pickup): ActionMenuItem[] {
    return [
      {
        id: "review",
        label: "Review",
        icon: "◉",
        color: "#159b63",
        action: () => undefined,
      },
      {
        id: "assign",
        label: "Assign Staff",
        icon: "♙",
        color: "#159b63",
        action: () => this.openAssignment(p),
      },
      {
        id: "status",
        label: `Move to ${this.nextStatusLabel(p.status)}`,
        icon: "↻",
        color: "#f59e0b",
        action: () => this.advancePickupStatus(p),
      },
    ];
  }
  nextStatusLabel(status: string) {
    const index = this.statuses.indexOf(status);
    return this.prettyStatus(
      this.statuses[Math.min(this.statuses.length - 1, index + 1)] ||
        "CONFIRMED",
    );
  }
  async advancePickupStatus(p: Pickup) {
    const index = this.statuses.indexOf(p.status);
    p.status =
      this.statuses[Math.min(this.statuses.length - 1, index + 1)] ||
      "CONFIRMED";
    await this.changeStatus(p);
  }
  async ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const requested = params.get("view") as AdminView | null;
      this.view =
        requested && requested !== "pickups" ? requested : "dashboard";
    });
    try {
      [
        this.profile,
        this.dashboard,
        this.categories,
        this.rates,
        this.pickups,
        this.staff,
      ] = await Promise.all([
        this.profileApi.get(),
        this.api.adminDashboard(),
        this.api.categories(),
        this.api.rates(),
        this.api.pickups(),
        this.api.staff(),
      ]);

      const recentWeights = new Map(
        (this.dashboard?.recentRequests || []).map((request) => [
          request.id,
          request.estimated_weight,
        ]),
      );
      this.pickups = this.pickups.map((pickup) => ({
        ...pickup,
        estimated_weight:
          pickup.estimated_weight ?? recentWeights.get(pickup.id) ?? 0,
      }));
    } catch {
      this.error = "Could not load Admin dashboard data.";
    }
  }
  selectView(view: AdminView) {
    if (view === "pickups") {
      void this.router.navigateByUrl("/admin/pickups");
      return;
    }
    this.view = view;
    this.pickupPage = 1;
  }
  openAssignment(p: Pickup) {
    void this.router.navigate(["/admin/pickups", p.id, "assign"]);
  }
  prettyStatus(s: string) {
    return s
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  sellerType(p: Pickup) {
    return (p as any).seller_type || "Seller";
  }
  async changeStatus(p: Pickup) {
    try {
      await this.api.updateAdminStatus(p.id, p.status);
      this.message = "Pickup status updated.";
    } catch {
      this.error = "Could not update pickup status.";
    }
  }
  async addCategory() {
    try {
      await this.api.createCategory(this.newCategory);
      this.newCategory = "";
      this.categories = await this.api.categories();
      this.message = "Category added successfully.";
    } catch {
      this.error = "Could not add category.";
    }
  }
  async publishRate() {
    try {
      await this.api.publishRates({
        categoryId: this.rateCategoryId,
        homeSellerRate: this.homeRate,
        bulkSellerRate: this.bulkRate,
      });
      this.rates = await this.api.rates();
      this.message = "Rates published successfully.";
    } catch {
      this.error = "Could not publish rate.";
    }
  }
  openProfile() {
    this.profileMenu = false;
    void this.router.navigateByUrl("/profile");
  }
  async logout() {
    await this.auth.logout();
    void this.router.navigateByUrl("/sign-in");
  }
}
