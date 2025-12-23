import { NextRequest, NextResponse } from 'next/server';
import { Table } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET /api/tables?businessId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    const { data: tables, error } = await supabaseAdmin
      .from('tables')
      .select('*')
      .eq('businessId', businessId);

    if (error) {
      console.error('Error fetching tables', error);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ tables }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tables', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tables
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, tableId, label } = body as Partial<Table>;

    if (!businessId || !tableId || !label) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('tables')
      .select('tableId')
      .eq('businessId', businessId)
      .eq('tableId', tableId)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing table', existingError);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json(
        { message: 'Table with this ID already exists' },
        { status: 409 },
      );
    }

    const table: Table = {
      businessId,
      tableId,
      label,
    };

    const { error } = await supabaseAdmin.from('tables').insert(table);

    if (error) {
      console.error('Error creating table', error);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    console.error('Error creating table', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


