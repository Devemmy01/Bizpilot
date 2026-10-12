# Bizpilot

Bizpilot is a Next.js, TypeScript, Tailwind, MongoDB, Firebase Auth, and Resend starter for business owners who want automatic profit, expense, inventory, and report calculations.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- MongoDB
- Firebase Authentication
- Resend email reports

## Getting Started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in your Firebase, MongoDB, and Resend keys.

## Environment Variables

- `NEXT_PUBLIC_FIREBASE_*`: Firebase web app config for client authentication.
- `FIREBASE_SERVICE_ACCOUNT`: Firebase Admin service account JSON for API token verification.
- `MONGODB_URI`: MongoDB connection string.
- `MONGODB_DB`: Database name, defaults to `bizpilot`.
- `RESEND_API_KEY`: API key for sending emails through Resend.
- `REPORT_FROM_EMAIL`: Verified sender address for report emails.
