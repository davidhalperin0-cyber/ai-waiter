import { NextRequest, NextResponse } from 'next/server';

// GET /api/time?timezone=America/New_York (optional)
// Returns current server time in the specified timezone (or UTC if not provided)
// The client should convert this to their local timezone or business timezone
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timezone = searchParams.get('timezone') || 'UTC'; // Default to UTC, client will convert
    
    const now = new Date();
    
    // Get time in requested timezone
    const timeParts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const hours = timeParts.find(part => part.type === 'hour')?.value || '00';
    const minutes = timeParts.find(part => part.type === 'minute')?.value || '00';
    const currentTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;

    return NextResponse.json(
      {
        currentTime, // Format: "HH:MM" in requested timezone
        timestamp: now.toISOString(), // UTC timestamp for client-side conversion
        timezone: timezone,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error getting server time:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}

