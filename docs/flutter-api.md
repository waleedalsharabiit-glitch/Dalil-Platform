# Flutter API v1

The Flutter API is served by the Next.js application under `/api/v1`. Every route requires a Firebase ID token in the HTTP authorization header. The API verifies the token with Firebase Admin and links the verified Firebase UID to a local Dalil user. User roles are always read from the local database; Firebase custom claims cannot grant administrative access.

```http
Authorization: Bearer <Firebase ID token>
Content-Type: application/json
```

## Routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/v1/me` | Current Dalil profile |
| GET | `/api/v1/businesses?q=&city=&category=&page=1&limit=20` | Search active businesses; limit is at most 50 |
| GET | `/api/v1/businesses/{id-or-slug}` | Active business details, hours, images, services and published reviews |
| GET | `/api/v1/favorites` | Current user's saved active businesses |
| POST | `/api/v1/favorites` | Save a business: `{"businessId":"..."}` |
| DELETE | `/api/v1/favorites/{businessId}` | Remove a saved business |
| GET | `/api/v1/requests` | Current user's service requests |
| POST | `/api/v1/requests` | Create a request with `businessId`, `title`, optional `serviceId` and `description` |
| POST | `/api/v1/businesses/{id-or-slug}/reviews` | Create or update a 1–5 star review and optional `comment` |

Responses return JSON. Success data is under `data`; business search also returns `pagination`. Errors use `{ "error": { "message": "..." } }`. A missing/invalid token returns 401, inactive account returns 403, and missing Firebase server configuration returns 503.

## Server configuration

Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` from a Firebase service account in the Next.js server environment. Keep this key server-side and out of source control. Run the included Prisma migration before enabling Firebase sign-in/API use:

```bash
npx prisma migrate deploy
npx prisma generate
```

Flutter should obtain an ID token from Firebase Auth and send it as a bearer token over HTTPS. It must refresh the token through Firebase Auth when expired; it must never use a Firebase service-account credential.
