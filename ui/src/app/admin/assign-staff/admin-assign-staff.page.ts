import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { BusinessService } from "../../core/business.service";
import { AdminSidebarComponent } from "../../shared/admin-sidebar.component";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminSidebarComponent],
  templateUrl: "./admin-assign-staff.page.html",
  styleUrls: ["./admin-assign-staff.page.scss"],
})
export class AdminAssignStaffPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(BusinessService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  id = "";
  pickup: any;
  items: any[] = [];
  staff: any[] = [];
  search = "";
  availability = "";
  serviceArea = "";
  selectedStaffId = "";
  note = "";
  error = "";
  loading = true;
  assigning = false;
  profileMenu = false;

  get initials(): string {
    return (this.auth.session?.fullName || "AD")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  get assignmentAllowed(): boolean {
    return ["SUBMITTED", "CONFIRMED", "SCHEDULED", "ASSIGNED"].includes(this.pickup?.status);
  }

  get assignmentMessage(): string {
    return this.pickup?.status === "COMPLETED"
      ? "Completed pickups cannot be assigned."
      : "Assignment is available for this pickup.";
  }

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get("id") || "";

    try {
      const context = await this.api.assignmentContext(this.id);
      this.pickup = context.pickup;
      this.items = context.items || [];
      await this.loadStaff();
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        "Could not load assignment details.",
      );
    } finally {
      this.loading = false;
    }
  }

  async loadStaff(): Promise<void> {
    if (!this.id) {
      return;
    }

    try {
      this.staff = await this.api.assignableStaff(this.id, {
        search: this.search,
        availability: this.availability,
        serviceArea: this.serviceArea,
      });
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        "Could not load available staff.",
      );
    }
  }

  select(member: any): void {
    if (member.can_assign && this.assignmentAllowed) {
      this.selectedStaffId = member.id;
    }
  }

  addressText(value: unknown): string {
    if (typeof value === "string") {
      return value;
    }

    const address = value as any;
    return (
      address?.text ||
      address?.address ||
      address?.formattedAddress ||
      "Address not available"
    );
  }

  async assign(): Promise<void> {
    if (!this.selectedStaffId || !this.assignmentAllowed) {
      return;
    }

    this.assigning = true;
    this.error = "";

    try {
      await this.api.assignStaff(this.id, {
        staffId: this.selectedStaffId,
        note: this.note,
        reason: this.pickup?.assigned_staff_id ? this.note : undefined,
      });
      await this.router.navigateByUrl("/admin/pickups");
    } catch (error) {
      this.error = this.auth.errorMessage(error, "Could not assign staff.");
      this.assigning = false;
    }
  }

  openProfile(): void {
    this.profileMenu = false;
    void this.router.navigateByUrl("/profile");
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl("/sign-in");
  }
}
