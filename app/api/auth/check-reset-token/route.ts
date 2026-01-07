import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ 
        valid: false,
        message: 'קישור לא תקין' 
      }, { status: 400 });
    }

    // Find business by reset token
    const { data: business, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('businessId, passwordResetToken, passwordResetExpiry')
      .eq('passwordResetToken', token)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching business', fetchError);
      return NextResponse.json({ 
        valid: false,
        message: 'שגיאה במערכת' 
      }, { status: 500 });
    }

    if (!business) {
      return NextResponse.json({ 
        valid: false,
        message: 'קישור לא תקין או פג תוקף' 
      }, { status: 400 });
    }

    // Check if token is expired
    if (business.passwordResetExpiry) {
      const expiryDate = new Date(business.passwordResetExpiry);
      if (expiryDate < new Date()) {
        return NextResponse.json({ 
          valid: false,
          expired: true,
          message: 'קישור פג תוקף. אנא בקש קישור חדש' 
        }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      valid: true,
      message: 'קישור תקין' 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in check-reset-token:', error);
    return NextResponse.json({ 
      valid: false,
      message: 'שגיאה במערכת',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

