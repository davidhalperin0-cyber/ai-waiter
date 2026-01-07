import { NextResponse } from 'next/server';

// GET /api/config/base-url
// Returns the base URL for the application
// This ensures QR codes always use the same URL
export async function GET() {
  // Priority order:
  // 1. NEXT_PUBLIC_APP_URL (if set in environment)
  // 2. VERCEL_URL (automatically set by Vercel)
  // 3. Fallback to localhost for development
  
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000';

  return NextResponse.json({ baseUrl });
}

