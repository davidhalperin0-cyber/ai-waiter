import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, name, logoUrl, type, template, menuStyle, aiInstructions, businessHours } = body;

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    // Build update object - only include fields that are provided
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null; // Allow empty string to clear logo
    if (type !== undefined) updateData.type = type;
    if (template !== undefined) updateData.template = template;
    if (aiInstructions !== undefined) updateData.aiInstructions = aiInstructions;
    
    // Handle menuStyle and businessHours separately - if columns don't exist, skip them
    let optionalFieldsUpdate: any = {};
    if (menuStyle !== undefined) {
      optionalFieldsUpdate.menuStyle = menuStyle || null;
    }
    if (businessHours !== undefined) {
      optionalFieldsUpdate.businessHours = businessHours || null;
    }

    // At least one field must be provided
    if (Object.keys(updateData).length === 0 && Object.keys(optionalFieldsUpdate).length === 0) {
      return NextResponse.json({ message: 'At least one field must be provided' }, { status: 400 });
    }

    // First, try to update all fields including optional ones
    let updatePayload = { ...updateData, ...optionalFieldsUpdate };
    let { error } = await supabaseAdmin
      .from('businesses')
      .update(updatePayload)
      .eq('businessId', businessId);

    // If error is about optional columns not existing, retry without them
    if (error && (error.message?.includes('menuStyle') || error.message?.includes('businessHours'))) {
      console.warn('Optional columns may not exist yet, updating without them:', error.message);
      // Retry without optional fields
      const { error: retryError } = await supabaseAdmin
        .from('businesses')
        .update(updateData)
        .eq('businessId', businessId);
      
      if (retryError) {
        console.error('Error updating business (retry)', retryError);
        console.error('Update data:', updateData);
        return NextResponse.json({ 
          message: 'Database error', 
          details: retryError.message,
          code: retryError.code 
        }, { status: 500 });
      }
      
      // Return success but warn that optional fields weren't updated
      const missingFields = [];
      if (error.message?.includes('menuStyle')) missingFields.push('menuStyle');
      if (error.message?.includes('businessHours')) missingFields.push('businessHours');
      
      return NextResponse.json({ 
        message: `Business updated successfully (${missingFields.join(', ')} column(s) not found - please run SQL migration)`,
        warning: `${missingFields.join(', ')} was not updated because the column(s) do not exist in the database`
      }, { status: 200 });
    }

    if (error) {
      console.error('Error updating business', error);
      console.error('Update data:', updatePayload);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        message: 'Database error', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Business updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating business', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

