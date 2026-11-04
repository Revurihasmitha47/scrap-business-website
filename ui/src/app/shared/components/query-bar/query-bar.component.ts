import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type QueryFilter = {
  label: string;
  value: string;
};

@Component({
  selector: 'app-query-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './query-bar.component.html',
  styleUrls: ['./query-bar.component.scss']
})
export class QueryBarComponent {
  @Input() searchValue = '';
  @Input() searchPlaceholder = 'Search...';
  @Input() filters: QueryFilter[] = [];
  @Input() selectedFilter = '';
  @Input() viewMode: 'table' | 'card' = 'table';

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<string>();
  @Output() viewModeChange = new EventEmitter<'table' | 'card'>();

  filterOpen = false;
  filterPanelStyle: Record<string, string> = {};

  toggleFilters(event: MouseEvent): void {
    this.filterOpen = !this.filterOpen;

    if (!this.filterOpen) {
      return;
    }

    const button = event.currentTarget as HTMLElement;
    const bounds = button.getBoundingClientRect();

    this.filterPanelStyle = {
      top: `${bounds.bottom + 8}px`,
      left: `${Math.max(8, bounds.left)}px`
    };
  }
}
