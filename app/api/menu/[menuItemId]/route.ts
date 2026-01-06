export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { MenuItem } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// PUT /api/menu/[menuItemId]
// Updates an existing menu item (by its menuItemId + businessId)
export async function PUT(
  req: NextRequest,
  { params }: { params: { menuItemId: string } },
) {
  try {
    const menuItemId = decodeURIComponent(params.menuItemId);
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
      isHidden,
      sortOrder,
    } = body as Partial<MenuItem> & { businessId?: string; price?: number | { min: number; max: number }; isHidden?: boolean; sortOrder?: number };

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }
    
    // Validate price if provided - can be number or range object
    if (price !== undefined && price !== null) {
      const isPriceRange = typeof price === 'object' && 'min' in price && 'max' in price;
      if (isPriceRange) {
        if (typeof price.min !== 'number' || typeof price.max !== 'number' || price.min >= price.max || price.min < 0) {
          return NextResponse.json({ message: 'Invalid price range' }, { status: 400 });
        }
      } else if (typeof price !== 'number' || price < 0) {
        return NextResponse.json({ message: 'Price must be a positive number' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (category !== undefined) updateData.category = category;
    // Always update categoryEn if it's provided (even if null or empty)
    if (categoryEn !== undefined) {
      if (categoryEn === null || categoryEn === '') {
        (updateData as any).category_en = null;
      } else if (typeof categoryEn === 'string') {
        const trimmed = categoryEn.trim();
        (updateData as any).category_en = trimmed || null;
      } else {
        (updateData as any).category_en = categoryEn;
      }
    }
    if (name !== undefined) updateData.name = name;
    if (nameEn !== undefined) {
      if (nameEn === null || nameEn === '') {
        (updateData as any).name_en = null;
      } else if (typeof nameEn === 'string') {
        (updateData as any).name_en = nameEn.trim() || null;
      } else {
        (updateData as any).name_en = nameEn;
      }
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

    if (price !== undefined) {
      // Store price as JSONB to support both single number and range {min, max}
      // For backward compatibility, also store numeric value in price column
      const priceValue = typeof price === 'object' && 'min' in price && 'max' in price ? price.min : price;
      updateData.price = priceValue; // Store min value for backward compatibility
      
      // Only add priceData if the column exists (for price range support)
      // If priceData column doesn't exist, we'll just use the numeric price
      const priceData = typeof price === 'object' && 'min' in price && 'max' in price ? price : price;
      // Try to add priceData, but don't fail if column doesn't exist
      try {
        updateData.priceData = priceData;
      } catch (e) {
        // Column might not exist yet - that's okay, we'll use numeric price
        console.warn('priceData column may not exist, using numeric price only');
      }
    }
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (ingredients !== undefined) updateData.ingredients = cleanArrayField(ingredients);
    if (ingredientsEn !== undefined) {
      (updateData as any).ingredients_en = cleanArrayField(ingredientsEn);
    }
    if (allergens !== undefined) updateData.allergens = cleanArrayField(allergens);
    if (allergensEn !== undefined) {
      (updateData as any).allergens_en = cleanArrayField(allergensEn);
    }
    if (customizationOptions !== undefined) updateData.customizationOptions = customizationOptions;
    if (isFeatured !== undefined) updateData.is_featured = isFeatured;
    if (isPregnancySafe !== undefined) updateData.is_pregnancy_safe = isPregnancySafe;
    if (isHidden !== undefined) updateData.isHidden = isHidden;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    
    // Handle isBusiness separately - if column doesn't exist, skip it
    let extraUpdates: any = {};
    if (isBusiness !== undefined) {
      extraUpdates.isBusiness = isBusiness;
    }

    // Try to update with all optional fields first
    const updatePayload = { ...updateData, ...extraUpdates };
    let { error } = await supabaseAdmin
      .from('menuItems')
      .update(updatePayload)
      .eq('businessId', businessId)
      .eq('name', menuItemId);

    // If error is about optional columns not existing, retry without them
    if (error && error.message) {
      const message = error.message.toLowerCase();
      const relatesToOptionalColumn =
        message.includes('isbusiness') ||
        message.includes('category_en') ||
        message.includes('name_en') ||
        message.includes('ingredients_en') ||
        message.includes('allergens_en') ||
        message.includes('pricedata') ||
        message.includes('pricemax') ||
        (message.includes('column') && message.includes('_en'));

      if (relatesToOptionalColumn) {
        console.warn('Optional menuItems columns may not exist yet, retrying update without them:', error.message);

        const fallbackUpdate: any = { ...updateData };
        // Remove optional English columns from fallback update
        delete fallbackUpdate.category_en;
        delete fallbackUpdate.name_en;
        delete fallbackUpdate.ingredients_en;
        delete fallbackUpdate.allergens_en;
        delete fallbackUpdate.priceData; // Remove priceData if column doesn't exist
        delete fallbackUpdate.priceMax; // Remove priceMax if column doesn't exist
        delete extraUpdates.isBusiness;

        const retry = await supabaseAdmin
          .from('menuItems')
          .update(fallbackUpdate)
          .eq('businessId', businessId)
          .eq('name', menuItemId);

        if (retry.error) {
          console.error('Error updating menu item (retry)', retry.error);
          return NextResponse.json(
            {
              message: 'Database error',
              details: retry.error.message,
            },
            { status: 500 },
          );
        }

        console.error('⚠️ category_en column may not exist in database. Please add it with: ALTER TABLE "menuItems" ADD COLUMN IF NOT EXISTS "category_en" TEXT;');
        return NextResponse.json(
          {
            message: 'Updated (some optional columns not found - please run SQL migrations)',
            warning: 'category_en column may not exist. Please add it to the database.',
          },
          { status: 200 },
        );
      }
    }

    if (error) {
      console.error('Error updating menu item', error);
      return NextResponse.json({ 
        message: 'Database error', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Updated' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating menu item', error);
    return NextResponse.json({ 
      message: 'Internal server error',
      details: error?.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}

// DELETE /api/menu/[menuItemId]?businessId=...
export async function DELETE(
  req: NextRequest,
  { params }: { params: { menuItemId: string } },
) {
  try {
    const menuItemId = params.menuItemId;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('menuItems')
      .delete()
      .eq('businessId', businessId)
      .eq('name', menuItemId);

    if (error) {
      console.error('Error deleting menu item', error);
      return NextResponse.json({ message: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting menu item', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


