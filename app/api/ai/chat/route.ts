import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { MenuItem } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, tableId, cart, messages } = body as {
      businessId: string;
      tableId: string;
      cart: { menuItemId: string; quantity: number; customizations?: string[] }[];
      messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    };

    if (!businessId || !tableId || !cart) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Fetch business info to get custom AI instructions
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('aiInstructions')
      .eq('businessId', businessId)
      .single();

    if (businessError) {
      console.error('Error fetching business for AI instructions', businessError);
    }

    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from('menuItems')
      .select('*')
      .eq('businessId', businessId);

    if (menuError) {
      console.error('Error fetching menu items for AI', menuError);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    // Base system prompt
    let systemPrompt = `You are an AI assistant for a restaurant QR ordering system.
You MUST only reference menu items that exist in the provided menu.
You help with allergies, ingredients, sugar, gluten, pregnancy safety (using the isPregnancySafe flag), and custom modifications.
You can suggest upsells only from the menu.
When the user is ready, you summarize the final order clearly and ask for explicit confirmation.
Do not submit or place the order yourself.

IMPORTANT: In addition to your natural language answer in Hebrew, you MUST also output at the very end of the message a single line starting with:
ACTIONS_JSON: [...]

This line must contain a valid JSON array describing actions you want the client to perform.
You support three types of actions:
1. "add_to_cart": { "type": "add_to_cart", "itemName": "<exact menu item name from the Menu JSON>", "quantity": 1 }
2. "remove_from_cart": { "type": "remove_from_cart", "itemName": "<exact menu item name from the Menu JSON>", "quantity": 1 }
3. "show_item": { "type": "show_item", "itemName": "<exact menu item name from the Menu JSON>" }

Rules:
- If the user clearly asks to add an item to the order/cart (for example: "תוסיף גם פיצה מרגריטה"), you add a corresponding add_to_cart action.
- If the user clearly asks to remove an item from the order/cart (for example: "תסיר את הפיצה", "לא רוצה את הבירה"), you add a corresponding remove_from_cart action.
- If the user asks about a specific menu item, wants to see it, or you mention/recommend a menu item in your response, you MUST add a show_item action so the customer can see the item details visually.
- itemName MUST match exactly the "name" field of one of the menu items in the Menu JSON.
- quantity should be a positive integer (default 1 if the user did not specify).
- If there are no actions to perform, output: ACTIONS_JSON: [] at the end.
- The ACTIONS_JSON line must be the LAST line of your message so the client can parse it easily.
`;

    // Add custom business instructions if they exist
    if (business?.aiInstructions && business.aiInstructions.trim()) {
      systemPrompt += `\n\nIMPORTANT BUSINESS-SPECIFIC INSTRUCTIONS:\n${business.aiInstructions}\n\nFollow these instructions strictly when answering customer questions.`;
    }

    const menuContext = JSON.stringify(menuItems);
    const cartContext = JSON.stringify(cart);

    const openAIMessages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'system' as const,
        content: `Menu JSON: ${menuContext}`,
      },
      {
        role: 'system' as const,
        content: `Current cart JSON: ${cartContext}. Business ID: ${businessId}, Table ID: ${tableId}.`,
      },
      ...messages,
    ];

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openAIMessages,
    });

    const text = completion.choices[0]?.message?.content ?? '';

    // Try to extract ACTIONS_JSON line from the end of the message
    let replyText = text;
    let actions: any[] = [];
    let mentionedItem: MenuItem | null = null;

    const match = text.match(/ACTIONS_JSON:\s*(\[[\s\S]*\])\s*$/);
    if (match) {
      const jsonPart = match[1];
      try {
        const parsed = JSON.parse(jsonPart);
        if (Array.isArray(parsed)) {
          actions = parsed;
          
          // Find show_item action and get the full item details
          const showItemAction = parsed.find((a: any) => a?.type === 'show_item');
          if (showItemAction?.itemName) {
            const item = menuItems.find(
              (m: any) => m.name.toLowerCase() === showItemAction.itemName.toLowerCase(),
            );
            if (item) {
              // Map DB columns to frontend fields
              mentionedItem = {
                ...item,
                isFeatured: item.is_featured || false,
                isPregnancySafe: item.is_pregnancy_safe || false,
              } as MenuItem;
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse ACTIONS_JSON from AI reply', err);
      }
      // Remove the ACTIONS_JSON line from what the user sees
      replyText = text.slice(0, match.index).trim();
    }

    return NextResponse.json({ reply: replyText, actions, mentionedItem }, { status: 200 });
  } catch (error) {
    console.error('AI chat error', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

