import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthService } from "../../auth.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./invite-accept.page.html",
  styleUrls: ["./invite-accept.page.scss"],
})
export class InviteAcceptPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  token = this.route.snapshot.queryParamMap.get("token") || "";
  fullName = "";
  password = "";
  busy = false;
  error = "";

  async submit(form: NgForm): Promise<void> {
    if (form.invalid || this.busy) {
      return;
    }

    this.busy = true;
    this.error = "";

    try {
      await this.auth.acceptInvite(this.token, this.fullName, this.password);
      await this.router.navigateByUrl("/dashboard");
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        "Invitation could not be accepted.",
      );
    } finally {
      this.busy = false;
    }
  }
}
