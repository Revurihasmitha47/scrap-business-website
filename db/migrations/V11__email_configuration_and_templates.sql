create extension if not exists pgcrypto;

create table if not exists email_configurations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  environment text not null default 'ALL',
  provider text not null default 'SMTP',
  smtp_host text not null,
  smtp_port integer not null default 587 check (smtp_port between 1 and 65535),
  smtp_username text not null,
  smtp_password text not null,
  from_email text not null,
  from_name text,
  smtp_auth boolean not null default true,
  smtp_start_tls boolean not null default true,
  smtp_ssl boolean not null default false,
  enabled boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists email_configurations_active_idx on email_configurations(environment, enabled);

create table if not exists email_template_types (
  id uuid primary key default gen_random_uuid(),
  type_key text not null unique,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  template_type_id uuid references email_template_types(id) on delete set null,
  template_key text not null unique,
  name text not null,
  description text,
  version integer not null default 1,
  subject text not null,
  html_content text not null,
  text_content text,
  variables_json jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists email_templates_active_idx on email_templates(template_key, active);
alter table email_templates add column if not exists template_type_id uuid references email_template_types(id) on delete set null;
alter table email_templates add column if not exists description text;
alter table email_templates add column if not exists version integer not null default 1;
update email_templates t set template_type_id = tt.id
from email_template_types tt
where t.template_type_id is null and t.template_key = tt.type_key;
create index if not exists email_templates_type_idx on email_templates(template_type_id, active);
