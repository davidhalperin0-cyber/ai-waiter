import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';
import { signAuthToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
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

    const isValid = await bcrypt.compare(password, business.passwordHash);
    if (!isValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    if (!business.isEnabled) {
      return NextResponse.json({ message: 'Business is disabled' }, { status: 403 });
    }

    const token = await signAuthToken({
      businessId: business.businessId,
      email: business.email,
      role: 'business',
    });

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
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}




