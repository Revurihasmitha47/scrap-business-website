import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { AuthService } from "../../auth/auth.service";
import { BusinessService } from "../../core/business.service";
import { AdminSidebarComponent } from "../../shared/admin-sidebar.component";

@Component({
  selector: "app-pickup-details-page",
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent],
  templateUrl: "./pickup-details.page.html",
  styleUrls: ["./pickup-details.page.scss"],
})
export class PickupDetailsPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly api = inject(BusinessService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  pickup: any;
  items: any[] = [];
  error = "";
  profileMenu = false;

  get initials(): string {
    return (this.auth.session?.fullName || "AD")
      .split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get("id");

    if (!id) {
      this.error = "Pickup request was not found.";
      return;
    }

    try {
      const response = await this.api.assignmentContext(id);
      this.pickup = response.pickup;
      this.items = response.items || [];
    } catch {
      this.error = "Could not load pickup details.";
    }
  }

  navigateToPickups(): void {
    void this.router.navigateByUrl("/admin/pickups");
  }

  navigateToDashboard(): void {
    void this.router.navigateByUrl("/admin/dashboard");
  }

  prettyStatus(status: string): string {
    return (status || "")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  addressText(address: unknown): string {
    return typeof address === "string"
      ? address
      : (address as any)?.text ||
          (address as any)?.address ||
          "Address not available";
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
