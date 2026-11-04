import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { Profile, ProfileService } from "../../core/profile.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: ` <div class="profile-workspace">
    <aside class="profile-sidebar" *ngIf="profile">
      <a [routerLink]="backRoute" class="profile-brand"
        >◒ Scrap<span>Flow</span></a
      >
      <nav *ngIf="isAdmin">
        <a routerLink="/admin/dashboard">▦ <span>Dashboard</span></a
        ><a routerLink="/admin/dashboard">▣ <span>Pickup Requests</span></a
        ><a routerLink="/admin/dashboard">◇ <span>Scrap Categories</span></a
        ><a routerLink="/admin/dashboard">▥ <span>Scrap Rates</span></a
        ><a routerLink="/admin/dashboard">♙ <span>Staff</span></a
        ><a routerLink="/admin/dashboard">♤ <span>Sellers</span></a
        ><a routerLink="/admin/dashboard">▤ <span>Reports</span></a>
      </nav>
      <nav *ngIf="!isAdmin">
        <a routerLink="/dashboard">▦ <span>Dashboard</span></a
        ><a routerLink="/dashboard">♧ <span>My Pickups</span></a
        ><a routerLink="/dashboard">◷ <span>Request Pickup</span></a
        ><a routerLink="/dashboard">▧ <span>Scrap Rates</span></a
        ><a routerLink="/profile" class="active">♙ <span>Profile</span></a>
      </nav>
      <button class="profile-logout" (click)="logout()">
        ↪ <span>Logout</span>
      </button>
    </aside>
    <section class="profile-page rma-profile-page">
      <div class="profile-page-heading">
        <div>
          <p class="eyebrow">ACCOUNT SETTINGS</p>
          <h1>My Profile</h1>
          <p>Manage your account information</p>
        </div>
        <a [routerLink]="backRoute" class="back-link">← Dashboard</a>
      </div>
      <div class="alert error" *ngIf="error">{{ error }}</div>
      <div class="alert success" *ngIf="message">{{ message }}</div>
      <div class="profile-layout" *ngIf="profile">
        <aside class="profile-summary">
          <div class="profile-image-wrap">
            <img
              *ngIf="profile.profile_image_url"
              [src]="profile.profile_image_url"
              [alt]="profile.full_name"
              class="large-profile-image"
            />
            <div
              *ngIf="!profile.profile_image_url"
              class="large-profile-avatar"
            >
              {{ initials }}
            </div>
            <label class="photo-upload"
              >{{ profile.profile_image_url ? "Change photo" : "Upload photo"
              }}<input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                (change)="onPhotoChange($event)"
            /></label>
          </div>
          <h2>{{ profile.full_name }}</h2>
          <p>{{ profile.email }}</p>
          <span class="verified-badge">✓ {{ profile.account_status }}</span>
          <div class="summary-line">
            <span>Role</span
            ><strong>{{ prettyRole(profile.account_type) }}</strong>
          </div>
          <div class="summary-line">
            <span>Member since</span
            ><strong>{{
              profile.created_at
                ? (profile.created_at | date: "mediumDate")
                : "—"
            }}</strong>
          </div>
        </aside>
        <section class="profile-details-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">PERSONAL INFORMATION</p>
              <h2>Profile details</h2>
            </div>
            <button
              class="outline-orange"
              *ngIf="!editing"
              (click)="startEdit()"
            >
              ✎ Edit profile
            </button>
          </div>
          <form (ngSubmit)="save()" *ngIf="editing; else readOnly">
            <div class="profile-form-grid">
              <label
                >First name *<input
                  name="firstName"
                  [(ngModel)]="draft.firstName"
                  required /></label
              ><label
                >Middle name<input
                  name="middleName"
                  [(ngModel)]="draft.middleName" /></label
              ><label
                >Last name *<input
                  name="lastName"
                  [(ngModel)]="draft.lastName"
                  required /></label
              ><label
                >Email address<input [value]="profile.email" disabled /></label
              ><label
                >Phone number<input
                  name="phone"
                  [(ngModel)]="draft.phone" /></label
              ><label
                >Gender<select name="gender" [(ngModel)]="draft.gender">
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select></label
              ><label
                >Country<input
                  name="country"
                  [(ngModel)]="draft.country" /></label
              ><label
                >State<input name="state" [(ngModel)]="draft.state" /></label
              ><label>City<input name="city" [(ngModel)]="draft.city" /></label
              ><label
                >ZIP / postal code<input
                  name="zipCode"
                  [(ngModel)]="draft.zip_code" /></label
              ><label class="wide-field"
                >Address line 1<input
                  name="address1"
                  [(ngModel)]="draft.address_line1" /></label
              ><label class="wide-field"
                >Address line 2<input
                  name="address2"
                  [(ngModel)]="draft.address_line2"
              /></label>
            </div>
            <div
              class="seller-profile-section"
              *ngIf="profile.account_type === 'BULK_SELLER'"
            >
              <p class="eyebrow">BUSINESS INFORMATION</p>
              <div class="profile-form-grid">
                <label
                  >Business name<input
                    name="businessName"
                    [(ngModel)]="draft.business_name" /></label
                ><label
                  >GSTIN<input name="gstin" [(ngModel)]="draft.gstin" /></label
                ><label
                  >Approximate quantity (kg)<input
                    type="number"
                    name="quantity"
                    [(ngModel)]="draft.approximate_quantity"
                /></label>
              </div>
            </div>
            <div class="profile-actions">
              <button
                type="button"
                class="cancel-button"
                (click)="editing = false"
              >
                Cancel</button
              ><button class="primary-button" [disabled]="saving">
                {{ saving ? "Saving…" : "Save changes" }}
              </button>
            </div>
          </form>
          <ng-template #readOnly
            ><div class="read-grid">
              <div>
                <span>Full name</span><strong>{{ profile.full_name }}</strong>
              </div>
              <div>
                <span>Email address</span><strong>{{ profile.email }}</strong>
              </div>
              <div>
                <span>Phone number</span
                ><strong>{{ profile.phone || "Not provided" }}</strong>
              </div>
              <div>
                <span>Gender</span
                ><strong>{{ profile.gender || "Not provided" }}</strong>
              </div>
              <div>
                <span>Country</span
                ><strong>{{ profile.country || "Not provided" }}</strong>
              </div>
              <div>
                <span>State / city</span
                ><strong
                  >{{ profile.state || "—"
                  }}{{ profile.city ? " / " + profile.city : "" }}</strong
                >
              </div>
              <div class="wide-field">
                <span>Address</span
                ><strong
                  >{{ profile.address_line1 || "Not provided"
                  }}{{
                    profile.address_line2 ? ", " + profile.address_line2 : ""
                  }}</strong
                >
              </div>
              <div>
                <span>ZIP / postal code</span
                ><strong>{{ profile.zip_code || "Not provided" }}</strong>
              </div>
            </div></ng-template
          >
        </section>
      </div>
      <div class="profile-loading" *ngIf="!profile && !error">
        Loading your profile…
      </div>
    </section>
  </div>`,
})
export class ProfilePageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(ProfileService);
  profile?: Profile;
  draft: any = {};
  editing = false;
  saving = false;
  error = "";
  message = "";
  get isAdmin() {
    return this.profile?.account_type === "ADMIN";
  }
  get isStaff() {
    return this.profile?.account_type === "STAFF";
  }
  get backRoute() {
    return this.isAdmin
      ? "/admin/dashboard"
      : this.isStaff
        ? "/staff/my-pickups"
        : "/dashboard";
  }
  get initials() {
    return (this.profile?.full_name || "U")
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  async ngOnInit() {
    try {
      this.profile = await this.api.get();
    } catch {
      this.error = "Could not load profile details.";
    }
  }
  prettyRole(r: string) {
    return r.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  startEdit() {
    const p = (this.profile?.full_name || "").trim().split(/\s+/);
    this.draft = {
      ...this.profile,
      firstName: p[0] || "",
      middleName: p.length > 2 ? p.slice(1, -1).join(" ") : "",
      lastName: p.length > 1 ? p[p.length - 1] : "",
    };
    this.editing = true;
  }
  onPhotoChange(e: Event) {
    const i = e.target as HTMLInputElement,
      f = i.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      this.error = "Profile photo must be smaller than 2 MB.";
      i.value = "";
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      if (this.profile) {
        this.profile = { ...this.profile, profile_image_url: String(r.result) };
        this.message = "Photo selected. Save changes to keep it.";
      }
    };
    r.readAsDataURL(f);
  }
  async save() {
    if (!this.draft.firstName || !this.draft.lastName || this.saving) return;
    this.saving = true;
    try {
      this.profile = await this.api.update({
        ...this.draft,
        fullName: [
          this.draft.firstName,
          this.draft.middleName,
          this.draft.lastName,
        ]
          .filter(Boolean)
          .join(" "),
        addressLine1: this.draft.address_line1,
        addressLine2: this.draft.address_line2,
        profileImageUrl: this.profile?.profile_image_url,
      });
      this.editing = false;
      this.message = "Profile updated successfully.";
    } catch {
      this.error = "Could not save profile changes.";
    } finally {
      this.saving = false;
    }
  }
  async logout() {
    await this.auth.logout();
    location.href = "/";
  }
}
