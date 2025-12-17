# Google OAuth Implementation Plan

This document details how to set up Google OAuth for the Kressz Learning Platform using NextAuth.js.

## 1. Google Cloud Console Setup

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a **New Project** (e.g., "Kressz Platform").
3.  Navigate to **APIs & Services > OAuth consent screen**.
    *   **User Type**: External (unless internal organization only).
    *   **App Name**: "Kressz Learning".
    *   **Support Email**: Your email.
    *   **Scopes**: Select `.../auth/userinfo.email` and `.../auth/userinfo.profile`.
4.  Navigate to **Credentials**.
    *   Click **Create Credentials > OAuth client ID**.
    *   **Application Type**: Web application.
    *   **Name**: "Kressz Web Client".
    *   **Authorized JavaScript origins**:
        *   `http://localhost:3000` (for development)
        *   `https://your-production-domain.com` (for instructions later)
    *   **Authorized redirect URIs**:
        *   `http://localhost:3000/api/auth/callback/google`
        *   `https://your-production-domain.com/api/auth/callback/google`
5.  **Copy Credentials**:
    *   **Client ID**: `your-client-id`
    *   **Client Secret**: `your-client-secret`

## 2. Environment Variables

Add the following to your `.env.local` file:

```env
GOOGLE_CLIENT_ID=your-copied-client-id
GOOGLE_CLIENT_SECRET=your-copied-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-string-here
```

> **Tip**: You can generate a `NEXTAUTH_SECRET` using `openssl rand -base64 32` in the terminal.

## 3. Implementation Steps (Code)

1.  **Install Provider**: `npm install next-auth`
2.  **Configure Provider**:
    *   Create `app/api/auth/[...nextauth]/route.ts`.
    *   Import `GoogleProvider` from `next-auth/providers/google`.
    *   Add provider to the `authOptions` configuration.

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // ... callbacks for user creation in DB
})

export { handler as GET, handler as POST }
```

4.  **Database Integration**:
    *   In the `signIn` callback, check if the email exists in MongoDB.
    *   If not, create a new User with default role `student`.

## 4. Troubleshooting

- **Error: redirect_uri_mismatch**: Ensure the URI in Cloud Console matches exactly (http vs https, trailing slashes).
- **Error: 403 access_denied**: Check if the user is in the "Test users" list if the app is in "Testing" mode on the Consent Screen.
