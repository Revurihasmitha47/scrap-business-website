import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-data-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-data-toolbar">
      <label class="admin-search"><span aria-hidden="true">⌕</span><input [ngModel]="search" (ngModelChange)="searchChange.emit($event)" [placeholder]="searchPlaceholder"></label>
      <button type="button" class="admin-filter-button" (click)="filtersOpen=!filtersOpen">☷ <span>Filters</span><b *ngIf="status">1</b></button>
      <div class="admin-filter-panel" *ngIf="filtersOpen">
        <label>Status<select [ngModel]="status" (ngModelChange)="statusChange.emit($event)"><option value="">All statuses</option><option *ngFor="let item of statusOptions" [value]="item">{{ item }}</option></select></label>
        <button type="button" (click)="statusChange.emit('');filtersOpen=false">Clear</button>
      </div>
      <span class="admin-toolbar-spacer"></span>
      <div class="admin-view-toggle" aria-label="View mode">
        <button type="button" [class.active]="viewMode==='table'" (click)="viewModeChange.emit('table')">☷</button>
        <button type="button" [class.active]="viewMode==='card'" (click)="viewModeChange.emit('card')">▦</button>
      </div>
    </div>
    <div class="admin-pagination" *ngIf="total > 0">
      <label>SIZE <select [ngModel]="pageSize" (ngModelChange)="pageSizeChange.emit(+$event)"><option [value]="5">5</option><option [value]="10">10</option><option [value]="25">25</option></select></label>
      <span>{{ pageStart }}-{{ pageEnd }} of {{ total }}</span>
      <div><button type="button" [disabled]="page===1" (click)="pageChange.emit(page-1)">‹</button><strong>{{ page }}</strong><button type="button" [disabled]="page>=pageCount" (click)="pageChange.emit(page+1)">›</button></div>
    </div>
  `
})
export class AdminDataToolbarComponent {
  @Input() search = '';
  @Input() searchPlaceholder = 'Search...';
  @Input() status = '';
  @Input() statusOptions: string[] = [];
  @Input() viewMode: 'table' | 'card' = 'table';
  @Input() total = 0;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Output() searchChange = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<string>();
  @Output() viewModeChange = new EventEmitter<'table' | 'card'>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  filtersOpen = false;
  get pageCount(): number { return Math.max(1, Math.ceil(this.total / this.pageSize)); }
  get pageStart(): number { return this.total ? (this.page - 1) * this.pageSize + 1 : 0; }
  get pageEnd(): number { return Math.min(this.total, this.page * this.pageSize); }
}
