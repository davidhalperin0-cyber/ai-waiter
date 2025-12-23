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
    const token = req.cookies.get('auth')?.value;
    if (!(await isSuperAdmin(token))) {
      return NextResponse.json({ message: 'Unauthorized - Super admin access required' }, { status: 403 });
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




