import { CommonModule } from '@angular/common';
import { Component, HostListener, Input } from '@angular/core';

import { ActionMenuItem } from '../../interfaces/actions.interface';

@Component({
  selector: 'app-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.scss']
})
export class ActionsComponent {
  @Input() items: ActionMenuItem[] = [];

  open = false;
  menuStyle: Record<string, string> = {};

  toggle(event: MouseEvent): void {
    this.open = !this.open;

    if (!this.open) {
      return;
    }

    const button = event.currentTarget as HTMLElement;
    const bounds = button.getBoundingClientRect();
    const menuHeight = Math.max(48, this.items.length * 40 + 12);
    const menuWidth = 180;
    const openAbove = bounds.bottom + menuHeight > window.innerHeight;
    const top = openAbove ? bounds.top - menuHeight - 6 : bounds.bottom + 6;
    const left = Math.min(bounds.right - menuWidth, window.innerWidth - menuWidth - 12);

    this.menuStyle = {
      top: `${Math.max(8, top)}px`,
      left: `${Math.max(8, left)}px`
    };
  }

  choose(item: ActionMenuItem): void {
    this.open = false;
    item.action();
  }

  @HostListener('document:click')
  close(): void {
    this.open = false;
  }
}
