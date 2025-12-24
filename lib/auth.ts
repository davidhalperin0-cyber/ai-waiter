import { SignJWT, jwtVerify, JWTPayload } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

// Convert JWT_SECRET to Uint8Array for jose
const getSecretKey = () => {
  return new TextEncoder().encode(JWT_SECRET);
};

export type AuthRole = "business" | "super_admin";

// Extend JWTPayload so it matches what jose expects while still being typed
export interface AuthPayload extends JWTPayload {
  businessId: string;
  email: string;
  role: AuthRole;
}

export async function signAuthToken(payload: AuthPayload): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set - cannot create authentication token');
  }
  
  try {
    const secretKey = getSecretKey();
    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secretKey);
    return jwt;
  } catch (error: any) {
    console.error('Error signing JWT token', error);
    throw new Error(`Failed to sign token: ${error?.message || 'Unknown error'}`);
  }
}

export async function verifyAuthToken(token: string): Promise<AuthPayload | null> {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set in verifyAuthToken');
      return null;
    }
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return payload as AuthPayload;
  } catch (error: any) {
    console.error('Token verification error:', error.message);
    return null;
  }
}


