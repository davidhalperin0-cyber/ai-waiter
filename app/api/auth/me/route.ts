import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);

    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json(
      {
        businessId: payload.businessId,
        email: payload.email,
        role: payload.role,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Auth me error', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}




