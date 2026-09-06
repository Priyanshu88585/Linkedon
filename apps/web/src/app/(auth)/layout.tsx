"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Replace with your actual Google Client ID from Google Cloud Console
  // This must be a NEXT_PUBLIC variable if stored in .env for Next.js to expose it
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
