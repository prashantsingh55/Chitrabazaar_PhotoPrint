import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow static assets, images, next internal routes, and public auth endpoints
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/auth') ||
    path.startsWith('/favicon.ico') ||
    path.match(/\.(png|jpg|jpeg|svg|webp|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'chitrabazaar-fallback-secret-key-32chars',
  });

  const isAuthenticated = !!token;
  const role = token?.role;

  // 1. Photo Studio Admin Panel Protection
  if (path.startsWith('/studio')) {
    // Allow public studio login page
    if (path === '/studio/login') {
      if (isAuthenticated && (role === 'STUDIO_ADMIN' || role === 'SUPER_ADMIN')) {
        return NextResponse.redirect(new URL('/studio/dashboard', req.url));
      }
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      const loginUrl = new URL('/studio/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (role !== 'STUDIO_ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login?error=UnauthorizedStudioAccess', req.url));
    }

    return NextResponse.next();
  }

  // 2. Chitrabazaar Super Admin Dashboard Protection
  if (path.startsWith('/admin')) {
    // Allow public admin login page
    if (path === '/admin/login') {
      if (isAuthenticated && role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login?error=UnauthorizedAdminAccess', req.url));
    }

    return NextResponse.next();
  }

  // 3. Customer Protected Routes (Orders, Checkout, Profile)
  const isCustomerProtected =
    path.startsWith('/orders') ||
    path.startsWith('/checkout') ||
    path.startsWith('/profile');

  if (isCustomerProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/studio/:path*',
    '/admin/:path*',
    '/orders/:path*',
    '/checkout',
    '/profile',
  ],
};
