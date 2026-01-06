import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, name, phone, email } = body;

    // Validation
    if (!businessId || typeof businessId !== 'string') {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return NextResponse.json(
        { error: 'phone is required' },
        { status: 400 }
      );
    }

    // Normalize phone (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Check if contact already exists for this business
    const { data: existingContact, error: checkError } = await supabase
      .from('contacts')
      .select('id, updated_at')
      .eq('business_id', businessId)
      .eq('phone', normalizedPhone)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected if doesn't exist)
      console.error('Error checking existing contact:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing contact' },
        { status: 500 }
      );
    }

    if (existingContact) {
      // Update existing contact (name, email, updated_at)
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          name: name.trim(),
          updated_at: new Date().toISOString(),
          // Optionally update email if provided
          ...(email && email.trim() ? { email: email.trim() } : {}),
        })
        .eq('id', existingContact.id);

      if (updateError) {
        console.error('Error updating contact:', updateError);
        return NextResponse.json(
          { error: 'Failed to update contact' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Contact updated',
        contact: {
          id: existingContact.id,
          name: name.trim(),
          phone: normalizedPhone,
          email: email?.trim() || null,
          updated: true,
        },
      });
    }

    // Create new contact
    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        business_id: businessId,
        name: name.trim(),
        phone: normalizedPhone,
        email: email?.trim() || null,
        source: 'loyalty_club',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating contact:', insertError);
      return NextResponse.json(
        { error: 'Failed to create contact', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contact created',
      contact: {
        id: newContact.id,
        name: newContact.name,
        phone: newContact.phone,
        email: newContact.email,
        created_at: newContact.created_at,
      },
    });
  } catch (error: any) {
    console.error('Unexpected error in /api/contacts/create:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

