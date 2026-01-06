import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body as { token?: string; password?: string };

    if (!token || !password) {
      return NextResponse.json({ message: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Find business by reset token
    const { data: business, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('businessId, passwordResetToken, passwordResetExpiry')
      .eq('passwordResetToken', token)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching business', fetchError);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    if (!business) {
      return NextResponse.json({ 
        message: 'Invalid or expired reset token' 
      }, { status: 400 });
    }

    // Check if token is expired
    if (business.passwordResetExpiry) {
      const expiryDate = new Date(business.passwordResetExpiry);
      if (expiryDate < new Date()) {
        return NextResponse.json({ 
          message: 'Reset token has expired. Please request a new one.' 
        }, { status: 400 });
      }
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    const { error: updateError } = await supabaseAdmin
      .from('businesses')
      .update({
        passwordHash: passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      })
      .eq('businessId', business.businessId);

    if (updateError) {
      console.error('Error updating password', updateError);
      return NextResponse.json({ message: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Password has been reset successfully' 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in reset-password:', error);
    return NextResponse.json({ 
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

