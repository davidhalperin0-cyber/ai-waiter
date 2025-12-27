import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth";
import { SUPER_ADMIN_EMAIL } from "@/lib/superAdminAuth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isDashboard = pathname.startsWith("/dashboard");
  const isSuperAdmin = pathname.startsWith("/super-admin");
  const isMenu = pathname.startsWith("/menu/");

  // Redirect menu pages to home page if accessing directly (not /home or /chat)
  if (isMenu) {
    // Pattern: /menu/[businessId]/[tableId] - redirect to /home
    // But don't redirect if already on /home or /chat
    const menuPathMatch = pathname.match(/^\/menu\/([^/]+)\/([^/]+)$/);
    if (menuPathMatch) {
      // This is exactly /menu/[businessId]/[tableId] - redirect to /home
      const redirectUrl = new URL(`${pathname}/home`, req.url);
      return NextResponse.redirect(redirectUrl);
    }
    // Otherwise, continue (could be /home, /chat, or other sub-routes)
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (isDashboard) {
    const token = req.cookies.get("auth")?.value;

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyAuthToken(token);
    if (!payload || payload.role !== 'business') {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Protect super-admin routes (but allow access to login page)
  if (isSuperAdmin) {
    // Allow access to login page without authentication
    if (pathname === '/super-admin/login') {
      return NextResponse.next();
    }

    const token = req.cookies.get("auth")?.value;

    if (!token) {
      console.log('Middleware - No token found');
      const loginUrl = new URL("/super-admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    console.log('Middleware - token exists:', !!token);
    console.log('Middleware - token length:', token.length);
    console.log('Middleware - token preview:', token.substring(0, 30) + '...');
    
    const payload = await verifyAuthToken(token);
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || '';
    
    console.log('Middleware - payload:', payload ? { email: payload.email, role: payload.role, businessId: payload.businessId } : 'null');
    console.log('Middleware - adminEmail:', adminEmail);
    
    // If payload is null, try to see what the error is
    if (!payload) {
      console.log('Middleware - Token verification failed, checking JWT_SECRET...');
      console.log('Middleware - JWT_SECRET exists:', !!process.env.JWT_SECRET);
      console.log('Middleware - JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
    }
    
    if (!payload) {
      console.log('No valid token payload - redirecting to login');
      const loginUrl = new URL("/super-admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    if (payload.role !== 'super_admin') {
      console.log('Role mismatch:', payload.role, 'expected: super_admin');
      const loginUrl = new URL("/super-admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    if (payload.email !== adminEmail.trim()) {
      console.log('Email mismatch in middleware:', payload.email, 'vs', adminEmail.trim());
      const loginUrl = new URL("/super-admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    console.log('Super admin authenticated:', payload.email);

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/super-admin/:path*", "/menu/:path*"],
};


