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
      // Featured / pregnancy flags (snake_case in DB)
      isFeatured: item.is_featured || false,
      isPregnancySafe: item.is_pregnancy_safe || false,
      // Business flag (may not exist on older schemas)
      isBusiness: item.isBusiness !== undefined ? item.isBusiness : false,
      // English fields (may be null / missing)
      nameEn: item.name_en || undefined,
      ingredientsEn: item.ingredients_en || undefined,
      allergensEn: item.allergens_en || undefined,
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
      nameEn,
      price,
      imageUrl,
      ingredients,
      ingredientsEn,
      allergens,
      allergensEn,
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

    // Optional English fields
    if (nameEn) {
      item.name_en = nameEn;
    }
    if (ingredientsEn && Array.isArray(ingredientsEn) && ingredientsEn.length > 0) {
      item.ingredients_en = ingredientsEn;
    }
    if (allergensEn && Array.isArray(allergensEn) && allergensEn.length > 0) {
      item.allergens_en = allergensEn;
    }

    // Add isBusiness if provided (only if column exists)
    if (isBusiness !== undefined) {
      item.isBusiness = isBusiness || false;
    }

    // Try to insert with all optional columns first
    let { error } = await supabaseAdmin.from('menuItems').insert(item);

    // If error is about optional columns not existing yet, retry without them
    if (error && error.message) {
      const message = error.message;
      const relatesToOptionalColumn =
        message.includes('isBusiness') ||
        message.includes('name_en') ||
        message.includes('ingredients_en') ||
        message.includes('allergens_en');

      if (relatesToOptionalColumn) {
        console.warn('Optional menuItems columns may not exist yet, retrying without them:', message);

        const itemFallback: any = { ...item };
        delete itemFallback.isBusiness;
        delete itemFallback.name_en;
        delete itemFallback.ingredients_en;
        delete itemFallback.allergens_en;

        const retry = await supabaseAdmin.from('menuItems').insert(itemFallback);

        if (retry.error) {
          console.error('Error creating menu item (retry)', retry.error);
          return NextResponse.json(
            {
              message: 'Database error',
              details: retry.error.message,
            },
            { status: 500 },
          );
        }

        return NextResponse.json(
          {
            item: itemFallback,
            warning:
              'Some optional fields were not saved because the corresponding columns do not exist in the database yet',
          },
          { status: 201 },
        );
      }
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


