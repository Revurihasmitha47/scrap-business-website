# ScrapFlow

ScrapFlow is a Spring Boot 3.2 + Angular 17 scrap pickup application using local PostgreSQL.

## Local setup

Prerequisites: Java 17, Maven 3.9+, Node.js 18+, npm, and PostgreSQL.

1. Create the `scrap_business` database in PostgreSQL.
2. Copy `api/.env.example` to `api/.env` and set `DATABASE_PASSWORD`.
3. Open `db/migrations/V1__scrapflow_local_postgresql.sql` in DBeaver and run it against `scrap_business`.
4. Start the backend and frontend:

```powershell
cd api
mvn spring-boot:run
```

In another terminal:

```powershell
cd ui
npm install
npm run start
```

Open `http://localhost:4200`. Angular proxies `/api` requests to Spring Boot on port `8000`.

Authentication uses local Spring Security sessions and BCrypt password hashes. Application data is read and written using JDBC against PostgreSQL. Spring Boot does not create or alter tables automatically.

After registering a user, assign administrative or staff roles and client memberships directly in PostgreSQL when needed.
# Email configuration and templates

Apply `db/migrations/V11__email_configuration_and_templates.sql` after the existing migrations. If V11 was already applied, also apply `db/migrations/V12__email_template_metadata.sql`; it adds the template description and version columns required by the template API. Set a stable `EMAIL_SECRET_KEY` in the API environment before saving SMTP credentials; passwords are encrypted at rest and masked in the UI. As an admin, open `/admin/email/configuration` and `/admin/email/templates`. The staff invitation flow uses the active `STAFF_INVITATION` template and replaces `{{fullName}}`, `{{inviteUrl}}`, and `{{expiresInHours}}` before sending through the active SMTP configuration.
