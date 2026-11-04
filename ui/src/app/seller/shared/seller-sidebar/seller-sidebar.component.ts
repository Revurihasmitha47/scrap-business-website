import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from "../../../auth/auth.service";

@Component({
  selector: "app-seller-sidebar",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: "./seller-sidebar.component.html",
  styleUrl: "./seller-sidebar.component.scss",
})
export class SellerSidebarComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  get isBulk(): boolean {
    return this.auth.session?.accountType === "BULK_SELLER";
  }

  get sellerLabel(): string {
    return this.isBulk ? "Bulk Seller" : "Home Seller";
  }

  iconPath(icon: string): string {
    const paths: Record<string, string> = {
      dashboard: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
      requests: "M5 4h14v16H5V4Zm3 4h8M8 12h8M8 16h5",
      rates: "M5 19V9m7 10V5m7 14v-7",
      history: "M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
      notifications: "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4",
      profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
      logout: "M10 5H5v14h5m5-4 4-3-4-3m4 3H9",
    };
    return paths[icon] || paths["dashboard"];
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl("/sign-in");
  }
}
