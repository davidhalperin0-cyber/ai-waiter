import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';
import { signAuthToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return NextResponse.json({ 
        message: 'Server configuration error',
        details: process.env.NODE_ENV === 'development' ? 'JWT_SECRET is not set' : undefined
      }, { status: 500 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase environment variables are not set');
      return NextResponse.json({ 
        message: 'Server configuration error',
        details: process.env.NODE_ENV === 'development' ? 'Supabase env vars not set' : undefined
      }, { status: 500 });
    }

    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const { data: business, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('businessId, email, passwordHash, isEnabled')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching business', fetchError);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    if (!business) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    if (!business.passwordHash) {
      console.error('Business has no password hash');
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, business.passwordHash);
    } catch (bcryptError: any) {
      console.error('Bcrypt compare error', bcryptError);
      return NextResponse.json({ message: 'Authentication error' }, { status: 500 });
    }

    if (!isValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    if (!business.isEnabled) {
      return NextResponse.json({ message: 'Business is disabled' }, { status: 403 });
    }

    let token: string;
    try {
      token = await signAuthToken({
        businessId: business.businessId,
        email: business.email,
        role: 'business',
      });
    } catch (tokenError: any) {
      console.error('Token creation error', tokenError);
      return NextResponse.json({ 
        message: 'Failed to create authentication token',
        details: process.env.NODE_ENV === 'development' ? tokenError?.message : undefined
      }, { status: 500 });
    }

    const res = NextResponse.json(
      { businessId: business.businessId, role: 'business' },
      { status: 200 },
    );

    res.cookies.set('auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error: any) {
    console.error('Login error', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json({ 
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}




