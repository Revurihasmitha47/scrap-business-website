import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminSidebarComponent } from '../../../shared/admin-sidebar.component';
import { EmailAdminService, EmailTemplate, EmailTemplateType } from '../email-admin.service';
import { ActionsComponent } from '../../../shared/components/actions/actions.component';
import { CdnTableActionsDirective, CdnTableCellDirective, CdnTableComponent } from '../../../shared/components/cdn-table/cdn-table.component';
import { QueryBarComponent } from '../../../shared/components/query-bar/query-bar.component';
import { ActionMenuItem } from '../../../shared/interfaces/actions.interface';
import { CdnTableColumn } from '../../../shared/interfaces/cdn-table.interface';

@Component({
  selector: 'app-email-templates-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, QueryBarComponent, CdnTableComponent, CdnTableCellDirective, CdnTableActionsDirective, ActionsComponent],
  templateUrl: './email-templates.page.html',
  styleUrls: ['./email-templates.page.scss'],
})
export class EmailTemplatesPage implements OnInit {
  readonly api = inject(EmailAdminService);
  readonly router = inject(Router);
  templates: EmailTemplate[] = [];
  types: EmailTemplateType[] = [];
  form?: EmailTemplate;
  typeForm?: EmailTemplateType;
  search = '';
  filter = '';
  viewMode: 'table' | 'card' = 'table';
  currentPage = 1;
  pageSize = 10;
  loading = false;
  error = '';
  message = '';
  htmlVisualMode = false;

  readonly filters = [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }];
  readonly columns: CdnTableColumn<EmailTemplate>[] = [
    { key: 'template_type_name', header: 'Type' },
    { key: 'name', header: 'Name' },
    { key: 'subject', header: 'Subject' },
    { key: 'active', header: 'Status' },
  ];

  get filteredTemplates(): EmailTemplate[] {
    const query = this.search.trim().toLowerCase();
    return this.templates.filter((item) => {
      const matchesSearch = `${item.name} ${item.template_key} ${item.subject} ${item.template_type_name || ''}`.toLowerCase().includes(query);
      const matchesFilter = !this.filter || (this.filter === 'active' ? item.active : !item.active);
      return matchesSearch && matchesFilter;
    });
  }

  async ngOnInit(): Promise<void> { await Promise.all([this.load(), this.loadTypes()]); }
  async load(): Promise<void> { this.loading = true; try { this.templates = await this.api.templates(); } catch { this.error = 'Could not load email templates.'; } finally { this.loading = false; } }
  async loadTypes(): Promise<void> { this.types = await this.api.templateTypes(); }
  onSearchChange(value: string): void { this.search = value; this.currentPage = 1; }
  onFilterChange(value: string): void { this.filter = value; this.currentPage = 1; }

  get detectedVariables(): string[] {
    const content = `${this.form?.subject || ''} ${this.form?.html_content || ''} ${this.form?.text_content || ''}`;
    return [...new Set([...content.matchAll(/{{\s*([A-Za-z0-9_.-]+)\s*}}/g)].map((match) => match[1]))].sort();
  }

  autoGenerateVariables(): void {
    if (!this.form) return;
    const schema: Record<string, { type: string; description: string; required: boolean }> = {};
    for (const variable of this.detectedVariables) {
      schema[variable] = { type: 'string', description: `Auto-detected variable: ${variable}`, required: true };
    }
    this.form.variables_json = JSON.stringify(schema, null, 2);
  }

  templateActions(item: EmailTemplate): ActionMenuItem[] {
    return [
      { id: 'edit', label: 'Edit', icon: '✎', color: '#159b63', action: () => this.edit(item) },
      { id: 'toggle', label: item.active ? 'Disable' : 'Enable', icon: '↔', color: '#f0a000', action: () => void this.toggle(item) },
      { id: 'delete', label: 'Delete', icon: '▣', color: '#ef3d3d', action: () => void this.remove(item) },
    ];
  }

  open(): void { this.form = { template_key: '', name: '', description: '', version: 1, subject: '', html_content: '', text_content: '', variables_json: '{}', active: true, template_type_id: this.types[0]?.id }; }
  edit(item: EmailTemplate): void { this.form = { ...item }; }
  openType(): void { this.typeForm = { type_key: '', name: '', description: '', active: true }; }
  close(): void { this.form = undefined; }
  closeType(): void { this.typeForm = undefined; }
  async save(): Promise<void> { if (!this.form) return; try { await this.api.saveTemplate(this.form); this.message = 'Email template saved successfully.'; this.close(); await this.load(); } catch { this.error = 'Could not save email template.'; } }
  async saveType(): Promise<void> { if (!this.typeForm) return; try { await this.api.saveTemplateType(this.typeForm); this.message = 'Template type saved successfully.'; this.closeType(); await this.loadTypes(); } catch { this.error = 'Could not save template type.'; } }
  async toggle(item: EmailTemplate): Promise<void> { await this.api.toggleTemplate(item.id!, !item.active); this.message = `Template ${item.active ? 'disabled' : 'enabled'}.`; await this.load(); }
  async remove(item: EmailTemplate): Promise<void> { if (!confirm(`Delete ${item.name}?`)) return; await this.api.deleteTemplate(item.id!); this.message = 'Email template deleted successfully.'; await this.load(); }
  goBack(): void { void this.router.navigateByUrl('/admin/dashboard'); }
}
