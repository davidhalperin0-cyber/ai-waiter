export const dynamic = 'force-dynamic';
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
    // Try with sortOrder first, but fallback if column doesn't exist
    let { data: items, error } = await supabaseAdmin
      .from('menuItems')
      .select('*')
      .eq('businessId', businessId)
      .order('sortOrder', { ascending: true, nullsFirst: false })
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true });

    // If error suggests missing sortOrder column, retry without it
    if (error && error.message?.toLowerCase().includes('sortorder')) {
      console.warn('sortOrder column may not exist, retrying without it:', error.message);
      const retry = await supabaseAdmin
        .from('menuItems')
        .select('*')
        .eq('businessId', businessId)
        .order('is_featured', { ascending: false })
        .order('name', { ascending: true });
      
      if (retry.error) {
        console.error('Error fetching menu items (retry)', retry.error);
        return NextResponse.json({ message: 'Database error', details: retry.error.message }, { status: 500 });
      }
      
      items = retry.data;
      error = null;
    } else if (error) {
      console.error('Error fetching menu items', error);
      return NextResponse.json({ message: 'Database error', details: error.message }, { status: 500 });
    }

    // Helper function to clean trailing 0s from array fields
    const cleanArrayField = (arr: string[] | undefined): string[] | undefined => {
      if (!arr || !Array.isArray(arr)) return undefined;
      const cleaned = arr.map(str => {
        // Clean each string in the array
        const parts = str.split(',').map(part => {
          return part.replace(/([^\d])0+$/g, '$1').trim();
        });
        let cleaned = parts.join(', ');
        cleaned = cleaned.replace(/[\s,]*0+[\s,]*$/g, '');
        cleaned = cleaned.replace(/\s*,\s*,/g, ',').replace(/\s+/g, ' ').trim();
        cleaned = cleaned.replace(/^,|,$/g, '');
        return cleaned;
      })
      .filter(str => str && str.trim() !== '' && str.trim() !== '0'); // Remove empty strings and standalone "0"
      
      // Return undefined if array is empty, not []
      return cleaned.length > 0 ? cleaned : undefined;
    };

    // Map DB columns to frontend fields
    const mappedItems = items?.map((item: any) => {
      // Parse price - can be from priceData (JSONB) or price (numeric)
      let price: number | { min: number; max: number } = item.price;
      if (item.priceData) {
        // If priceData exists, use it (supports both number and range)
        try {
          const parsed = typeof item.priceData === 'string' ? JSON.parse(item.priceData) : item.priceData;
          if (typeof parsed === 'object' && 'min' in parsed && 'max' in parsed) {
            price = { min: parsed.min, max: parsed.max };
          } else if (typeof parsed === 'number') {
            price = parsed;
          }
        } catch (e) {
          // If parsing fails, fall back to numeric price
          price = item.price;
        }
      }
      
      return {
        ...item,
        price, // Use parsed price
        // Featured / pregnancy flags (snake_case in DB)
        isFeatured: item.is_featured || false,
        isPregnancySafe: item.is_pregnancy_safe || false,
        // Business flag (may not exist on older schemas)
        isBusiness: item.isBusiness !== undefined ? item.isBusiness : false,
        // Hidden flag (may not exist on older schemas)
        isHidden: item.isHidden !== undefined ? item.isHidden : false,
        // Sort order (may not exist on older schemas)
        sortOrder: item.sortOrder !== undefined ? item.sortOrder : 0,
        // English fields (may be null / missing)
        categoryEn: item.category_en || undefined,
        nameEn: item.name_en || undefined,
        // Clean ingredients and allergens arrays from trailing 0s
        ingredients: cleanArrayField(item.ingredients),
        allergens: cleanArrayField(item.allergens),
        ingredientsEn: cleanArrayField(item.ingredients_en),
        allergensEn: cleanArrayField(item.allergens_en),
      };
    }) || [];

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
      categoryEn,
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
    } = body as Partial<MenuItem> & { businessId?: string; price?: number | { min: number; max: number } };

    if (!businessId || !category || !name) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate price - can be number or range object
    if (price === undefined || price === null) {
      return NextResponse.json({ message: 'Price is required' }, { status: 400 });
    }
    
    const isPriceRange = typeof price === 'object' && 'min' in price && 'max' in price;
    if (isPriceRange) {
      if (typeof price.min !== 'number' || typeof price.max !== 'number' || price.min >= price.max || price.min < 0) {
        return NextResponse.json({ message: 'Invalid price range' }, { status: 400 });
      }
    } else if (typeof price !== 'number' || price < 0) {
      return NextResponse.json({ message: 'Price must be a positive number' }, { status: 400 });
    }

    // Helper function to clean trailing 0s from array fields
    const cleanArrayField = (arr: string[] | undefined): string[] | undefined => {
      if (!arr || !Array.isArray(arr)) return undefined;
      const cleaned = arr.map(str => {
        // Clean each string in the array
        const parts = str.split(',').map(part => {
          return part.replace(/([^\d])0+$/g, '$1').trim();
        });
        let cleaned = parts.join(', ');
        cleaned = cleaned.replace(/[\s,]*0+[\s,]*$/g, '');
        cleaned = cleaned.replace(/\s*,\s*,/g, ',').replace(/\s+/g, ' ').trim();
        cleaned = cleaned.replace(/^,|,$/g, '');
        return cleaned;
      })
      .filter(str => str && str.trim() !== '' && str.trim() !== '0'); // Remove empty strings and standalone "0"
      
      // Return undefined if array is empty, not []
      return cleaned.length > 0 ? cleaned : undefined;
    };

    // Store price as JSONB to support both single number and range {min, max}
    // For backward compatibility, also store numeric value in price column
    const isPriceRange = typeof price === 'object' && 'min' in price && 'max' in price;
    const priceValue = isPriceRange ? price.min : price;
    
    const item: any = {
      businessId,
      category,
      name,
      price: priceValue, // Store min value for backward compatibility
      imageUrl,
      ingredients: cleanArrayField(ingredients),
      allergens: cleanArrayField(allergens),
      customizationOptions,
      is_featured: isFeatured || false,
      is_pregnancy_safe: isPregnancySafe || false,
    };
    
    // Store priceMax as fallback if priceData column doesn't exist
    // This allows us to reconstruct the range even without priceData
    if (isPriceRange) {
      // Try to add priceData first (preferred method)
      const priceData = price;
      try {
        item.priceData = priceData;
      } catch (e) {
        // Column might not exist yet - that's okay
        console.warn('priceData column may not exist, using priceMax fallback');
      }
      
      // Also store priceMax as fallback (in case priceData column doesn't exist)
      // This is a temporary solution until priceData migration is run
      try {
        item.priceMax = price.max;
      } catch (e) {
        // Column might not exist - that's okay, we'll try to use priceData
        console.warn('priceMax column may not exist');
      }
    }

    // Optional English fields
    if (nameEn && nameEn.trim()) {
      item.name_en = nameEn.trim();
    }
    if (ingredientsEn && Array.isArray(ingredientsEn) && ingredientsEn.length > 0) {
      item.ingredients_en = cleanArrayField(ingredientsEn);
    }
    if (allergensEn && Array.isArray(allergensEn) && allergensEn.length > 0) {
      item.allergens_en = cleanArrayField(allergensEn);
    }
    if (categoryEn && categoryEn.trim()) {
      item.category_en = categoryEn.trim();
    }

    // Add isBusiness if provided (only if column exists)
    if (isBusiness !== undefined) {
      item.isBusiness = isBusiness || false;
    }

    // Set sortOrder to a high value so new items appear at the end
    // Get the max sortOrder for this business and add 1
    const { data: existingItems } = await supabaseAdmin
      .from('menuItems')
      .select('sortOrder')
      .eq('businessId', businessId)
      .order('sortOrder', { ascending: false })
      .limit(1);

    if (existingItems && existingItems.length > 0 && existingItems[0].sortOrder !== null && existingItems[0].sortOrder !== undefined) {
      item.sortOrder = (existingItems[0].sortOrder as number) + 1;
    } else {
      // If no items exist or sortOrder column doesn't exist, set to 0 (will be handled by fallback)
      item.sortOrder = 0;
    }

    // Try to insert with all optional columns first
    let { error } = await supabaseAdmin.from('menuItems').insert(item);

    // If error is about optional columns not existing yet, retry without them
    if (error && error.message) {
      const message = error.message;
      const relatesToOptionalColumn =
        message.includes('isBusiness') ||
        message.includes('category_en') ||
        message.includes('name_en') ||
        message.includes('ingredients_en') ||
        message.includes('allergens_en') ||
        message.includes('sortOrder') ||
        message.includes('priceData');

      if (relatesToOptionalColumn) {
        console.warn('Optional menuItems columns may not exist yet, retrying without them:', message);

        const itemFallback: any = { ...item };
        delete itemFallback.isBusiness;
        delete itemFallback.category_en;
        delete itemFallback.name_en;
        delete itemFallback.ingredients_en;
        delete itemFallback.allergens_en;
        delete itemFallback.sortOrder;
        delete itemFallback.priceData; // Remove priceData if column doesn't exist
        delete itemFallback.priceMax; // Remove priceMax if column doesn't exist

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


