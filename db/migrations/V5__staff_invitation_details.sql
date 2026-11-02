-- Preserve Staff setup details submitted by Admin before invitation acceptance.
alter table staff_invitations add column if not exists full_name text;
alter table staff_invitations add column if not exists phone text;
alter table staff_invitations add column if not exists service_area text;
alter table staff_invitations add column if not exists setup_mode text not null default 'INVITE';
