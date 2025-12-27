export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isSuperAdmin } from '@/lib/superAdminAuth';

// PUT /api/super-admin/businesses/[businessId]
// Update business (enable/disable, subscription, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: { businessId: string } },
) {
  try {
    // Check super admin authentication
    // Try multiple ways to get the token (cookies, headers)
    let token = req.cookies.get('auth')?.value;
    
    // Fallback: check Authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      console.error('No auth token found in cookies or headers');
      console.error('Available cookies:', Array.from(req.cookies.getAll()).map(c => c.name));
      return NextResponse.json({ message: 'Unauthorized - No authentication token' }, { status: 403 });
    }
    
    const isAdmin = await isSuperAdmin(token);
    if (!isAdmin) {
      console.error('Super admin check failed for token:', token.substring(0, 20) + '...');
      // Try to verify the token to see what's in it
      const { verifyAuthToken } = await import('@/lib/auth');
      const payload = await verifyAuthToken(token);
      console.error('Token payload:', payload);
      console.error('SUPER_ADMIN_EMAIL from env:', process.env.SUPER_ADMIN_EMAIL ? 'SET' : 'NOT SET');
      return NextResponse.json({ 
        message: 'Unauthorized - Super admin access required',
        debug: process.env.NODE_ENV === 'development' ? {
          hasToken: !!token,
          tokenPreview: token.substring(0, 20),
          payload: payload,
          expectedEmail: process.env.SUPER_ADMIN_EMAIL
        } : undefined
      }, { status: 403 });
    }

    const businessId = params.businessId;
    const body = await req.json();
    const { isEnabled, subscription } = body;

    const updateData: any = {};
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (subscription !== undefined) updateData.subscription = subscription;

    const { error } = await supabaseAdmin
      .from('businesses')
      .update(updateData)
      .eq('businessId', businessId);

    if (error) {
      console.error('Error updating business', error);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Business updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating business', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}




