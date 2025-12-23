import { verifyAuthToken } from './auth';

// Get super admin email from environment variable
export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || '';

/**
 * Check if the request is from a super admin
 * @param token - JWT token from cookie
 * @returns true if the user is a super admin, false otherwise
 */
export async function isSuperAdmin(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  
  const payload = await verifyAuthToken(token);
  if (!payload) return false;
  
  // Check if email matches super admin email
  if (!SUPER_ADMIN_EMAIL) {
    console.warn('SUPER_ADMIN_EMAIL is not set in environment variables');
    return false;
  }
  
  return payload.email === SUPER_ADMIN_EMAIL && payload.role === 'super_admin';
}

/**
 * Get super admin email from token
 * @param token - JWT token from cookie
 * @returns email if user is super admin, null otherwise
 */
export async function getSuperAdminEmail(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  
  const payload = await verifyAuthToken(token);
  if (!payload) return null;
  
  if (payload.email === SUPER_ADMIN_EMAIL && payload.role === 'super_admin') {
    return payload.email;
  }
  
  return null;
}

