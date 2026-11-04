import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../auth.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./sign-in.page.html",
  styleUrls: ["./sign-in.page.scss"],
})
export class SignInPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = "";
  password = "";
  showPassword = false;
  busy = false;
  error = "";

  async submit(form: NgForm): Promise<void> {
    if (form.invalid || this.busy) {
      form.control.markAllAsTouched();
      return;
    }

    this.busy = true;
    this.error = "";

    try {
      await this.auth.login(this.email.trim(), this.password);

      if (this.auth.session?.mustChangePassword) {
        await this.router.navigateByUrl("/change-password");
        return;
      }

      const role = this.auth.session?.accountType;
      await this.router.navigateByUrl(
        role === "ADMIN"
          ? "/admin/dashboard"
          : role === "STAFF"
            ? "/staff/my-pickups"
            : role === "BULK_SELLER" || role === "HOME_SELLER"
              ? "/seller/request"
              : "/dashboard",
      );
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        "Sign-in failed. Please check your credentials.",
      );
    } finally {
      this.busy = false;
    }
  }
}
