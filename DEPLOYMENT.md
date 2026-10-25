# Deployment

The backend can serve the built frontend and API from one HTTPS domain. This
is the simplest deployment option and keeps API requests same-origin.

## Node service

Configure the host to use the `backend` directory as its service root:

- Node.js: 20.19+ (or 22.12+)
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`

The build command also installs the frontend dependencies and builds the SPA
into `frontend/dist`. Set the environment variables below in the host dashboard;
do not upload or commit either local `.env` file.

Required environment:

- `NODE_ENV=production`
- `SERVE_FRONTEND=true`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`: generate a long, unique random secret
- `APP_URL`: the public HTTPS site URL
- `CORS_ORIGINS`: comma-separated additional frontend origins, or leave empty
  when the frontend is served from `APP_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`

Copy [backend/.env.example](./backend/.env.example) as a reference, replacing
every placeholder in the host's environment settings. The frontend uses
same-origin `/api` requests by default. `APP_URL` is automatically allowed for
the frontend and should match the public site origin. For a separately hosted
API, set `VITE_API_BASE_URL` to its HTTPS origin at build time and set
`CORS_ORIGINS` to the exact frontend origin.

## Database and uploads

Provision a reachable MySQL database, then run `npm run migrate` from the
backend directory once before serving traffic. Back up the database. Mount
persistent private storage for `backend/private-documents` if uploaded student
documents must survive service restarts or redeployments.

After deployment, verify `/api/health`, registration/login, email delivery,
document upload/download, and the student, company, and admin workflows on the
public HTTPS domain.
