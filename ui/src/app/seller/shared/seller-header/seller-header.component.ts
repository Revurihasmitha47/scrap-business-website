import { CommonModule } from "@angular/common";
import { Component, inject, Input } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../auth/auth.service";

@Component({
  selector: "app-seller-header",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./seller-header.component.html",
  styleUrl: "./seller-header.component.scss",
})
export class SellerHeaderComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  @Input() backLink = "";
  profileMenu = false;

  get sellerLabel(): string {
    return this.auth.session?.accountType === "BULK_SELLER"
      ? "Bulk Seller"
      : "Home Seller";
  }

  get initials(): string {
    return (this.auth.session?.fullName || this.sellerLabel)
      .slice(0, 1)
      .toUpperCase();
  }

  goToNotifications(): void {
    void this.router.navigateByUrl("/seller/notifications");
  }

  goToProfile(): void {
    this.profileMenu = false;
    void this.router.navigateByUrl("/seller/profile");
  }

  async logout(): Promise<void> {
    this.profileMenu = false;
    await this.auth.logout();
    await this.router.navigateByUrl("/sign-in");
  }
}
