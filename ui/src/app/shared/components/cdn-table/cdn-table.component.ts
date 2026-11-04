import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  Component,
  ContentChild,
  ContentChildren,
  Directive,
  EventEmitter,
  Input,
  Output,
  QueryList,
  TemplateRef
} from '@angular/core';

import { CdnTableColumn } from '../../interfaces/cdn-table.interface';
import { PaginationComponent } from '../pagination/pagination.component';

@Directive({
  selector: 'ng-template[cdnTableCell]',
  standalone: true
})
export class CdnTableCellDirective {
  @Input('cdnTableCell') key = '';

  constructor(public template: TemplateRef<unknown>) {}
}

@Directive({
  selector: 'ng-template[cdnTableActions]',
  standalone: true
})
export class CdnTableActionsDirective {
  constructor(public template: TemplateRef<unknown>) {}
}

@Directive({
  selector: 'ng-template[cdnTableCard]',
  standalone: true
})
export class CdnTableCardDirective {
  constructor(public template: TemplateRef<unknown>) {}
}

@Component({
  selector: 'app-cdn-table',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './cdn-table.component.html',
  styleUrls: ['./cdn-table.component.scss']
})
export class CdnTableComponent<T = unknown> implements AfterContentInit {
  @Input() columns: CdnTableColumn<T>[] = [];
  @Input() rows: T[] = [];
  @Input() loading = false;
  @Input() pagination: boolean | string = true;
  @Input() viewMode: 'list' | 'card' = 'list';
  @Input() pageSize = 10;
  @Input() currentPage = 1;
  @Input() pageSizeOptions = [5, 10, 25, 50];
  @Input() trackByFn: (index: number, row: T) => unknown = (_, row: any) => row?.id;
  @Input() emptyMessage = 'No records found.';

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  @ContentChildren(CdnTableCellDirective)
  cells!: QueryList<CdnTableCellDirective>;

  @ContentChild(CdnTableActionsDirective)
  actions?: CdnTableActionsDirective;

  @ContentChild(CdnTableCardDirective)
  card?: CdnTableCardDirective;

  cellMap = new Map<string, TemplateRef<unknown>>();

  ngAfterContentInit(): void {
    this.rebuildCellMap();
    this.cells?.changes.subscribe(() => this.rebuildCellMap());
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.pageChange.emit(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.pageSizeChange.emit(size);
  }

  get pagedRows(): T[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.rows.slice(start, start + this.pageSize);
  }

  getValue(row: T, key: string): unknown {
    return key.split('.').reduce((value: any, part) => value?.[part], row);
  }

  getCell(column: CdnTableColumn<T>, row: T): string | number | null | undefined {
    return column.formatter
      ? column.formatter(row)
      : this.getValue(row, column.key) as string | number | null | undefined;
  }

  private rebuildCellMap(): void {
    this.cellMap.clear();
    this.cells?.forEach((cell) => this.cellMap.set(cell.key, cell.template));
  }
}
