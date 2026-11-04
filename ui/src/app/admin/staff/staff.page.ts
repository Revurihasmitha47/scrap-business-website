import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { BusinessService } from "../../core/business.service";
import {
  AdminSidebarComponent,
  AdminView,
} from "../../shared/admin-sidebar.component";
import { ActionsComponent } from "../../shared/components/actions/actions.component";
import {
  CdnTableActionsDirective,
  CdnTableCardDirective,
  CdnTableCellDirective,
  CdnTableComponent,
} from "../../shared/components/cdn-table/cdn-table.component";
import { QueryBarComponent } from "../../shared/components/query-bar/query-bar.component";
import { ActionMenuItem } from "../../shared/interfaces/actions.interface";
import { CdnTableColumn } from "../../shared/interfaces/cdn-table.interface";

@Component({
  selector: "app-staff-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminSidebarComponent,
    QueryBarComponent,
    CdnTableComponent,
    CdnTableCellDirective,
    CdnTableActionsDirective,
    CdnTableCardDirective,
    ActionsComponent,
  ],
  templateUrl: "./staff.page.html",
  styleUrls: ["./staff.page.scss"],
})
export class StaffPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly api = inject(BusinessService);
  readonly router = inject(Router);
  staff: any[] = [];
  search = "";
  filter = "";
  viewMode: "table" | "card" = "table";
  profileMenu = false;
  error = "";
  message = "";
  selectedStaff: any;
  modalMode: "view" | "edit" | null = null;
  addOpen = false;
  editName = "";
  editEmail = "";
  editPhone = "";
  editArea = "";
  editActive = true;
  inviteMode = "invite";
  temporaryPassword = "";
  saving = false;
  inviteToken = "";
  readonly filters = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "On Leave", value: "leave" },
  ];
  readonly columns: CdnTableColumn<any>[] = [
    { key: "full_name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Mobile" },
    { key: "assigned_pickups", header: "Assigned Pickups" },
    { key: "account_status", header: "Status" },
  ];
  get initials(): string {
    return (this.auth.session?.fullName || "Admin")
      .split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  get filteredStaff(): any[] {
    const q = this.search.trim().toLowerCase();
    return this.staff.filter(
      (member) =>
        (!q ||
          `${member.full_name || ""} ${member.email || ""} ${member.phone || ""}`
            .toLowerCase()
            .includes(q)) &&
        (!this.filter ||
          (this.filter === "active"
            ? member.account_status === "ACTIVE"
            : this.filter === "inactive"
              ? member.account_status !== "ACTIVE"
              : member.availability_status === "ON_LEAVE")),
    );
  }
  async ngOnInit(): Promise<void> {
    await this.load();
  }
  async load(): Promise<void> {
    try {
      this.staff = await this.api.staff();
    } catch (error) {
      this.error = this.auth.errorMessage(error, "Could not load staff.");
    }
  }
  openAddStaff(): void {
    this.addOpen = true;
    this.error = "";
    this.inviteToken = "";
    this.editName = "";
    this.editEmail = "";
    this.editPhone = "";
    this.editArea = "";
    this.editActive = true;
    this.inviteMode = "invite";
    this.temporaryPassword = "";
  }
  closeAddStaff(): void {
    this.addOpen = false;
  }
  async createStaff(): Promise<void> {
    if (
      !this.editName.trim() ||
      !this.editEmail.trim() ||
      !this.editPhone.trim() ||
      !this.editArea.trim()
    )
      return;
    this.saving = true;
    this.error = "";
    try {
      const result = await this.api.inviteStaff(this.editEmail.trim(), {
        fullName: this.editName.trim(),
        mobileNumber: this.editPhone.trim(),
        serviceArea: this.editArea.trim(),
        setupMode: this.inviteMode,
        temporaryPassword: this.temporaryPassword,
      });
      this.inviteToken = result.token || "";
      this.message = "Staff invitation created successfully.";
      this.closeAddStaff();
      await this.load();
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        "Could not create staff account.",
      );
    } finally {
      this.saving = false;
    }
  }
  displayStatus(member: any): string {
    if (member.account_status !== "ACTIVE") return "Inactive";
    if (member.availability_status === "ON_LEAVE") return "On Leave";
    if (member.availability_status === "ON_PICKUP") return "On Pickup";
    return "Available";
  }
  openStaff(member: any, mode: "view" | "edit"): void {
    this.selectedStaff = member;
    this.modalMode = mode;
    this.editName = member.full_name || "";
    this.editEmail = member.email || "";
    this.editPhone = member.phone || "";
    this.editArea = member.service_area || "";
    this.editActive = member.account_status === "ACTIVE";
  }
  closeStaff(): void {
    this.selectedStaff = undefined;
    this.modalMode = null;
  }
  staffActions(member: any): ActionMenuItem[] {
    return [
      {
        id: "view",
        label: "View",
        icon: "◉",
        color: "#159b63",
        action: () => this.openStaff(member, "view"),
      },
      {
        id: "edit",
        label: "Edit",
        icon: "✎",
        color: "#00a878",
        action: () => this.openStaff(member, "edit"),
      },
      {
        id: "toggle",
        label: member.account_status === "ACTIVE" ? "Deactivate" : "Activate",
        icon: "↔",
        color: "#f0a000",
        action: () => void this.toggleStaff(member),
      },
      {
        id: "delete",
        label: "Delete",
        icon: "▣",
        color: "#ef3d3d",
        action: () => void this.deleteStaff(member),
      },
    ];
  }
  async saveStaff(): Promise<void> {
    if (!this.selectedStaff || !this.editName.trim()) return;
    this.error = "";
    try {
      await this.api.updateStaff(this.selectedStaff.id, {
        fullName: this.editName.trim(),
        phone: this.editPhone.trim(),
        serviceArea: this.editArea.trim(),
        accountStatus: this.editActive ? "ACTIVE" : "INACTIVE",
      });
      this.message = "Staff updated successfully.";
      this.closeStaff();
      await this.load();
    } catch (error) {
      this.error = this.auth.errorMessage(error, "Could not update staff.");
    }
  }
  async toggleStaff(member: any): Promise<void> {
    this.error = "";
    try {
      await this.api.updateStaff(member.id, {
        fullName: member.full_name || "",
        phone: member.phone || "",
        serviceArea: member.service_area || "",
        accountStatus:
          member.account_status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      this.message = `${member.full_name || "Staff"} status updated.`;
      await this.load();
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        "Could not update staff status.",
      );
    }
  }
  async deleteStaff(member: any): Promise<void> {
    if (!window.confirm(`Delete ${member.full_name || "this staff member"}?`))
      return;
    this.error = "";
    try {
      await this.api.deleteStaff(member.id);
      this.message = "Staff deleted successfully.";
      await this.load();
    } catch (error) {
      this.error = this.auth.errorMessage(error, "Could not delete staff.");
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
}
