# Firebase Setup Guide

## 1. Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project** → give it a name (e.g. "bwf-ngo") → Continue
3. Disable Google Analytics (optional) → **Create project**

## 2. Enable Authentication

1. In the Firebase console, click **Authentication** → **Get started**
2. Click the **Sign-in method** tab
3. Enable **Email/Password** → Save

## 3. Enable Firestore

1. Click **Firestore Database** → **Create database**
2. Choose **Start in test mode** (you can tighten rules later)
3. Select a region (e.g. `asia-south1` for India) → **Done**

## 4. Get your web app config

1. Click the gear icon → **Project settings**
2. Scroll down to **Your apps** → click **</>** (web)
3. Register the app (any nickname) → copy the `firebaseConfig` object

## 5. Add config to the frontend

Create `NgoWebsite/.env.local` (copy from `.env.example`):

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

Then restart the dev server: `npm run dev`

## 6. Deploy Firestore security rules (optional but recommended)

Install the Firebase CLI:
```
npm install -g firebase-tools
firebase login
firebase init firestore   # choose your project, accept defaults
```

Copy the contents of `firestore.rules` from the project root, then:
```
firebase deploy --only firestore:rules
```

## What's stored where

| Data              | Storage          |
|-------------------|------------------|
| Users / Auth      | Firebase Auth    |
| User profiles     | Firestore `users`|
| Volunteer apps    | Firestore `volunteers` |
| Contact messages  | Firestore `contact`    |
| Check-ins         | Firestore `checkins`   |
| Donation records  | Django + SQLite (via Razorpay backend) |

## Payments (Razorpay)

The Django backend is still needed **only** for Razorpay payment signing.
See `backend/.env.example` for the required env vars.
If you don't need payments, you can skip running Django entirely.
