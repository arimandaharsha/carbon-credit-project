# Firebase Setup Guide

This project uses Firebase for authentication and database functionality. Follow these steps to set up Firebase for your local development environment:

## Prerequisites

1. A Google account
2. Node.js and npm installed

## Setup Steps

1. **Create a Firebase Project**
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup wizard
   - Enable Google Analytics if desired

2. **Register Your Web App**
   - In your Firebase project console, click the web icon (</>) to add a web app
   - Give your app a nickname (e.g., "Carbon Credit Project Web")
   - Register the app

3. **Copy Your Firebase Configuration**
   - After registering, you'll see your Firebase configuration
   - Copy these values to your `.env.local` file (described below)

4. **Enable Authentication Methods**
   - In the Firebase console, go to "Authentication" > "Sign-in method"
   - Enable the authentication methods you want to use (Email/Password, Google, etc.)

5. **Set Up Firestore Database**
   - In the Firebase console, go to "Firestore Database"
   - Click "Create database"
   - Start in production or test mode as needed
   - Choose a location for your database

## Environment Variables

Update the `.env.local` file in the project root with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Replace the placeholder values with your actual Firebase configuration values.

## Security Note

- Never commit `.env.local` to version control
- The `.env.local` file is already added to `.gitignore`
- For production deployment, set these environment variables on your hosting platform (Vercel, Netlify, etc.)

## Testing Firebase Connection

After setting up, restart your development server and check the browser console for any Firebase-related errors. 