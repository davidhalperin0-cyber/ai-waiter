import { NextRequest, NextResponse } from 'next/server';
import { signAuthToken } from '@/lib/auth';
import { SUPER_ADMIN_EMAIL } from '@/lib/superAdminAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Check if email matches super admin email
    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('SUPER_ADMIN_EMAIL is not set in environment variables');
      return NextResponse.json({ message: 'Super admin access is not configured' }, { status: 500 });
    }

    // Trim whitespace from inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    console.log('Checking email:', trimmedEmail, 'against:', adminEmail.trim());
    console.log('Email match:', trimmedEmail === adminEmail.trim());
    
    if (trimmedEmail !== adminEmail.trim()) {
      console.log('Email mismatch - received:', JSON.stringify(trimmedEmail), 'expected:', JSON.stringify(adminEmail.trim()));
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Check password from environment variable
    const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
    if (!SUPER_ADMIN_PASSWORD) {
      console.error('SUPER_ADMIN_PASSWORD is not set in environment variables');
      return NextResponse.json({ message: 'Super admin access is not configured' }, { status: 500 });
    }

    console.log('Checking password (length only for security):', trimmedPassword.length, 'vs', SUPER_ADMIN_PASSWORD.trim().length);
    console.log('Password match:', trimmedPassword === SUPER_ADMIN_PASSWORD.trim());
    
    if (trimmedPassword !== SUPER_ADMIN_PASSWORD.trim()) {
      console.log('Password mismatch');
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Create super admin token
    const token = await signAuthToken({
      businessId: 'super-admin',
      email: trimmedEmail,
      role: 'super_admin',
    });

    const res = NextResponse.json(
      { message: 'Login successful', role: 'super_admin' },
      { status: 200 },
    );

    // Set cookie with explicit domain and path
    res.cookies.set('auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log('Super admin login successful for:', trimmedEmail);
    console.log('Token created, cookie set');
    
    // Verify the token was created correctly
    const { verifyAuthToken } = await import('@/lib/auth');
    const verified = await verifyAuthToken(token);
    console.log('Token verification test:', verified ? { email: verified.email, role: verified.role, businessId: verified.businessId } : 'failed');

    return res;
  } catch (error) {
    console.error('Super admin login error', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

