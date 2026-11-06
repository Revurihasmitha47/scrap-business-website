-- Existing installations may already have V11 applied before template metadata was added.
ALTER TABLE email_templates
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

UPDATE email_templates
SET version = 1
WHERE version IS NULL OR version < 1;
