import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../auth/auth.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <div class="auth-layout">
        <div class="auth-visual admin-visual">
          <p class="eyebrow light">INITIAL PLATFORM SETUP</p>
          <h1>Build a cleaner way to collect.</h1>
          <p>
            Create the first ScrapFlow Admin account to manage sellers, staff,
            rates, and pickups.
          </p>
          <div class="visual-note">
            <span>01</span>
            <div>
              <strong>One-time setup.</strong
              ><small
                >Once the first Admin exists, this registration closes
                automatically.</small
              >
            </div>
          </div>
        </div>
        <div class="auth-card">
          <p class="eyebrow">ADMIN REGISTRATION</p>
          <h2>Create the first Admin</h2>
          <p class="subcopy">
            Use a real administrator email and a strong password.
          </p>
          <div class="alert error" *ngIf="error">{{ error }}</div>
          <form (ngSubmit)="submit(form)" #form="ngForm" novalidate>
            <div class="form-grid">
              <label class="wide"
                >Full name<input
                  name="fullName"
                  [(ngModel)]="fullName"
                  required
                  minlength="2"
                  placeholder="Admin full name" /></label
              ><label class="wide"
                >Email address<input
                  name="email"
                  type="email"
                  [(ngModel)]="email"
                  required
                  email
                  placeholder="admin@example.com" /></label
              ><label
                >Mobile number<input
                  name="mobileNumber"
                  [(ngModel)]="mobileNumber"
                  placeholder="Optional" /></label
              ><label
                >Password<input
                  name="password"
                  type="password"
                  [(ngModel)]="password"
                  required
                  minlength="8"
                  placeholder="At least 8 characters" /></label
              ><label class="wide"
                >Confirm password<input
                  name="confirmPassword"
                  type="password"
                  [(ngModel)]="confirmPassword"
                  required
                  placeholder="Re-enter your password"
              /></label>
            </div>
            <button
              class="primary-button full"
              [disabled]="busy || form.invalid || password !== confirmPassword"
            >
              {{ busy ? "Creating Admin…" : "Create Admin account" }}
            </button>
          </form>
          <div class="auth-footer">
            Already have Admin access? <a routerLink="/sign-in">Sign in</a
            ><a class="back-link" routerLink="/">← Back home</a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AdminRegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  fullName = "";
  email = "";
  mobileNumber = "";
  password = "";
  confirmPassword = "";
  busy = false;
  error = "";
  async submit(form: NgForm): Promise<void> {
    if (form.invalid || this.password !== this.confirmPassword || this.busy) {
      form.control.markAllAsTouched();
      return;
    }
    this.busy = true;
    this.error = "";
    try {
      await this.auth.registerAdmin({
        fullName: this.fullName.trim(),
        email: this.email.trim(),
        mobileNumber: this.mobileNumber.trim(),
        password: this.password,
      });
      await this.router.navigateByUrl("/admin/dashboard");
    } catch (e) {
      this.error = this.auth.errorMessage(
        e,
        "Admin registration could not be completed.",
      );
    } finally {
      this.busy = false;
    }
  }
}
