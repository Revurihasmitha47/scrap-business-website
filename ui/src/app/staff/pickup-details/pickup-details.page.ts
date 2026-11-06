import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { BusinessService } from "../../core/business.service";
import { ActionsComponent } from "../../shared/components/actions/actions.component";
import { ActionMenuItem } from "../../shared/interfaces/actions.interface";
import { StaffHeaderComponent } from "../shared/staff-header/staff-header.component";
import { StaffSidebarComponent } from "../shared/staff-sidebar/staff-sidebar.component";

type PaymentRow = {
  amount: number | null;
  paymentMethod: string;
  reference: string;
  notes: string;
};

@Component({
  selector: "app-staff-pickup-details",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ActionsComponent,
    StaffSidebarComponent,
    StaffHeaderComponent,
  ],
  templateUrl: "./pickup-details.page.html",
  styleUrl: "./pickup-details.page.scss",
})
export class StaffPickupDetailsPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(BusinessService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  pickup: any;
  items: any[] = [];
  payments: any[] = [];
  photos: any[] = [];
  pendingPhotos: any[] = [];
  weights: Record<string, number> = {};
  paymentRows: PaymentRow[] = [
    { amount: null, paymentMethod: "CASH", reference: "", notes: "" },
  ];
  remainingPayment: PaymentRow = {
    amount: null,
    paymentMethod: "CASH",
    reference: "",
    notes: "",
  };
  notes = "";
  confirmed = false;
  saving = false;
  showRemaining = false;
  unableReason = "";
  error = "";

  get actualTotal(): number {
    return this.items.reduce(
      (total, item) =>
        total + Number(this.weights[item.id] ?? item.actual_weight ?? 0),
      0,
    );
  }
  get finalTotal(): number {
    return this.items.reduce(
      (total, item) => total + Number(this.itemFinal(item)),
      0,
    );
  }
  get paymentTotal(): string {
    return this.paymentRows
      .reduce((total, payment) => total + Number(payment.amount || 0), 0)
      .toFixed(2);
  }
  get balance(): string {
    return Math.max(0, this.finalTotal - Number(this.paymentTotal)).toFixed(2);
  }
  get isFinalized(): boolean {
    return ["COLLECTED", "COMPLETED"].includes(this.pickup?.status);
  }
  get hasRemainingBalance(): boolean {
    return (
      this.pickup?.status === "COLLECTED" &&
      Number(this.pickup?.payment_balance || 0) > 0
    );
  }

  addressText(value: unknown): string {
    if (!value) return "Address not available";
    if (typeof value === "string") {
      try {
        return this.addressText(JSON.parse(value));
      } catch {
        return value;
      }
    }
    if (typeof value === "object") {
      const address = value as Record<string, unknown>;
      return [address["addressLine1"], address["addressLine2"], address["city"], address["state"], address["postalCode"]]
        .filter(Boolean)
        .join(", ") || "Address not available";
    }
    return String(value);
  }

  get photoCount(): number {
    return this.photos.length;
  }

  async ngOnInit(): Promise<void> {
    try {
      const response = await this.api.staffPickupDetail(
        this.route.snapshot.paramMap.get("id")!,
      );
      this.pickup = response.pickup;
      this.items = response.items || [];
      this.payments = response.payments || [];
      this.photos = response.photos || [];
      for (const item of this.items)
        if (item.actual_weight != null)
          this.weights[item.id] = item.actual_weight;
    } catch (e) {
      this.error = this.auth.errorMessage(e, "Could not load pickup details.");
    }
  }

  onPhotosSelected(_: Event): void {}
  removePendingPhoto(_: any): void {}
  async uploadPhotos(): Promise<void> {}

  actionItems(): ActionMenuItem[] {
    const items: ActionMenuItem[] = [
      {
        id: "back",
        label: "Back to pickups",
        icon: "←",
        action: () => void this.router.navigateByUrl("/staff/my-pickups"),
      },
    ];
    if (this.pickup?.status === "ASSIGNED")
      items.push({
        id: "start",
        label: "Start pickup",
        icon: "▶",
        color: "#ff6333",
        action: () => void this.start(),
      });
    return items;
  }
  itemFinal(item: any): string {
    const weight = this.weights[item.id] ?? item.actual_weight;
    return weight == null
      ? "0.00"
      : (Number(weight) * Number(item.saved_rate || 0)).toFixed(2);
  }
  addPayment(): void {
    this.paymentRows.push({
      amount: null,
      paymentMethod: "CASH",
      reference: "",
      notes: "",
    });
  }
  removePayment(index: number): void {
    this.paymentRows.splice(index, 1);
  }
  async start(): Promise<void> {
    try {
      this.apply(await this.api.startStaffPickup(this.pickup.id));
    } catch (e) {
      this.error = this.auth.errorMessage(e, "Could not start pickup.");
    }
  }

  async markUnable(): Promise<void> {
    if (!this.pickup || !this.unableReason.trim() || this.saving) return;
    this.saving = true;
    this.error = "";
    try {
      this.apply(await this.api.unableStaffPickup(this.pickup.id, this.unableReason.trim()));
      this.unableReason = "";
    } catch (e) {
      this.error = this.auth.errorMessage(e, "Could not update pickup status.");
    } finally {
      this.saving = false;
    }
  }
  async complete(): Promise<void> {
    this.error = "";
    this.saving = true;
    try {
      this.apply(
        await this.api.completeStaffPickup(this.pickup.id, {
          confirmed: this.confirmed,
          notes: this.notes,
          weights: this.items.map((item) => ({
            itemId: item.id,
            actualWeight: Number(this.weights[item.id]),
          })),
          payments: this.paymentRows
            .filter((payment) => Number(payment.amount) > 0)
            .map((payment) => ({
              amount: Number(payment.amount),
              paymentMethod: payment.paymentMethod,
              reference: payment.reference || null,
              notes: payment.notes || null,
            })),
          idempotencyKey: crypto.randomUUID(),
        }),
      );
    } catch (e) {
      this.error = this.auth.errorMessage(
        e,
        "Could not save collection details.",
      );
    } finally {
      this.saving = false;
    }
  }
  async payRemaining(): Promise<void> {
    if (!this.remainingPayment.amount || this.remainingPayment.amount <= 0) {
      this.error = "Enter a payment amount.";
      return;
    }
    this.saving = true;
    try {
      this.apply(
        await this.api.addStaffPayments(this.pickup.id, {
          payments: [
            {
              amount: Number(this.remainingPayment.amount),
              paymentMethod: this.remainingPayment.paymentMethod,
              reference: this.remainingPayment.reference || null,
            },
          ],
          idempotencyKey: crypto.randomUUID(),
        }),
      );
      this.showRemaining = false;
    } catch (e) {
      this.error = this.auth.errorMessage(e, "Could not record payment.");
    } finally {
      this.saving = false;
    }
  }
  private apply(response: any): void {
    this.pickup = response.pickup;
    this.items = response.items || this.items;
    this.payments = response.payments || this.payments;
    this.photos = response.photos || this.photos;
  }
}
