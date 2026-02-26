import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';
import { signAuthToken } from '@/lib/auth';

function isPlaceholder(value: string | undefined): boolean {
  if (!value || value.length < 3) return true;
  const lower = value.toLowerCase();
  return lower.includes('your_') || lower === 'placeholder' || lower.startsWith('placeholder');
}

export async function POST(req: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.JWT_SECRET || isPlaceholder(process.env.JWT_SECRET)) {
      console.error('JWT_SECRET is not set or is placeholder');
      return NextResponse.json({ 
        message: 'Server configuration error. Set JWT_SECRET in .env.local (use a long random string).',
        details: process.env.NODE_ENV === 'development' ? 'JWT_SECRET is not set' : undefined
      }, { status: 503 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey || isPlaceholder(supabaseUrl) || isPlaceholder(serviceKey)) {
      console.error('Supabase environment variables are not set or are placeholders');
      return NextResponse.json({ 
        message: 'Server configuration error. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (from Supabase Dashboard → Project Settings → API).',
        details: process.env.NODE_ENV === 'development' ? 'Supabase env vars not set' : undefined
      }, { status: 503 });
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
      const isFetchFailed = String(fetchError.message || '').toLowerCase().includes('fetch failed');
      const msg =
        process.env.NODE_ENV === 'development'
          ? `Database error: ${fetchError.message}`
          : isFetchFailed
            ? 'Cannot reach database. Check Vercel env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (no spaces, correct project URL).'
            : 'Database error';
      return NextResponse.json(
        {
          message: msg,
          details:
            process.env.NODE_ENV === 'development' || isFetchFailed
              ? {
                  supabaseError: fetchError.message,
                  hint: isFetchFailed
                    ? 'On Vercel: Settings → Environment Variables → set NEXT_PUBLIC_SUPABASE_URL (e.g. https://xxx.supabase.co) and SUPABASE_SERVICE_ROLE_KEY for Production, then Redeploy.'
                    : 'Ensure table "businesses" exists (run COMPLETE_DATABASE_SCHEMA.sql) and SUPABASE_SERVICE_ROLE_KEY is the service_role key.',
                }
              : undefined,
        },
        { status: 500 }
      );
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




