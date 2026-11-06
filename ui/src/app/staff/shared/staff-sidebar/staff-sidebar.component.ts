import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from "../../../auth/auth.service";

@Component({
  selector: "app-staff-sidebar",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: "./staff-sidebar.component.html",
  styleUrl: "./staff-sidebar.component.scss",
})
export class StaffSidebarComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  mobileOpen = false;

  iconPath(icon: string): string {
    const paths: Record<string, string> = {
      pickups: "M5 5h14v14H5V5Zm3 4h8M8 13h8M8 16h5",
      map: "M4 6l6-2 4 2 6-2v14l-6 2-4-2-6 2V6Zm6-2v14m4-12v14",
      history: "M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
      notifications: "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4",
      profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
      logout: "M10 5H5v14h5m5-4 4-3-4-3m4 3H9",
    };
    return paths[icon] || paths["pickups"];
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl("/sign-in");
  }
}
