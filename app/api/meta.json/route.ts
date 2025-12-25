import { NextResponse } from 'next/server';

export async function GET() {
  // Minimal metadata so שהדפדפן / קוד הצד-לקוח לא יקבל 404 על meta.json
  return NextResponse.json({
    name: 'QR Ordering SaaS',
    description: 'מערכת הזמנות QR חכמה למסעדות ולברים',
    version: '1.0.0',
  });
}


