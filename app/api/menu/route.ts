import { NextRequest, NextResponse } from 'next/server';
import { MenuItem } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET /api/menu?businessId=...
// Returns all menu items for a given business
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    // Try to select all columns including isBusiness
    let { data: items, error } = await supabaseAdmin
      .from('menuItems')
      .select('*')
      .eq('businessId', businessId)
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true });

    // If error suggests missing column, try without isBusiness
    if (error && error.message?.includes('column')) {
      console.warn('Column may not exist, retrying:', error.message);
      // The select('*') should work even if isBusiness doesn't exist
      // But if it fails, we'll handle it in the mapping
    }

    if (error) {
      console.error('Error fetching menu items', error);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    // Map DB columns to frontend fields
    const mappedItems = items?.map((item: any) => ({
      ...item,
      isFeatured: item.is_featured || false,
      isPregnancySafe: item.is_pregnancy_safe || false,
      isBusiness: item.isBusiness !== undefined ? item.isBusiness : false, // Handle missing column gracefully
    })) || [];

    return NextResponse.json({ items: mappedItems }, { status: 200 });
  } catch (error) {
    console.error('Error fetching menu items', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/menu
// Creates a new menu item for a business
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId,
      category,
      name,
      price,
      imageUrl,
      ingredients,
      allergens,
      customizationOptions,
      isFeatured,
      isPregnancySafe,
      isBusiness,
    } = body as Partial<MenuItem> & { businessId?: string; price?: number };

    if (!businessId || !category || !name || typeof price !== 'number') {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const item: any = {
      businessId,
      category,
      name,
      price,
      imageUrl,
      ingredients,
      allergens,
      customizationOptions,
      is_featured: isFeatured || false,
      is_pregnancy_safe: isPregnancySafe || false,
    };

    // Add isBusiness if provided (only if column exists)
    if (isBusiness !== undefined) {
      item.isBusiness = isBusiness || false;
    }

    // Try to insert with isBusiness first
    let { error } = await supabaseAdmin
      .from('menuItems')
      .insert(item);

    // If error is about isBusiness column not existing, retry without it
    if (error && error.message?.includes('isBusiness')) {
      console.warn('isBusiness column may not exist yet, retrying without it:', error.message);
      // Remove isBusiness and retry
      const itemWithoutBusiness = { ...item };
      delete itemWithoutBusiness.isBusiness;
      
      const retry = await supabaseAdmin
        .from('menuItems')
        .insert(itemWithoutBusiness);
      
      if (retry.error) {
        console.error('Error creating menu item (retry)', retry.error);
        return NextResponse.json({ 
          message: 'Database error', 
          details: retry.error.message 
        }, { status: 500 });
      }
      
      // Return success but warn that isBusiness wasn't saved
      return NextResponse.json({ 
        item: itemWithoutBusiness,
        warning: 'isBusiness was not saved because the column does not exist in the database'
      }, { status: 201 });
    }

    if (error) {
      console.error('Error creating menu item', error);
      return NextResponse.json({ 
        message: 'Database error', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Error creating menu item', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


