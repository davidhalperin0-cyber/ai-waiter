import { NextRequest, NextResponse } from 'next/server';
import { Table } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// DELETE /api/tables/[tableId]?businessId=...
export async function DELETE(
  req: NextRequest,
  { params }: { params: { tableId: string } },
) {
  try {
    const tableId = params.tableId;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('tables')
      .delete()
      .eq('businessId', businessId)
      .eq('tableId', tableId);

    if (error) {
      console.error('Error deleting table', error);
      return NextResponse.json({ message: 'Table not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting table', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


