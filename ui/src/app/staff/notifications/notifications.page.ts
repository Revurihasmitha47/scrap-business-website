import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { BusinessService } from "../../core/business.service";
import { StaffHeaderComponent } from "../shared/staff-header/staff-header.component";
import { StaffSidebarComponent } from "../shared/staff-sidebar/staff-sidebar.component";

@Component({
  selector: "app-staff-notifications",
  standalone: true,
  imports: [CommonModule, StaffSidebarComponent, StaffHeaderComponent],
  templateUrl: "./notifications.page.html",
  styleUrl: "./notifications.page.scss",
})
export class StaffNotificationsPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(BusinessService);
  private readonly router = inject(Router);
  notifications: any[] = [];
  error = "";
  async ngOnInit(): Promise<void> {
    try {
      this.notifications = await this.api.staffNotifications();
    } catch (e) {
      this.error = this.auth.errorMessage(e, "Could not load notifications.");
    }
  }
  async read(item: any): Promise<void> {
    if (!item.is_read) {
      await this.api.markStaffNotificationRead(item.id);
      item.is_read = true;
    }
    if (item.related_entity_id)
      void this.router.navigate(["/staff/pickups", item.related_entity_id]);
  }
}
