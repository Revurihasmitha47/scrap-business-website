import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { BusinessService } from "../../core/business.service";
import {
  AdminSidebarComponent,
  AdminView,
} from "../../shared/admin-sidebar.component";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: "./admin-add-staff.page.html",
  styleUrls: ["./admin-add-staff.page.scss"],
})
export class AdminAddStaffPageComponent {
  private readonly api = inject(BusinessService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  form: any = {
    fullName: "",
    email: "",
    mobile: "",
    serviceArea: "",
    setup: "invite",
    temporaryPassword: "",
    active: true,
  };
  saving = false;
  error = "";
  token = "";
  profileMenu = false;
  get initials(): string {
    return (this.auth.session?.fullName || "Admin")
      .split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  async submit(): Promise<void> {
    this.saving = true;
    this.error = "";
    this.token = "";
    try {
      const result = await this.api.inviteStaff(this.form.email, {
        fullName: this.form.fullName,
        mobileNumber: this.form.mobile,
        serviceArea: this.form.serviceArea,
        setupMode: this.form.setup,
        temporaryPassword: this.form.temporaryPassword,
      });
      this.token = result.token || "";
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        "Could not create Staff account.",
      );
    } finally {
      this.saving = false;
    }
  }
  navigateView(view: AdminView): void {
    const paths: Record<string, string> = {
      dashboard: "/admin/dashboard",
      pickups: "/admin/pickups",
      categories: "/admin/categories",
      rates: "/admin/rates",
      staff: "/admin/staff",
    };
    if (paths[view]) void this.router.navigateByUrl(paths[view]);
  }
  openProfile(): void {
    this.profileMenu = false;
    void this.router.navigateByUrl("/profile");
  }
  async logout(): Promise<void> {
    await this.auth.logout();
    void this.router.navigateByUrl("/sign-in");
  }
  cancel(): void {
    void this.router.navigateByUrl("/admin/staff");
  }
}
