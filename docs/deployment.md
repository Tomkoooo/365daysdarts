# Production deployment (Docker)

## Why dev works but production fails with `Authentication failed`

| Environment | Typical `MONGODB_URI` |
|-------------|------------------------|
| Local (`.env.local`) | `mongodb://192.168.0.12:27017/` — often **no username/password** |
| Old Docker setup | `mongodb://admin:admin@sironicsrv:27017/` — **wrong** if Mongo does not use that user |

MongoDB error code **18** means the username/password (or `authSource`) in `MONGODB_URI` does not match the server. This is unrelated to NextAuth.

## Setup on the server

1. Copy the example env file:

   ```bash
   cp .env.production.example .env.production
   ```

2. Edit `.env.production` with **production** values:

   - `MONGODB_URI` — same host/credentials your MongoDB actually expects (ask whoever runs `sironicsrv`, or match your Mongo UI / `mongosh` login).
   - `DB_NAME` — same database name you use in dev if you want the same data layout (e.g. `365days_test` or `365days`).
   - `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` — your public HTTPS URL.
   - `NEXTAUTH_SECRET`, Google OAuth, Stripe, etc.

3. Examples for `MONGODB_URI`:

   ```bash
   # No authentication (only if Mongo allows it on the Docker network)
   MONGODB_URI=mongodb://sironicsrv:27017/

   # With authentication
   MONGODB_URI=mongodb://myuser:mypassword@sironicsrv:27017/?authSource=admin
   ```

4. Restart the app:

   ```bash
   docker compose pull
   docker compose up -d
   ```

5. Verify env inside the container:

   ```bash
   docker exec 365daysdarts printenv MONGODB_URI
   docker exec 365daysdarts printenv DB_NAME
   ```

   Do **not** commit `.env.production` (it is gitignored).

## Image build

Runtime configuration is read from `.env.production` via `docker-compose.yml` `env_file`. The Docker image no longer embeds a production `MONGODB_URI`.

After changing `Dockerfile` or compose, push to `main`, wait for the GitHub Action image build, then `docker compose pull` on the server.
