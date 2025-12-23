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
    const menuItemId = params.menuItemId;
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
    } = body as Partial<MenuItem> & { businessId?: string; price?: number };

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (category !== undefined) updateData.category = category;
    if (categoryEn !== undefined) (updateData as any).category_en = categoryEn;
    if (name !== undefined) updateData.name = name;
    if (nameEn !== undefined) (updateData as any).name_en = nameEn;
    if (price !== undefined) updateData.price = price;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (ingredients !== undefined) updateData.ingredients = ingredients;
    if (ingredientsEn !== undefined) (updateData as any).ingredients_en = ingredientsEn;
    if (allergens !== undefined) updateData.allergens = allergens;
    if (allergensEn !== undefined) (updateData as any).allergens_en = allergensEn;
    if (customizationOptions !== undefined) updateData.customizationOptions = customizationOptions;
    if (isFeatured !== undefined) updateData.is_featured = isFeatured;
    if (isPregnancySafe !== undefined) updateData.is_pregnancy_safe = isPregnancySafe;
    
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
      const message = error.message;
      const relatesToOptionalColumn =
        message.includes('isBusiness') ||
        message.includes('name_en') ||
        message.includes('ingredients_en') ||
        message.includes('allergens_en');

      if (relatesToOptionalColumn) {
        console.warn('Optional menuItems columns may not exist yet, retrying update without them:', message);

        const fallbackUpdate: any = { ...updateData };
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

        return NextResponse.json(
          {
            message: 'Updated (some optional columns not found - please run SQL migrations)',
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
  } catch (error) {
    console.error('Error updating menu item', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
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


