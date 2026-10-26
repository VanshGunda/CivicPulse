# CivicPulse Frontend

A responsive React/Vite client for the CivicPulse civic issue reporting platform. The interface is built with custom CSS (no Bootstrap or Tailwind dependency), Lucide icons, Recharts and Leaflet/OpenStreetMap.

## Included experiences

- JWT login and resident registration, session restoration and role-aware routing.
- Resident overview, report explorer, create-report flow and personal report list.
- Staff operations dashboard, assigned queue, status transitions, priority/SLA updates and staff-only internal notes.
- Admin department management, user role/access controls and staff assignment.
- Issue detail with status timeline, comments, community support, department/staff context and location link.
- Map-pin issue location selection, image preview/upload (JPEG/PNG/WEBP, backend maximum 5 MB) and nearby duplicate checks.
- Notification inbox with unread state.
- Search, filters, pagination, loading/empty/error states, toast feedback, responsive mobile navigation and client-side error boundary.
- Lazy-loaded route modules, paginated requests, debounced issue search, request timeout and an API connectivity indicator.

## Requirements

- Node.js 18+ (Node 20 or 22 recommended)
- npm
- CivicPulse Spring Boot backend running at `http://localhost:8080`

This frontend is aligned with the CivicPulse backend API from the supplied `CivicPulseBackend` project. It does not use fake data if the backend is unavailable; it shows a connection or request error instead.

## Start locally

1. Extract the frontend ZIP and open the `CivicPulseFrontend` folder in VS Code.
2. Open the terminal in this folder.
3. Install packages:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env` if you need to change the API address. By default:

   ```env
   VITE_API_BASE_URL=http://localhost:8080
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:5173`.

7. Make sure the backend CORS property permits `http://localhost:5173` and the backend is running. The health indicator appears in the footer.

## Build for production

```bash
npm run build
npm run preview
```

The static production output is written to `dist/`. Configure your hosting platform to rewrite client-side routes back to `index.html`.

## Connect to the backend

The API client in `src/api/client.js`:

- Reads `VITE_API_BASE_URL` (defaults to port 8080).
- Adds the current access token to authenticated requests.
- Uses a 15-second request timeout.
- Clears the client session after a protected request returns HTTP 401.

Auth tokens are stored in `sessionStorage`, so the session does not persist after the browser tab/session is closed. For production deployments, evaluate a backend-managed secure, HttpOnly cookie design and your threat model; any token readable by JavaScript can be exposed by an XSS vulnerability.

The frontend uses the API routes defined in the backend README, including `/api/auth/*`, `/api/issues/*`, `/api/dashboard/summary`, `/api/departments`, `/api/admin/users`, `/api/notifications/*` and `/api/uploads/images`.

## Important integration notes

- Residents can register through the public registration endpoint; their role is assigned by the backend.
- Dashboard data for staff/admin is fetched from the actual dashboard summary endpoint.
- The backend's current `mine` and `assigned` list endpoints provide pagination but not server-side filter fields; those queue pages filter within the latest 100 records returned by the API. For large deployments, add backend filter/search parameters to those endpoints.
- The report browser uses server-side search/filter/pagination.
- The map uses OpenStreetMap tiles and requires a network connection to render tile imagery. Location can also be omitted; the issue address remains required.
- Image uploads go through the authenticated backend endpoint. The server currently uses its configured storage implementation.
- This frontend was source/syntax checked in the generation environment, but a complete Vite production build could not be run there because npm registry access was unavailable. Run `npm install` and `npm run build` in your local environment to complete installation/build verification.

## Folder structure

```text
CivicPulseFrontend/
├── public/
├── src/
│   ├── api/              # Axios client and backend API functions
│   ├── components/       # Shared UI, issue visuals, toast and error boundary
│   ├── context/          # Authentication/session context
│   ├── layouts/          # Main app shell and navigation
│   ├── pages/            # Login, dashboards, reports, departments, users, notifications
│   ├── utils/            # Labels and formatters
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```
