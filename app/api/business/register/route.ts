import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function isPlaceholder(value: string | undefined): boolean {
  if (!value || value.length < 3) return true;
  const lower = value.toLowerCase();
  return lower.includes('your_') || lower === 'placeholder' || lower.startsWith('placeholder');
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey || isPlaceholder(supabaseUrl) || isPlaceholder(serviceKey)) {
      return NextResponse.json(
        {
          message:
            'Server configuration error. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (from Supabase → Project Settings → API).',
        },
        { status: 503 },
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
      const isFetchFailed = String(existingError.message || '').toLowerCase().includes('fetch failed');
      const hint = isFetchFailed
        ? 'Cannot reach Supabase. Check: 1) Supabase project not paused (Dashboard → Restore). 2) Vercel env NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct, then Redeploy.'
        : 'Run COMPLETE_DATABASE_SCHEMA.sql in Supabase SQL Editor to create the businesses table.';
      return NextResponse.json(
        {
          message:
            process.env.NODE_ENV === 'development'
              ? `Database error: ${existingError.message}`
              : isFetchFailed
                ? 'Cannot reach database. See hint in details.'
                : 'Database error',
          details: process.env.NODE_ENV === 'development' || isFetchFailed ? { supabaseError: existingError.message, hint } : undefined,
        },
        { status: 500 },
      );
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
      console.error('❌ Error inserting business', insertError);
      const isFetchFailed = String(insertError.message || '').toLowerCase().includes('fetch failed');
      const hint = isFetchFailed
        ? 'Cannot reach Supabase. Check: 1) Supabase project not paused (Dashboard → Restore). 2) Vercel env vars correct, then Redeploy.'
        : 'Check that businesses table has all required columns (see COMPLETE_DATABASE_SCHEMA.sql).';
      return NextResponse.json(
        {
          message:
            process.env.NODE_ENV === 'development'
              ? `Database error: ${insertError.message}`
              : isFetchFailed
                ? 'Cannot reach database. See hint in details.'
                : 'Database error',
          details: process.env.NODE_ENV === 'development' || isFetchFailed ? { supabaseError: insertError.message, hint } : undefined,
        },
        { status: 500 },
      );
    }

    console.log('✅ Business created successfully:', {
      businessId: insertedData?.[0]?.businessId,
      name: insertedData?.[0]?.name,
      email: insertedData?.[0]?.email,
      isEnabled: insertedData?.[0]?.isEnabled,
      createdAt: insertedData?.[0]?.createdAt,
    });

    // TODO: create default tables/menu if needed

    return NextResponse.json({ businessId }, { status: 200 });
  } catch (error) {
    console.error('Error registering business', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

