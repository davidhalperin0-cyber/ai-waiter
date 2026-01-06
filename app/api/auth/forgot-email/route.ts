import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessName, phone } = body as { businessName?: string; phone?: string };

    if (!businessName) {
      return NextResponse.json({ message: 'Business name is required' }, { status: 400 });
    }

    // Build query
    let query = supabaseAdmin
      .from('businesses')
      .select('email, name, customContent')
      .ilike('name', `%${businessName}%`);

    // If phone is provided, also filter by phone from customContent
    if (phone) {
      // We need to search in customContent JSONB field
      // This is a bit complex, so we'll fetch all matching businesses and filter in code
      const { data: businesses, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching businesses', fetchError);
        return NextResponse.json({ message: 'Database error' }, { status: 500 });
      }

      if (!businesses || businesses.length === 0) {
        return NextResponse.json({ 
          message: 'לא נמצא עסק עם הפרטים שסופקו' 
        }, { status: 404 });
      }

      // Filter by phone if provided
      const matchingBusiness = businesses.find((b: any) => {
        // Try to get phone from customContent
        const customContent = b.customContent;
        if (customContent?.contact?.phone) {
          // Normalize phone numbers (remove spaces, dashes, etc.)
          const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
          const normalizedStoredPhone = customContent.contact.phone.replace(/[\s\-\(\)]/g, '');
          return normalizedStoredPhone.includes(normalizedPhone) || normalizedPhone.includes(normalizedStoredPhone);
        }
        return false;
      });

      if (!matchingBusiness) {
        return NextResponse.json({ 
          message: 'לא נמצא עסק עם הפרטים שסופקו' 
        }, { status: 404 });
      }

      // Return email (masked for security - show only first 3 chars and domain)
      const email = matchingBusiness.email;
      const [localPart, domain] = email.split('@');
      const maskedEmail = `${localPart.substring(0, 3)}***@${domain}`;

      return NextResponse.json({ 
        email: matchingBusiness.email, // Return full email for now, can mask if needed
        maskedEmail: maskedEmail
      }, { status: 200 });
    } else {
      // No phone provided, just search by name
      const { data: businesses, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching businesses', fetchError);
        return NextResponse.json({ message: 'Database error' }, { status: 500 });
      }

      if (!businesses || businesses.length === 0) {
        return NextResponse.json({ 
          message: 'לא נמצא עסק עם השם שסופק' 
        }, { status: 404 });
      }

      if (businesses.length > 1) {
        return NextResponse.json({ 
          message: 'נמצאו מספר עסקים עם השם הזה. אנא הזינו גם מספר טלפון כדי לזהות את העסק הנכון.' 
        }, { status: 400 });
      }

      // Return email
      const email = businesses[0].email;
      const [localPart, domain] = email.split('@');
      const maskedEmail = `${localPart.substring(0, 3)}***@${domain}`;

      return NextResponse.json({ 
        email: businesses[0].email, // Return full email for now, can mask if needed
        maskedEmail: maskedEmail
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error in forgot-email:', error);
    return NextResponse.json({ 
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

