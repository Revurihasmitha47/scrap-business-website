import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { Profile, ProfileService } from "../../core/profile.service";
import { StaffHeaderComponent } from "../shared/staff-header/staff-header.component";
import { StaffSidebarComponent } from "../shared/staff-sidebar/staff-sidebar.component";

@Component({
  selector: "app-staff-profile",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StaffSidebarComponent,
    StaffHeaderComponent,
  ],
  templateUrl: "./profile.page.html",
  styleUrl: "./profile.page.scss",
})
export class StaffProfilePageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(ProfileService);
  private readonly router = inject(Router);
  profile?: Profile;
  draft: any = {};
  editing = false;
  saving = false;
  error = "";
  message = "";
  get initials(): string {
    return (this.profile?.full_name || "Staff")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  async ngOnInit(): Promise<void> {
    try {
      this.profile = await this.api.get();
    } catch {
      this.error = "Could not load profile details.";
    }
  }
  startEdit(): void {
    const parts = (this.profile?.full_name || "").trim().split(/\s+/);
    this.draft = {
      ...this.profile,
      firstName: parts[0] || "",
      lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
    };
    this.editing = true;
  }
  async save(): Promise<void> {
    if (!this.profile || !this.draft.firstName || this.saving) return;
    this.saving = true;
    try {
      this.profile = await this.api.update({
        ...this.draft,
        fullName: [this.draft.firstName, this.draft.lastName]
          .filter(Boolean)
          .join(" "),
        addressLine1: this.draft.address_line1,
        addressLine2: this.draft.address_line2,
      });
      this.editing = false;
      this.message = "Profile updated successfully.";
    } catch (e) {
      this.error = this.auth.errorMessage(e, "Could not save profile changes.");
    } finally {
      this.saving = false;
    }
  }
  goBack(): void {
    void this.router.navigateByUrl("/staff/my-pickups");
  }
}
