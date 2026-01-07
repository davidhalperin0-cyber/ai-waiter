import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body as { email?: string };

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Find business by email
    const { data: business, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('businessId, email, name')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching business', fetchError);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    // Don't reveal if email exists or not (security best practice)
    if (!business) {
      // Return success even if email doesn't exist to prevent email enumeration
      return NextResponse.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      }, { status: 200 });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 1000); // 1 minute from now (for testing)

    // Store reset token in database
    // We'll use a separate table or add columns to businesses table
    // For now, let's add a passwordResetToken and passwordResetExpiry column
    const { error: updateError } = await supabaseAdmin
      .from('businesses')
      .update({
        passwordResetToken: resetToken,
        passwordResetExpiry: resetTokenExpiry.toISOString(),
      })
      .eq('businessId', business.businessId);

    if (updateError) {
      console.error('Error storing reset token', updateError);
      return NextResponse.json({ message: 'Failed to generate reset token' }, { status: 500 });
    }

    // Generate reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // TODO: Send email with reset link
    // For now, we'll just log it (in production, use an email service like SendGrid, Resend, etc.)
    console.log('Password reset link for', business.email, ':', resetUrl);
    
    // In production, send email here:
    // await sendEmail({
    //   to: business.email,
    //   subject: 'איפוס סיסמה',
    //   html: `לחץ על הקישור הבא כדי לאפס את הסיסמה שלך: <a href="${resetUrl}">${resetUrl}</a>`
    // });

    return NextResponse.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in forgot-password:', error);
    return NextResponse.json({ 
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

