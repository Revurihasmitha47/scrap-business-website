import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { Profile, ProfileService } from "../../core/profile.service";
import { SellerSidebarComponent } from "../shared/seller-sidebar/seller-sidebar.component";
import { SellerHeaderComponent } from "../shared/seller-header/seller-header.component";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    SellerSidebarComponent,
    SellerHeaderComponent,
  ],
  templateUrl: "./profile.page.html",
})
export class SellerProfilePageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(ProfileService);
  private readonly router = inject(Router);
  profile?: Profile;
  draft: any = {};
  error = "";
  message = "";
  saving = false;
  get isBulk() {
    return this.auth.session?.accountType === "BULK_SELLER";
  }
  get sellerLabel() {
    return this.isBulk ? "Bulk Seller" : "Home Seller";
  }
  get initials() {
    return (this.profile?.full_name || this.sellerLabel)
      .slice(0, 1)
      .toUpperCase();
  }
  async ngOnInit() {
    try {
      this.profile = await this.api.get();
      this.draft = {
        fullName: this.profile.full_name,
        phone: this.profile.phone || "",
        businessName: this.profile.business_name || "",
        gstin: this.profile.gstin || "",
      };
    } catch {
      this.error = "Could not load your profile.";
    }
  }
  async save() {
    if (!this.profile || !this.draft.fullName?.trim() || this.saving) return;
    this.saving = true;
    this.error = "";
    try {
      this.profile = await this.api.update({
        fullName: this.draft.fullName.trim(),
        phone: this.draft.phone,
        businessName: this.draft.businessName,
        gstin: this.draft.gstin,
      });
      this.message = "Profile updated successfully.";
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        "Could not save your profile.",
      );
    } finally {
      this.saving = false;
    }
  }
  async logout() {
    await this.auth.logout();
    await this.router.navigateByUrl("/sign-in");
  }
}

