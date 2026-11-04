import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { BusinessService, Pickup } from "../../core/business.service";
import { StaffHeaderComponent } from "../shared/staff-header/staff-header.component";
import { StaffSidebarComponent } from "../shared/staff-sidebar/staff-sidebar.component";

@Component({
  selector: "app-staff-map",
  standalone: true,
  imports: [CommonModule, StaffSidebarComponent, StaffHeaderComponent],
  templateUrl: "./map.page.html",
  styleUrl: "./map.page.scss",
})
export class StaffMapPageComponent {
  private readonly api = inject(BusinessService);
  pickups: Pickup[] = [];
  get mapLink(): string {
    const addresses =
      this.pickups
        .map((pickup) => this.addressText(pickup.pickup_address))
        .join(" | ") || "India";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addresses)}`;
  }
  async ngOnInit(): Promise<void> {
    try {
      this.pickups = await this.api.staffPickups();
    } catch {
      this.pickups = [];
    }
  }
  addressText(value: unknown): string {
    if (typeof value === "string") {
      try {
        return this.addressText(JSON.parse(value));
      } catch {
        return value;
      }
    }
    const item = value as any;
    const candidate =
      item?.text ??
      item?.address ??
      item?.value ??
      item?.addressLine ??
      item?.line1;
    if (candidate !== undefined && candidate !== null && candidate !== value) {
      return this.addressText(candidate);
    }
    return "Address not available";
  }
}
