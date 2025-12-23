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

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (category !== undefined) updateData.category = category;
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (ingredients !== undefined) updateData.ingredients = ingredients;
    if (allergens !== undefined) updateData.allergens = allergens;
    if (customizationOptions !== undefined) updateData.customizationOptions = customizationOptions;
    if (isFeatured !== undefined) updateData.is_featured = isFeatured;
    if (isPregnancySafe !== undefined) updateData.is_pregnancy_safe = isPregnancySafe;
    
    // Handle isBusiness separately - if column doesn't exist, skip it
    let isBusinessUpdate: any = {};
    if (isBusiness !== undefined) {
      isBusinessUpdate.isBusiness = isBusiness;
    }

    // Try to update with isBusiness first
    let updatePayload = { ...updateData, ...isBusinessUpdate };
    let { error } = await supabaseAdmin
      .from('menuItems')
      .update(updatePayload)
      .eq('businessId', businessId)
      .eq('name', menuItemId);

    // If error is about isBusiness column not existing, retry without it
    if (error && error.message?.includes('isBusiness')) {
      console.warn('isBusiness column may not exist yet, retrying without it:', error.message);
      // Retry without isBusiness
      const retry = await supabaseAdmin
        .from('menuItems')
        .update(updateData)
        .eq('businessId', businessId)
        .eq('name', menuItemId);
      
      if (retry.error) {
        console.error('Error updating menu item (retry)', retry.error);
        return NextResponse.json({ 
          message: 'Database error', 
          details: retry.error.message 
        }, { status: 500 });
      }
      
      // Return success but warn that isBusiness wasn't updated
      return NextResponse.json({ 
        message: 'Updated (isBusiness column not found - please run SQL migration)',
        warning: 'isBusiness was not updated because the column does not exist in the database'
      }, { status: 200 });
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


