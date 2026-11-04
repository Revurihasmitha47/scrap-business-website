import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { BusinessService } from "../../core/business.service";
import { AuthService } from "../../auth/auth.service";
import { SellerSidebarComponent } from "../shared/seller-sidebar/seller-sidebar.component";
import { SellerHeaderComponent } from "../shared/seller-header/seller-header.component";

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, SellerSidebarComponent, SellerHeaderComponent],
  templateUrl: "./notifications.page.html",
})
export class HomeSellerNotificationsPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(BusinessService);
  private readonly router = inject(Router);
  notifications: any[] = [];
  get isBulk() {
    return this.auth.session?.accountType === "BULK_SELLER";
  }
  get sellerLabel() {
    return this.isBulk ? "Bulk Seller" : "Home Seller";
  }
  get initials() {
    return (this.auth.session?.fullName || this.sellerLabel)
      .slice(0, 1)
      .toUpperCase();
  }
  async ngOnInit() {
    try {
      this.notifications = await this.api.sellerNotifications();
    } catch {}
  }
  async read(n: any) {
    if (!n.is_read) {
      await this.api.markSellerNotificationRead(n.id);
      n.is_read = true;
    }
    if (n.related_entity_id)
      void this.router.navigate(["/seller/requests", n.related_entity_id]);
  }
  async logout() {
    await this.auth.logout();
    void this.router.navigateByUrl("/sign-in");
  }
}


