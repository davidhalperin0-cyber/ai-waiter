import { NextResponse } from 'next/server';

// Simple favicon handler to prevent 404 errors
// Returns a minimal 1x1 transparent PNG
export async function GET() {
  // Return a minimal 1x1 transparent PNG as favicon
  // This is a base64 encoded 1x1 transparent PNG
  const transparentPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  return new NextResponse(transparentPng, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

