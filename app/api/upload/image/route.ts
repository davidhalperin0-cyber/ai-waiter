import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'menu-images';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const businessId = (formData.get('businessId') as string | null) || 'unknown';

    if (!file) {
      return NextResponse.json({ message: 'Missing file' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${businessId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return NextResponse.json(
        { message: 'Upload failed', details: uploadError.message },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    return NextResponse.json(
      {
        url: publicUrl,
        path: fileName,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 },
    );
  }
}


