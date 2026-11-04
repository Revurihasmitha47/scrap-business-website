import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../auth.service";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./change-password.page.html",
  styleUrls: ["./change-password.page.scss"],
})
export class ChangePasswordPageComponent {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  current = "";
  next = "";
  confirm = "";
  saving = false;
  error = "";
  message = "";
  async save() {
    this.error = "";
    if (this.next.length < 8) {
      this.error = "New password must contain at least 8 characters.";
      return;
    }
    if (this.next !== this.confirm) {
      this.error = "New passwords do not match.";
      return;
    }
    this.saving = true;
    try {
      const session = await firstValueFrom(
        this.http.post<any>(
          "/api/auth/change-password",
          { currentPassword: this.current, newPassword: this.next },
          { withCredentials: true },
        ),
      );
      this.auth.setSession(session);
      this.message = "Password changed successfully.";
      setTimeout(
        () =>
          void this.router.navigateByUrl(
            session.accountType === "STAFF"
              ? "/staff/my-pickups"
              : session.accountType === "ADMIN"
                ? "/admin/dashboard"
                : "/dashboard",
          ),
        300,
      );
    } catch (e) {
      this.error = this.auth.errorMessage(e, "Could not change password.");
    } finally {
      this.saving = false;
    }
  }
}
