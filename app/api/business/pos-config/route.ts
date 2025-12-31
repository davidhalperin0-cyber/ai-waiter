export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAuthToken } from '@/lib/auth';
import { PosConfig } from '@/lib/types';

// PUT /api/business/pos-config
// Authenticated business only - updates POS configuration
export async function PUT(req: NextRequest) {
  try {
    // Authenticate request
    const token = req.cookies.get('auth')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || payload.role !== 'business') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { posConfig } = body as { posConfig?: PosConfig };

    if (!posConfig) {
      return NextResponse.json({ message: 'posConfig is required' }, { status: 400 });
    }

    // Validate posConfig structure
    if (typeof posConfig.enabled !== 'boolean') {
      return NextResponse.json({ message: 'enabled must be a boolean' }, { status: 400 });
    }

    // Set default provider if not provided
    if (!posConfig.provider) {
      posConfig.provider = 'generic';
    }

    if (typeof posConfig.endpoint !== 'string' || posConfig.endpoint.trim() === '') {
      if (posConfig.enabled) {
        return NextResponse.json({ message: 'endpoint is required when enabled is true' }, { status: 400 });
      }
    }

    if (posConfig.method !== 'POST') {
      return NextResponse.json({ message: 'method must be POST' }, { status: 400 });
    }

    if (typeof posConfig.headers !== 'object' || Array.isArray(posConfig.headers)) {
      return NextResponse.json({ message: 'headers must be an object' }, { status: 400 });
    }

    if (typeof posConfig.timeoutMs !== 'number' || posConfig.timeoutMs < 100 || posConfig.timeoutMs > 60000) {
      return NextResponse.json({ message: 'timeoutMs must be between 100 and 60000' }, { status: 400 });
    }

    // Sanitize headers - remove any sensitive keys from logs
    const sanitizedHeaders = { ...posConfig.headers };
    Object.keys(sanitizedHeaders).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('key') || lowerKey.includes('secret') || lowerKey.includes('token') || lowerKey.includes('password')) {
        // Keep the key but don't log the value
        sanitizedHeaders[key] = '[REDACTED]';
      }
    });

    // Update posConfig in businesses table
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update({ posConfig })
      .eq('businessId', payload.businessId)
      .select('posConfig')
      .single();

    if (error) {
      console.error('Error updating POS config', error);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    // Return sanitized config (without sensitive header values)
    const responseConfig = {
      ...data.posConfig,
      headers: sanitizedHeaders,
    };

    return NextResponse.json({ posConfig: responseConfig }, { status: 200 });
  } catch (error) {
    console.error('Error updating POS config', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

