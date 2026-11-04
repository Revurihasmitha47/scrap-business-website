import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import {
  BusinessService,
  Category,
  Pickup,
  Rate,
} from "../../core/business.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="workspace-shell">
      <aside class="workspace-sidebar">
        <a routerLink="/" class="workspace-brand"><span>◒</span> ScrapFlow</a>
        <div class="sidebar-role">{{ roleLabel }}</div>
        <nav>
          <a class="active">▣ <span>Dashboard</span></a
          ><a *ngIf="role !== 'ADMIN'"
            >◫
            <span>{{
              role === "STAFF" ? "My Pickups" : "My Requests"
            }}</span></a
          ><a *ngIf="role === 'BULK_SELLER'">◉ <span>Quotes</span></a
          ><a *ngIf="role === 'BULK_SELLER'">◌ <span>Materials</span></a
          ><a *ngIf="role === 'BULK_SELLER'">↻ <span>Recurring Pickups</span></a
          ><a *ngIf="role === 'HOME_SELLER'">＋ <span>Request Pickup</span></a
          ><a *ngIf="role === 'HOME_SELLER'">◉ <span>Scrap Rates</span></a
          ><a *ngIf="role === 'ADMIN'">⚙ <span>Operations</span></a
          ><a *ngIf="role === 'ADMIN'">♙ <span>Staff & Sellers</span></a
          ><a *ngIf="role === 'ADMIN'">▤ <span>Reports</span></a
          ><a>⚙ <span>Settings</span></a>
        </nav>
        <a routerLink="/" class="sidebar-logout"
          >↪ <span>Exit workspace</span></a
        >
      </aside>
      <main class="workspace-main">
        <header class="workspace-top">
          <div class="workspace-mobile-brand">Scrap<span>Flow</span></div>
          <div class="workspace-user">
            <span class="notification">♧</span
            ><span class="avatar">{{ initials }}</span
            ><strong>{{ auth.session?.email }}</strong
            ><span>⌄</span>
          </div>
        </header>
        <div class="workspace-content">
          <div class="workspace-title">
            <div>
              <p class="eyebrow">SCRAPFLOW WORKSPACE</p>
              <h1>{{ title }} <em>— Dashboard</em></h1>
            </div>
            <span class="live-dot">● Live workspace</span>
          </div>
          <div class="alert error" *ngIf="error">{{ error }}</div>
          <div class="alert success" *ngIf="message">{{ message }}</div>

          <ng-container *ngIf="role === 'HOME_SELLER'"
            ><section class="welcome-card">
              <div>
                <h2>Welcome back, {{ firstName }}!</h2>
                <p>Let's make your home greener together.</p>
              </div>
              <div class="home-illustration">⌂</div>
            </section>
            <div class="rate-heading">
              <h2>Current Scrap Rates <small>(per kg)</small></h2>
              <span>View all rates →</span>
            </div>
            <section class="rate-cards">
              <div class="rate-card" *ngFor="let r of rates | slice: 0 : 3">
                <span class="rate-icon">{{ iconFor(r.name) }}</span>
                <div>
                  <small>{{ r.name }}</small
                  ><strong>₹{{ r.rate }}</strong
                  ><b>↑ Updated</b>
                </div>
              </div>
              <div class="empty-rate" *ngIf="!rates.length">
                Rates will appear after Admin publishes them.
              </div>
            </section>
            <button class="pickup-cta" (click)="showRequest = !showRequest">
              ▣ &nbsp; Request a Pickup <span>→</span>
            </button>
            <section class="content-card">
              <div class="card-heading">
                <h2>My Pickup Status</h2>
                <span>View all →</span>
              </div>
              <div class="pickup-line heading">
                <span>Request</span><span>Material</span><span>Date</span
                ><span>Status</span>
              </div>
              <div class="pickup-line" *ngFor="let p of pickups | slice: 0 : 5">
                <span class="request-id">REQ-{{ p.id | slice: 0 : 6 }}</span
                ><span>Scrap collection</span><span>{{ p.preferred_date }}</span
                ><span
                  class="pill"
                  [class.green-pill]="p.status === 'COMPLETED'"
                  [class.blue-pill]="p.status !== 'COMPLETED'"
                  >{{ prettyStatus(p.status) }}</span
                >
              </div>
              <p class="empty" *ngIf="!pickups.length">
                You have not submitted a pickup yet.
              </p>
            </section>
            <section class="content-card request-form" *ngIf="showRequest">
              <div class="card-heading">
                <h2>Request a Pickup</h2>
                <span (click)="showRequest = false">×</span>
              </div>
              <form (ngSubmit)="createPickup()">
                <div class="form-grid">
                  <label
                    >Scrap type<select
                      name="homeCategory"
                      [(ngModel)]="pickupCategoryId"
                      required
                    >
                      <option value="">Choose material</option>
                      <option *ngFor="let c of categories" [value]="c.id">
                        {{ c.name }}
                      </option>
                    </select></label
                  ><label
                    >Estimated quantity (kg)<input
                      name="homeQty"
                      type="number"
                      [(ngModel)]="quantity"
                      min=".1"
                      required /></label
                  ><label
                    >Preferred date<input
                      name="homeDate"
                      type="date"
                      [(ngModel)]="preferredDate"
                      required /></label
                  ><label
                    >Preferred time<input
                      name="homeTime"
                      [(ngModel)]="preferredTime"
                      placeholder="Morning / Afternoon" /></label
                  ><label class="wide"
                    >Pickup address<textarea
                      name="homeAddress"
                      [(ngModel)]="address"
                      required
                      placeholder="Full pickup address"
                    ></textarea>
                  </label>
                </div>
                <button class="primary-button">Submit request</button>
              </form>
            </section></ng-container
          >

          <ng-container *ngIf="role === 'BULK_SELLER'"
            ><div class="metric-cards">
              <div>
                <span class="metric-icon blue-icon">▤</span
                ><small>Total Requests</small
                ><strong>{{ pickups.length }}</strong
                ><b>↑ This month</b>
              </div>
              <div>
                <span class="metric-icon green-icon">◒</span
                ><small>Total Material</small
                ><strong>{{ totalQuantity }} kg</strong><b>↑ Active records</b>
              </div>
              <div>
                <span class="metric-icon orange-icon">₹</span
                ><small>Total Value</small><strong>₹{{ totalValue }}</strong
                ><b>↑ Estimated</b>
              </div>
            </div>
            <div class="bulk-grid">
              <section class="quote-card">
                <div>
                  <p class="eyebrow">LATEST QUOTE</p>
                  <strong>₹{{ latestQuote }}</strong>
                  <p>Based on your latest pickup request</p>
                </div>
                <span class="quote-badge">Current rates</span
                ><button
                  class="primary-button"
                  (click)="showRequest = !showRequest"
                >
                  Request a Pickup →
                </button>
              </section>
              <section class="side-card">
                <h2>Requested Pickup</h2>
                <div *ngIf="pickups[0]; else noBulk">
                  <span class="side-icon">▣</span>
                  <div>
                    <strong>{{ pickups[0].preferred_date }}</strong
                    ><small>{{ prettyStatus(pickups[0].status) }}</small>
                  </div>
                </div>
                <ng-template #noBulk
                  ><p class="empty">
                    No bulk pickup requests yet.
                  </p></ng-template
                >
              </section>
            </div>
            <div class="bulk-grid">
              <section class="content-card">
                <div class="card-heading">
                  <h2>Materials & Rates</h2>
                  <span>View all →</span>
                </div>
                <div class="material-row heading">
                  <span>Material</span><span>Current rate (per kg)</span
                  ><span>Updated</span>
                </div>
                <div class="material-row" *ngFor="let r of rates">
                  <span>{{ r.name }}</span
                  ><strong>₹{{ r.rate }}</strong
                  ><span>Current</span>
                </div>
              </section>
              <section class="side-card recurring-card">
                <h2>Recurring Pickup</h2>
                <span class="recurring-icon">↻</span>
                <h3>Set a recurring schedule</h3>
                <p>Make regular collection effortless.</p>
                <button class="outline-button">Manage Schedule</button>
              </section>
            </div>
            <section class="content-card request-form" *ngIf="showRequest">
              <div class="card-heading">
                <h2>New Bulk Pickup</h2>
                <span (click)="showRequest = false">×</span>
              </div>
              <form (ngSubmit)="createPickup()">
                <div class="form-grid">
                  <label
                    >Material<select
                      name="bulkCategory"
                      [(ngModel)]="pickupCategoryId"
                      required
                    >
                      <option value="">Choose material</option>
                      <option *ngFor="let c of categories" [value]="c.id">
                        {{ c.name }}
                      </option>
                    </select></label
                  ><label
                    >Estimated quantity (kg)<input
                      name="bulkQty"
                      type="number"
                      [(ngModel)]="quantity"
                      min=".1"
                      required /></label
                  ><label
                    >Preferred date<input
                      name="bulkDate"
                      type="date"
                      [(ngModel)]="preferredDate"
                      required /></label
                  ><label
                    >Preferred time<input
                      name="bulkTime"
                      [(ngModel)]="preferredTime" /></label
                  ><label class="wide"
                    >Pickup address<textarea
                      name="bulkAddress"
                      [(ngModel)]="address"
                      required
                    ></textarea>
                  </label>
                </div>
                <button class="primary-button">Submit bulk request</button>
              </form>
            </section></ng-container
          >

          <ng-container *ngIf="role === 'STAFF'"
            ><div class="metric-cards staff-metrics">
              <div>
                <span class="metric-icon blue-icon">▤</span
                ><small>Assigned Today</small
                ><strong>{{ pickups.length }}</strong
                ><b>Collection tasks</b>
              </div>
              <div>
                <span class="metric-icon green-icon">✓</span
                ><small>Completed</small><strong>{{ completedCount }}</strong
                ><b>Keep it moving</b>
              </div>
              <div>
                <span class="metric-icon orange-icon">▣</span
                ><small>In Progress</small><strong>{{ inProgressCount }}</strong
                ><b>Active now</b>
              </div>
              <div>
                <span class="metric-icon red-icon">◷</span
                ><small>Remaining</small
                ><strong>{{ pickups.length - completedCount }}</strong
                ><b>Today</b>
              </div>
            </div>
            <section class="content-card staff-list-card">
              <div class="card-heading">
                <div>
                  <h2>My Assigned Pickups</h2>
                  <p>Today, {{ todayLabel }}</p>
                </div>
                <span class="date-chip">Today</span>
              </div>
              <div class="staff-row" *ngFor="let p of pickups">
                <span class="staff-number">⌂</span>
                <div>
                  <strong>{{ p.seller_name || "Seller" }}</strong
                  ><small
                    >{{ p.seller_email }} · {{ p.preferred_date }}
                    {{ p.preferred_time || "" }}</small
                  ><small>{{ addressText(p.pickup_address) }}</small>
                </div>
                <span
                  class="pill"
                  [class.blue-pill]="p.status === 'ASSIGNED'"
                  [class.orange-pill]="p.status === 'ON_THE_WAY'"
                  >{{ prettyStatus(p.status) }}</span
                >
                <div class="staff-actions">
                  <button
                    class="small-button orange-button"
                    *ngIf="p.status === 'ASSIGNED'"
                    (click)="startPickup(p)"
                  >
                    Start Pickup</button
                  ><button
                    class="small-button"
                    *ngIf="p.status === 'ASSIGNED' || p.status === 'ON_THE_WAY'"
                    (click)="openCollection = p.id"
                  >
                    Record Weight
                  </button>
                </div>
                <div class="collection-inline" *ngIf="openCollection === p.id">
                  <input
                    type="number"
                    [(ngModel)]="collectionWeights[p.id]"
                    placeholder="Actual kg"
                  /><input
                    [(ngModel)]="collectionNotes[p.id]"
                    placeholder="Notes"
                  /><button class="primary-button" (click)="collect(p)">
                    Save collection
                  </button>
                </div>
              </div>
              <p class="empty" *ngIf="!pickups.length">
                No pickups are assigned to you.
              </p>
            </section></ng-container
          >

          <ng-container *ngIf="role === 'ADMIN'"
            ><div class="metric-cards">
              <div>
                <span class="metric-icon blue-icon">▤</span
                ><small>Total Requests</small
                ><strong>{{ pickups.length }}</strong
                ><b>All pickup requests</b>
              </div>
              <div>
                <span class="metric-icon green-icon">◒</span
                ><small>Active Staff</small><strong>{{ staff.length }}</strong
                ><b>Collection team</b>
              </div>
              <div>
                <span class="metric-icon orange-icon">₹</span
                ><small>Categories</small
                ><strong>{{ categories.length }}</strong
                ><b>Managed materials</b>
              </div>
            </div>
            <div class="admin-grid">
              <section class="content-card">
                <div class="card-heading">
                  <div>
                    <p class="eyebrow">OPERATIONS</p>
                    <h2>Pickup Requests</h2>
                  </div>
                  <span>View all →</span>
                </div>
                <div class="pickup-line heading">
                  <span>Seller</span><span>Date</span><span>Amount</span
                  ><span>Status</span>
                </div>
                <div
                  class="pickup-line"
                  *ngFor="let p of pickups | slice: 0 : 8"
                >
                  <span
                    ><strong>{{ p.seller_name }}</strong
                    ><small>{{ p.seller_email }}</small></span
                  ><span>{{ p.preferred_date }}</span
                  ><span>₹{{ p.estimated_amount }}</span
                  ><span
                    ><select
                      class="status-select"
                      [(ngModel)]="p.status"
                      (change)="changeStatus(p)"
                    >
                      <option *ngFor="let s of statuses" [value]="s">
                        {{ prettyStatus(s) }}
                      </option>
                    </select></span
                  >
                </div>
                <p class="empty" *ngIf="!pickups.length">
                  No pickup requests yet.
                </p>
              </section>
              <section class="side-card">
                <p class="eyebrow">TEAM</p>
                <h2>Invite Staff</h2>
                <form (ngSubmit)="invite()">
                  <label
                    >Email<input
                      name="adminStaffEmail"
                      type="email"
                      [(ngModel)]="staffEmail"
                      required
                      placeholder="staff@example.com" /></label
                  ><button class="primary-button full">
                    Create invitation
                  </button>
                </form>
                <div class="invite-result" *ngIf="inviteToken">
                  <small>Development invitation token</small
                  ><code>{{ inviteToken }}</code>
                </div>
                <div class="staff-mini" *ngFor="let s of staff">
                  <span class="avatar small-avatar">{{
                    (s.full_name || "S").slice(0, 1)
                  }}</span
                  ><span
                    ><strong>{{ s.full_name }}</strong
                    ><small>{{ s.email }}</small></span
                  >
                </div>
              </section>
            </div>
            <div class="admin-grid">
              <section class="content-card">
                <div class="card-heading">
                  <h2>Publish Rates</h2>
                  <span>Two seller rates</span>
                </div>
                <form (ngSubmit)="publishRate()">
                  <label
                    >Category<select
                      name="adminRateCategory"
                      [(ngModel)]="rateCategoryId"
                      required
                    >
                      <option value="">Choose category</option>
                      <option *ngFor="let c of categories" [value]="c.id">
                        {{ c.name }}
                      </option>
                    </select></label
                  >
                  <div class="form-grid">
                    <label
                      >Home ₹/kg<input
                        type="number"
                        name="adminHomeRate"
                        [(ngModel)]="homeRate"
                        min=".01"
                        required /></label
                    ><label
                      >Bulk ₹/kg<input
                        type="number"
                        name="adminBulkRate"
                        [(ngModel)]="bulkRate"
                        min=".01"
                        required
                    /></label>
                  </div>
                  <button class="primary-button">Publish rates</button>
                </form>
              </section>
              <section class="content-card">
                <div class="card-heading">
                  <h2>Categories</h2>
                  <span>{{ categories.length }} active</span>
                </div>
                <form class="inline-form" (ngSubmit)="addCategory()">
                  <input
                    name="adminCategory"
                    [(ngModel)]="newCategory"
                    required
                    placeholder="New material"
                  /><button class="primary-button">Add</button>
                </form>
                <div class="chip-list">
                  <span *ngFor="let c of categories">{{ c.name }}</span>
                </div>
              </section>
            </div></ng-container
          >
        </div>
      </main>
    </div>
  `,
})
export class DashboardPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(BusinessService);
  role = this.auth.session?.accountType || "";
  categories: Category[] = [];
  rates: Rate[] = [];
  pickups: Pickup[] = [];
  staff: any[] = [];
  error = "";
  message = "";
  showRequest = false;
  staffEmail = "";
  inviteToken = "";
  newCategory = "";
  rateCategoryId = "";
  homeRate = 0;
  bulkRate = 0;
  pickupCategoryId = "";
  quantity = 0;
  preferredDate = "";
  preferredTime = "";
  address = "";
  openCollection = "";
  collectionWeights: Record<string, number> = {};
  collectionNotes: Record<string, string> = {};
  statuses = [
    "SUBMITTED",
    "CONFIRMED",
    "ASSIGNED",
    "ON_THE_WAY",
    "COLLECTED",
    "COMPLETED",
    "REJECTED",
    "CANCELLED",
    "UNABLE_TO_COLLECT",
  ];
  get title() {
    return this.role === "HOME_SELLER"
      ? "Home Seller"
      : this.role === "BULK_SELLER"
        ? "Bulk Seller"
        : this.role === "STAFF"
          ? "Pickup Staff"
          : "Admin";
  }
  get roleLabel() {
    return this.title;
  }
  get firstName() {
    return (this.auth.session?.email || "Seller").split("@")[0];
  }
  get initials() {
    return (this.auth.session?.email || "S").slice(0, 2).toUpperCase();
  }
  get latestQuote() {
    return this.pickups[0]?.estimated_amount || 0;
  }
  get totalValue() {
    return this.pickups.reduce(
      (sum, p) => sum + (Number(p.estimated_amount) || 0),
      0,
    );
  }
  get totalQuantity() {
    return this.pickups.length * 0;
  }
  get completedCount() {
    return this.pickups.filter(
      (p) => p.status === "COMPLETED" || p.status === "COLLECTED",
    ).length;
  }
  get inProgressCount() {
    return this.pickups.filter((p) => p.status === "ON_THE_WAY").length;
  }
  get todayLabel() {
    return new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  async ngOnInit() {
    try {
      this.categories = await this.api.categories();
      this.pickups = await this.api.pickups();
      if (this.role !== "STAFF") this.rates = await this.api.rates();
      if (this.role === "ADMIN") this.staff = await this.api.staff();
    } catch (e) {
      this.error =
        "Could not load workspace data. Check database migrations and API connection.";
    }
  }
  iconFor(name: string) {
    return name.toLowerCase().includes("plastic")
      ? "♧"
      : name.toLowerCase().includes("paper")
        ? "▤"
        : name.toLowerCase().includes("copper")
          ? "◉"
          : "◌";
  }
  prettyStatus(status: string) {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  addressText(value: unknown) {
    return typeof value === "string"
      ? value
      : (value as any)?.text || "Pickup address";
  }
  async createPickup() {
    try {
      await this.api.createPickup({
        address: { text: this.address },
        preferredDate: this.preferredDate,
        preferredTime: this.preferredTime,
        items: [
          {
            categoryId: this.pickupCategoryId,
            estimatedQuantity: this.quantity,
          },
        ],
      });
      this.message = "Pickup request submitted.";
      this.showRequest = false;
      this.pickups = await this.api.pickups();
    } catch (e) {
      this.error =
        "Could not submit pickup request. Check that a rate is available.";
    }
  }
  async cancel(p: Pickup) {
    try {
      await this.api.cancelPickup(p.id);
      this.pickups = await this.api.pickups();
    } catch (e) {
      this.error = "This pickup cannot be cancelled.";
    }
  }
  async startPickup(p: Pickup) {
    try {
      await this.api.updateStaffStatus(p.id, "ON_THE_WAY");
      this.pickups = await this.api.pickups();
    } catch (e) {
      this.error = "Could not start pickup.";
    }
  }
  async collect(p: Pickup) {
    try {
      await this.api.collect(
        p.id,
        this.collectionWeights[p.id],
        this.collectionNotes[p.id] || "",
      );
      this.pickups = await this.api.pickups();
      this.openCollection = "";
      this.message = "Collection recorded successfully.";
    } catch (e) {
      this.error = "Could not save collection details.";
    }
  }
  async changeStatus(p: Pickup) {
    try {
      await this.api.updateAdminStatus(p.id, p.status);
      this.message = "Pickup status updated.";
    } catch (e) {
      this.error = "Could not update pickup status.";
    }
  }
  async invite() {
    try {
      const r = await this.api.inviteStaff(this.staffEmail);
      this.inviteToken = r.token;
      this.staffEmail = "";
      this.message = "Staff invitation created.";
    } catch (e) {
      this.error = "Could not create Staff invitation.";
    }
  }
  async addCategory() {
    try {
      await this.api.createCategory(this.newCategory);
      this.newCategory = "";
      this.categories = await this.api.categories();
      this.message = "Category added.";
    } catch (e) {
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
      this.message = "Rates published.";
      this.rates = await this.api.rates();
    } catch (e) {
      this.error = "Could not publish rates.";
    }
  }
}
