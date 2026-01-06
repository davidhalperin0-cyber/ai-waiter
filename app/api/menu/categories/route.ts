import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// POST /api/menu/categories
// Save a new category for a business
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, category, categoryEn } = body;

    if (!businessId || !category) {
      return NextResponse.json({ message: 'businessId and category are required' }, { status: 400 });
    }

    // Check if category already exists (from menuItems)
    const { data: existingItems } = await supabaseAdmin
      .from('menuItems')
      .select('category, category_en')
      .eq('businessId', businessId)
      .eq('category', category.trim())
      .limit(1);

    // If category already exists, just return success
    if (existingItems && existingItems.length > 0) {
      return NextResponse.json({ 
        message: 'Category already exists',
        category: category.trim(),
        categoryEn: categoryEn?.trim() || existingItems[0].category_en || undefined,
      }, { status: 200 });
    }

    // Category doesn't exist yet - it will be saved when the first menu item with this category is created
    // For now, we just return success
    // The category will appear in the list once a menu item is created with it
    return NextResponse.json({ 
      message: 'Category will be saved when you create a menu item with it',
      category: category.trim(),
      categoryEn: categoryEn?.trim() || undefined,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error saving category', error);
    return NextResponse.json({ 
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// GET /api/menu/categories?businessId=...
// Returns all unique categories for a business
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    // Get all unique categories for this business
    const { data: menuItems, error } = await supabaseAdmin
      .from('menuItems')
      .select('category, category_en')
      .eq('businessId', businessId);

    if (error) {
      console.error('Error fetching categories', error);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    // Extract unique categories
    const categoriesMap = new Map<string, { category: string; categoryEn?: string }>();
    
    if (menuItems) {
      for (const item of menuItems) {
        const category = item.category?.trim();
        if (category) {
          if (!categoriesMap.has(category)) {
            categoriesMap.set(category, {
              category: category,
              categoryEn: item.category_en?.trim() || undefined,
            });
          } else {
            // If we already have this category but without categoryEn, and this item has it, update it
            const existing = categoriesMap.get(category);
            if (existing && !existing.categoryEn && item.category_en?.trim()) {
              existing.categoryEn = item.category_en.trim();
            }
          }
        }
      }
    }

    // Convert map to array and sort
    const categories = Array.from(categoriesMap.values()).sort((a, b) => 
      a.category.localeCompare(b.category)
    );

    return NextResponse.json({ 
      categories,
      count: categories.length
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching categories', error);
    return NextResponse.json({ 
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

