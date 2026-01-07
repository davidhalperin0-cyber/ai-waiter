import { NextRequest, NextResponse } from 'next/server';

// GET /api/config/base-url
// Returns the base URL for the application
// This ensures QR codes always use the same URL
export async function GET(req: NextRequest) {
  // Priority order:
  // 1. NEXT_PUBLIC_APP_URL (if set in environment - this is the production domain)
  // 2. Request host header (from the actual request - most reliable)
  // 3. VERCEL_URL (automatically set by Vercel, but might be placeholder)
  // 4. Fallback to localhost for development
  
  let baseUrl: string;
  
  // First, try NEXT_PUBLIC_APP_URL (production domain)
  if (process.env.NEXT_PUBLIC_APP_URL && 
      !process.env.NEXT_PUBLIC_APP_URL.includes('your-project') &&
      !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  } 
  // Second, use the actual request host (most reliable in production)
  else if (req.headers.get('host')) {
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host');
    baseUrl = `${protocol}://${host}`;
  }
  // Third, try VERCEL_URL (but check it's not a placeholder)
  else if (process.env.VERCEL_URL && 
           !process.env.VERCEL_URL.includes('your-project')) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  }
  // Fallback to localhost
  else {
    baseUrl = 'http://localhost:3000';
  }

  return NextResponse.json({ baseUrl });
}

