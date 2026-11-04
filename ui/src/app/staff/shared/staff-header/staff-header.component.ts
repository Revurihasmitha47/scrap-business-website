import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../auth/auth.service";

@Component({
  selector: "app-staff-header",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./staff-header.component.html",
  styleUrl: "./staff-header.component.scss",
})
export class StaffHeaderComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  profileMenu = false;

  get initials(): string {
    return (this.auth.session?.fullName || "Staff").slice(0, 1).toUpperCase();
  }
  goToNotifications(): void {
    void this.router.navigateByUrl("/staff/notifications");
  }
  goToProfile(): void {
    this.profileMenu = false;
    void this.router.navigateByUrl("/staff/profile");
  }
  async logout(): Promise<void> {
    this.profileMenu = false;
    await this.auth.logout();
    await this.router.navigateByUrl("/sign-in");
  }
}
