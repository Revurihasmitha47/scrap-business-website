import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminSidebarComponent } from '../../../shared/admin-sidebar.component';
import { EmailAdminService, EmailConfig } from '../email-admin.service';
import { ActionsComponent } from '../../../shared/components/actions/actions.component';
import { CdnTableActionsDirective, CdnTableCellDirective, CdnTableComponent } from '../../../shared/components/cdn-table/cdn-table.component';
import { QueryBarComponent } from '../../../shared/components/query-bar/query-bar.component';
import { ActionMenuItem } from '../../../shared/interfaces/actions.interface';
import { CdnTableColumn } from '../../../shared/interfaces/cdn-table.interface';

@Component({
  selector: 'app-email-configuration-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, QueryBarComponent, CdnTableComponent, CdnTableCellDirective, CdnTableActionsDirective, ActionsComponent],
  templateUrl: './email-configuration.page.html',
  styleUrls: ['./email-configuration.page.scss'],
})
export class EmailConfigurationPage implements OnInit {
  readonly api = inject(EmailAdminService);
  readonly router = inject(Router);
  configs: EmailConfig[] = [];
  form?: EmailConfig;
  search = '';
  filter = '';
  viewMode: 'table' | 'card' = 'table';
  currentPage = 1;
  pageSize = 10;
  loading = false;
  error = '';
  message = '';

  readonly filters = [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }];
  readonly columns: CdnTableColumn<EmailConfig>[] = [
    { key: 'name', header: 'Name' },
    { key: 'environment', header: 'Environment' },
    { key: 'smtp_host', header: 'SMTP Host' },
    { key: 'from_email', header: 'From Email' },
    { key: 'enabled', header: 'Status' },
  ];

  get filteredConfigs(): EmailConfig[] {
    const query = this.search.trim().toLowerCase();
    return this.configs.filter((item) => {
      const matchesSearch = `${item.name} ${item.smtp_host} ${item.from_email}`.toLowerCase().includes(query);
      const matchesFilter = !this.filter || (this.filter === 'active' ? item.enabled : !item.enabled);
      return matchesSearch && matchesFilter;
    });
  }

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    try { this.configs = await this.api.configs(); }
    catch { this.error = 'Could not load email configurations.'; }
    finally { this.loading = false; }
  }

  onSearchChange(value: string): void { this.search = value; this.currentPage = 1; }
  onFilterChange(value: string): void { this.filter = value; this.currentPage = 1; }

  configurationActions(item: EmailConfig): ActionMenuItem[] {
    return [
      { id: 'edit', label: 'Edit', icon: '✎', color: '#159b63', action: () => this.edit(item) },
      { id: 'toggle', label: item.enabled ? 'Disable' : 'Enable', icon: '↔', color: '#f0a000', action: () => void this.toggle(item) },
      { id: 'delete', label: 'Delete', icon: '▣', color: '#ef3d3d', action: () => void this.remove(item) },
    ];
  }

  open(): void {
    this.form = { name: '', environment: 'ALL', provider: 'SMTP', smtp_host: '', smtp_port: 587, smtp_username: '', smtp_password: '', from_email: '', smtp_auth: true, smtp_start_tls: true, smtp_ssl: false, enabled: true };
  }

  edit(item: EmailConfig): void { this.form = { ...item, smtp_password: '********' }; }
  close(): void { this.form = undefined; }

  async save(): Promise<void> {
    if (!this.form) return;
    try { await this.api.saveConfig(this.form); this.message = 'Email configuration saved successfully.'; this.close(); await this.load(); }
    catch { this.error = 'Could not save email configuration.'; }
  }

  async toggle(item: EmailConfig): Promise<void> { await this.api.toggleConfig(item.id!, !item.enabled); this.message = `Configuration ${item.enabled ? 'disabled' : 'enabled'}.`; await this.load(); }
  async remove(item: EmailConfig): Promise<void> { if (!confirm(`Delete ${item.name}?`)) return; await this.api.deleteConfig(item.id!); this.message = 'Email configuration deleted successfully.'; await this.load(); }
  goBack(): void { void this.router.navigateByUrl('/admin/dashboard'); }
}
