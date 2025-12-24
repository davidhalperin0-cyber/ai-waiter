import { NextRequest, NextResponse } from 'next/server';
import { Business } from '@/lib/types';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase env vars missing:', {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
      return NextResponse.json(
        { message: 'Server configuration error: Supabase not configured' },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { businessName, businessType, email, password, template } = body;

    if (!businessName || !businessType || !email || !password || !template) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('businesses')
      .select('businessId')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing business', existingError);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const businessId = randomUUID();

    const business = {
      businessId,
      name: businessName,
      type: businessType,
      template,
      email,
      passwordHash,
      isEnabled: true,
      subscription: {
        status: 'trial',
        planType: 'full', // Default to full plan
      },
      // createdAt is handled by DEFAULT NOW() in the database
    };

    const { error: insertError, data: insertedData } = await supabaseAdmin
      .from('businesses')
      .insert(business)
      .select();

    if (insertError) {
      console.error('Error inserting business', insertError);
      console.error('Business data attempted:', JSON.stringify(business, null, 2));
      return NextResponse.json(
        { message: 'Database error', error: insertError.message },
        { status: 500 },
      );
    }

    // TODO: create default tables/menu if needed

    return NextResponse.json({ businessId }, { status: 200 });
  } catch (error) {
    console.error('Error registering business', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

