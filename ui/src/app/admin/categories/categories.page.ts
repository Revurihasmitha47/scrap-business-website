import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { BusinessService, Category } from "../../core/business.service";
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
  selector: "app-categories-page",
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
  templateUrl: "./categories.page.html",
  styleUrls: ["./categories.page.scss"],
})
export class CategoriesPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly api = inject(BusinessService);
  readonly router = inject(Router);
  categories: Category[] = [];
  search = "";
  viewMode: "table" | "card" = "table";
  newCategory = "";
  filter = "";
  error = "";
  message = "";
  profileMenu = false;
  selectedCategory?: Category;
  modalMode: "view" | "edit" | "add" | null = null;
  editCategoryName = "";
  editCategoryDescription = "";
  editCategoryActive = true;
  readonly filters = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];
  readonly columns: CdnTableColumn<Category>[] = [
    { key: "name", header: "Name" },
    { key: "description", header: "Description" },
    {
      key: "status",
      header: "Status",
      formatter: (row) => (row.is_active === false ? "Inactive" : "Active"),
    },
    { key: "created_at", header: "Created At" },
  ];

  get initials(): string {
    return (this.auth.session?.fullName || "Admin")
      .split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  get filteredCategories(): Category[] {
    const query = this.search.trim().toLowerCase();
    return this.categories.filter(
      (category) =>
        (!query ||
          `${category.name} ${category.description || ""}`
            .toLowerCase()
            .includes(query)) &&
        (!this.filter ||
          (this.filter === "active"
            ? category.is_active !== false
            : category.is_active === false)),
    );
  }

  async ngOnInit(): Promise<void> {
    await this.loadCategories();
  }
  async loadCategories(): Promise<void> {
    try {
      this.categories = await this.api.adminCategories();
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        "Could not load scrap categories.",
      );
    }
  }
  openAddCategory(): void {
    this.selectedCategory = undefined;
    this.modalMode = "add";
    this.editCategoryName = "";
    this.editCategoryDescription = "";
    this.editCategoryActive = true;
  }
  categoryActions(category: Category): ActionMenuItem[] {
    return [
      {
        id: "view",
        label: "View",
        icon: "◉",
        color: "#159b63",
        action: () => this.openCategory(category, "view"),
      },
      {
        id: "edit",
        label: "Edit",
        icon: "✎",
        color: "#00a878",
        action: () => this.openCategory(category, "edit"),
      },
      {
        id: "toggle",
        label: "Toggle Status",
        icon: "⇄",
        color: "#f0a000",
        action: () => void this.toggleCategory(category),
      },
      {
        id: "delete",
        label: "Delete",
        icon: "▣",
        color: "#ef3d3d",
        action: () => void this.deleteCategory(category),
      },
    ];
  }
  async toggleCategory(category: Category): Promise<void> {
    this.error = "";
    try {
      await this.api.updateCategory(category.id, {
        name: category.name,
        description: category.description || "",
        isActive: category.is_active === false,
      });
      this.message = `${category.name} is now ${category.is_active === false ? "Active" : "Inactive"}.`;
      await this.loadCategories();
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        "Could not toggle category status.",
      );
    }
  }
  async deleteCategory(category: Category): Promise<void> {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    this.error = "";
    try {
      await this.api.deleteCategory(category.id);
      this.message = "Category deleted successfully.";
      await this.loadCategories();
    } catch (error) {
      this.error = this.auth.errorMessage(error, "Could not delete category.");
    }
  }
  openCategory(category: Category, mode: "view" | "edit"): void {
    this.selectedCategory = category;
    this.modalMode = mode;
    this.editCategoryName = category.name;
    this.editCategoryDescription = category.description || "";
    this.editCategoryActive = category.is_active !== false;
  }
  closeCategory(): void {
    this.selectedCategory = undefined;
    this.modalMode = null;
  }
  async saveCategory(): Promise<void> {
    if (!this.editCategoryName.trim()) return;
    this.error = "";
    this.message = "";
    const body = {
      name: this.editCategoryName.trim(),
      description: this.editCategoryDescription.trim(),
      isActive: this.editCategoryActive,
    };
    try {
      if (this.modalMode === "add") {
        await this.api.createCategory(body);
        this.message = "Category added successfully.";
      } else if (this.selectedCategory) {
        await this.api.updateCategory(this.selectedCategory.id, body);
        this.message = "Category updated successfully.";
      }
      this.closeCategory();
      await this.loadCategories();
    } catch (error) {
      this.error = this.auth.errorMessage(
        error,
        this.modalMode === "add"
          ? "Could not add category."
          : "Could not update category.",
      );
    }
  }
  navigateView(view: AdminView): void {
    if (view === "dashboard")
      void this.router.navigateByUrl("/admin/dashboard");
    else if (view === "pickups")
      void this.router.navigateByUrl("/admin/pickups");
    else if (view === "staff") void this.router.navigateByUrl("/admin/staff");
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
