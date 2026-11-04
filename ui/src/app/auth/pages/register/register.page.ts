import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../auth.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./register.page.html",
  styleUrls: ["./register.page.scss"],
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  accountType: "HOME_SELLER" | "BULK_SELLER" = "HOME_SELLER";
  fullName = "";
  email = "";
  mobileNumber = "";
  password = "";
  confirmPassword = "";
  businessName = "";
  gstin = "";
  approximateQuantity: number | undefined;
  busy = false;
  error = "";
  success = "";

  async submit(form: NgForm): Promise<void> {
    if (form.invalid || this.password !== this.confirmPassword || this.busy) {
      form.control.markAllAsTouched();
      return;
    }

    this.busy = true;
    this.error = "";

    try {
      await this.auth.registerSeller({
        fullName: this.fullName.trim(),
        email: this.email.trim(),
        mobileNumber: this.mobileNumber.trim(),
        password: this.password,
        accountType: this.accountType,
        businessName: this.businessName.trim() || null,
        gstin: this.gstin.trim() || null,
        approximateQuantity: this.approximateQuantity ?? null,
      });

      this.success = "Account created successfully. Opening your workspace...";
      setTimeout(() => void this.router.navigateByUrl("/seller/request"), 500);
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        "Registration failed. Please check your details.",
      );
    } finally {
      this.busy = false;
    }
  }
}
