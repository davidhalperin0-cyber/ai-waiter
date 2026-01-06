export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's revenue
    const { data: todayOrders, error: todayError } = await supabaseAdmin
      .from('orders')
      .select('totalAmount')
      .eq('businessId', businessId)
      .gte('createdAt', todayStart.toISOString());

    if (todayError) {
      console.error('Error fetching today stats', todayError);
    }

    // Week's revenue
    const { data: weekOrders, error: weekError } = await supabaseAdmin
      .from('orders')
      .select('totalAmount')
      .eq('businessId', businessId)
      .gte('createdAt', weekStart.toISOString());

    if (weekError) {
      console.error('Error fetching week stats', weekError);
    }

    // Month's revenue
    const { data: monthOrders, error: monthError } = await supabaseAdmin
      .from('orders')
      .select('totalAmount')
      .eq('businessId', businessId)
      .gte('createdAt', monthStart.toISOString());

    if (monthError) {
      console.error('Error fetching month stats', monthError);
    }

    const today = (todayOrders || []).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const week = (weekOrders || []).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const month = (monthOrders || []).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    return NextResponse.json(
      {
        today: Math.round(today * 100) / 100,
        week: Math.round(week * 100) / 100,
        month: Math.round(month * 100) / 100,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching revenue stats', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}








