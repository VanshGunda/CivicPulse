# CivicPulse Backend

A Java 17 / Spring Boot REST API for reporting and resolving public infrastructure issues. This package is a clean backend project with Spring Boot 3.5.6 and dependency-managed Spring Security; do not mix its individual security JARs with an unrelated Spring Boot 4.x project.

## Features

- JWT access tokens; BCrypt password hashing; no public role selection at registration.
- Resident, staff and admin roles with backend-enforced permissions.
- Issue creation, editing before verification, filtering, full-text-style keyword search, pagination and sorting.
- Status transition rules and timestamped status history.
- Staff assignment, department management and workload list.
- Location/category-based duplicate warnings using Haversine distance.
- Public comments and restricted staff-only internal notes.
- Community support/upvote for reports.
- Authenticated image uploads (JPEG/PNG/WEBP, 5 MB maximum) with random stored names; the frontend can submit the returned URL with an issue.
- Staff/admin priority updates that refresh the issue SLA due time.
- In-app notifications for status and assignment changes, read state and unread count.
- Dashboard counts by status/category, overdue reports and average resolution time for up to the 1,000 most recently resolved cases.
- Request validation, consistent API errors, optimistic locking on issues, database indexes and batched support counts on paged issue results.
- OpenAPI / Swagger UI and a context-load test using H2.

## Requirements

- JDK 17 or later
- Maven (the Maven Wrapper is recommended; generate one with your IDE if missing)
- MySQL 8.x, or the optional `docker-compose.yml`
- React/Vite frontend is assumed to run at `http://localhost:5173`

## Run locally

1. Create a database or start the optional MySQL service:

   ```sql
   CREATE DATABASE civicpulse_db;
   ```

   Optional Docker alternative:

   ```bash
   docker compose up -d mysql
   ```

2. Set database variables. For a local XAMPP/MySQL instance with a blank root password, the defaults in `application.properties` work; for Docker, set `DB_USERNAME=civicpulse` and `DB_PASSWORD` to the value used for `MYSQL_PASSWORD`.

3. Set a strong `JWT_SECRET` of at least 32 UTF-8 bytes for any shared or deployed environment. Do not commit secrets.

4. Start the application from this directory:

   ```bash
   ./mvnw spring-boot:run
   ```

   On Windows, use `mvnw.cmd spring-boot:run` if a Maven wrapper is present, or `mvn spring-boot:run` if Maven is installed.

5. Verify the backend at `http://localhost:8080/api/health`.

6. Open interactive API docs at `http://localhost:8080/swagger-ui.html`.

The default schema setting is `update` for local development only. Use a migration tool such as Flyway and set `DDL_AUTO=validate` for production.

## Bootstrap first admin

Public registration always creates a `RESIDENT`. To safely create the first administrator, set **both** environment variables before the first startup:

- `BOOTSTRAP_ADMIN_EMAIL=admin@example.com`
- `BOOTSTRAP_ADMIN_PASSWORD` to a unique password of at least 12 characters

The initializer creates that account only if the email does not already exist. After the account is created, remove those variables from your environment. Never hardcode production credentials in `application.properties` or the repository. You can create staff users later through the admin role-management API.

If you only have the earlier prototype project, either open this folder as a separate Maven project or move the backend source as a whole and align `pom.xml`; do not copy Spring Security 6.x JAR versions into a Boot 4.x project.

## API conventions

All issue/user/department/notification endpoints except health and auth require `Authorization: Bearer <accessToken>`. The token is returned from register/login. Enum values are uppercase.

### Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/register` | Public | Create resident account and token |
| POST | `/api/auth/login` | Public | Login and token |
| GET | `/api/auth/me` | Authenticated | Current user |

Register body:

```json
{"name":"Asha Patil","email":"asha@example.com","password":"a-strong-password-123"}
```

Login body:

```json
{"email":"asha@example.com","password":"a-strong-password-123"}
```

### Issues

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/issues` | Authenticated | Create report; returns issue and potential duplicates |
| GET | `/api/issues` | Authenticated | Filter/search/page reports |
| GET | `/api/issues/mine` | Authenticated | Current user's reports |
| GET | `/api/issues/assigned` | Staff/Admin | Work assigned to current staff member |
| GET | `/api/issues/{id}` | Authenticated | Report detail |
| PUT | `/api/issues/{id}` | Reporter, while SUBMITTED | Edit own draft-stage report |
| PATCH | `/api/issues/{id}/status` | Staff/Admin | Change status under transition rules |
| PATCH | `/api/issues/{id}/priority` | Staff/Admin | Change priority and recalculate due time |
| POST | `/api/uploads/images` | Authenticated | Upload a JPEG/PNG/WEBP image as multipart field `file` (max 5 MB) |
| PATCH | `/api/issues/{id}/assignment` | Admin | Assign an enabled staff member and optional department |
| GET | `/api/issues/{id}/history` | Authenticated | Timeline of status changes |
| GET/POST | `/api/issues/{id}/comments` | Authenticated | View/add comments; residents cannot view/create internal notes |
| POST/DELETE | `/api/issues/{id}/support` | Authenticated | Support/un-support a report |
| GET | `/api/issues/duplicate-check` | Authenticated | Find nearby active reports by category and coordinates |

Issue list supports query parameters: `status`, `category`, `priority`, `q`, `page`, `size`, and `sort`. Page size is capped at 100. For example:

`GET /api/issues?status=IN_PROGRESS&category=ROAD_DAMAGE&q=pothole&page=0&size=10`

Create issue body:

```json
{
  "title": "Large pothole near the bus stop",
  "description": "The road surface is broken and vehicles are swerving around it.",
  "category": "ROAD_DAMAGE",
  "address": "Near Main Road bus stop",
  "latitude": 18.5204,
  "longitude": 73.8567,
  "photoUrl": null,
  "departmentId": null
}
```

### Status workflow

- `SUBMITTED` → `VERIFIED` or `REJECTED`
- `VERIFIED` → `ASSIGNED`, `IN_PROGRESS` or `REJECTED`
- `ASSIGNED` → `IN_PROGRESS` or `REJECTED`
- `IN_PROGRESS` → `RESOLVED` or `REJECTED`
- `RESOLVED` → `IN_PROGRESS` (reopen)
- `REJECTED` → `SUBMITTED` by an admin only

A rejection requires a reason in the `comment` field. All changes are saved in the status history.

Status body example:

```json
{"status":"IN_PROGRESS","comment":"Repair team has started work."}
```

Assignment body example:

```json
{"assigneeId":2,"departmentId":1}
```

### Departments, admin, dashboard and notifications

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/departments` | Authenticated | Active departments |
| GET | `/api/departments/admin/all` | Admin | All departments, including inactive |
| POST/PUT/DELETE | `/api/departments[/{id}]` | Admin | Create/update/soft-deactivate department |
| GET | `/api/admin/users` | Admin | Paginated/search users |
| PATCH | `/api/admin/users/{id}/role` | Admin | Change role |
| PATCH | `/api/admin/users/{id}/enabled` | Admin | Enable/disable account |
| GET | `/api/dashboard/summary` | Staff/Admin | Status/category counts, overdue count, average resolution time |
| GET | `/api/notifications` | Authenticated | Current user's notifications |
| GET | `/api/notifications/unread-count` | Authenticated | Unread notification count |
| PATCH | `/api/notifications/{id}/read` | Notification owner | Mark own notification read |

Role body: `{"role":"STAFF"}`. Enabled body: `{"enabled":false}`. A user cannot change their own role or disable their own account through these endpoints.

## Optimization and production notes

- Paginated endpoints cap page size at 100.
- Related entities are fetched explicitly for issue list/detail endpoints to reduce lazy-load queries.
- Support counts for a page are fetched in one grouped query instead of one query per issue.
- Useful database indexes are defined on email, status/date, category/status, reporter, assignee, due date, support and notification lookup columns.
- JPA optimistic locking (`@Version`) is enabled for issue rows.
- The application is stateless; tokens are revalidated against the current user and enabled state on requests.
- Uploads use local disk by default. Use persistent or managed object storage before running multiple backend instances; issue images are publicly readable because reports are intended for public civic tracking.
- Use HTTPS, a cryptographically random secret, managed secrets, rate limiting at the gateway, database backups, migrations and monitoring before real deployment.
- Duplicate detection scans up to the 200 most recent active issues of the requested category before distance filtering. For large production datasets, use MySQL spatial indexes or a dedicated geospatial query.
- Notifications are stored in-app; no external email/SMS provider is configured in this version.

## Tests

```bash
mvn test
```

The context-load test uses an in-memory H2 database. The MySQL runtime configuration is not used by that test.

## Postman smoke test collection

Import `docs/CivicPulse.postman_collection.json` into Postman, update the `email` and `password` collection variables, then run Health → Register Resident or Login → Current User → List Issues. To test staff/admin endpoints, sign in with a bootstrapped admin and promote a resident to `STAFF` using `/api/admin/users/{id}/role`.
