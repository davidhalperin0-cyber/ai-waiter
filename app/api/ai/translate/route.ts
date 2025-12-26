import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.warn('OPENAI_API_KEY is not set. /api/ai/translate will return 500 until it is configured.');
}

const client = openaiApiKey
  ? new OpenAI({ apiKey: openaiApiKey })
  : null;

type TranslateTarget =
  | 'category'
  | 'name'
  | 'ingredients'
  | 'allergens';

export async function POST(req: NextRequest) {
  try {
    if (!client || !openaiApiKey) {
      return NextResponse.json(
        { message: 'OPENAI_API_KEY is not configured on the server' },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { text, target } = body as { text?: string; target?: TranslateTarget };

    if (!text || !target) {
      return NextResponse.json(
        { message: 'Missing text or target' },
        { status: 400 },
      );
    }

    const systemPrompt =
      'You are a professional translator from Hebrew to English for restaurant menus. ' +
      'Return only the translated text without quotes or explanations. ' +
      'Keep meanings accurate, short and natural for menus.';

    const userPrompt = (() => {
      switch (target) {
        case 'category':
          return `Translate this menu category from Hebrew to concise English (for example "ראשונות" -> "Starters"):\n${text}`;
        case 'name':
          return `Translate this dish name from Hebrew to natural English menu name:\n${text}`;
        case 'ingredients':
          return `Translate this comma-separated list of ingredients from Hebrew to English, keeping it comma-separated:\n${text}`;
        case 'allergens':
          return `Translate this comma-separated list of allergens from Hebrew to English, keeping it comma-separated:\n${text}`;
        default:
          return `Translate from Hebrew to English:\n${text}`;
      }
    })();

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 120,
    });

    const translated =
      response.choices[0]?.message?.content?.trim() || '';

    if (!translated) {
      return NextResponse.json(
        { message: 'Empty translation from model' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { translated },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('AI translate error:', error);
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 },
    );
  }
}




