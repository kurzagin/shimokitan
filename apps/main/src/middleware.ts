
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from '@shimokitan/utils';
import { AUTH_COOKIE_NAMES } from '@shimokitan/auth';

function getLocale(request: NextRequest): string {
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    if (cookieLocale && (locales as any).includes(cookieLocale)) {
        return cookieLocale;
    }

    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
        // Parse "en-US,en;q=0.9,id;q=0.8,ja;q=0.7" -> ["en", "id", "ja"]
        const preferredLocales = acceptLanguage
            .split(',')
            .map(lang => lang.split(';')[0].split('-')[0].trim())
            .filter(Boolean);

        // Find the first one we support
        const match = preferredLocales.find(lang => (locales as any).includes(lang));
        if (match) return match;
    }

    return defaultLocale;
}


/**
 * Next.js Middleware.
 * This function handles routing, locales, and authentication checks.
 */
export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 0. Skip system paths
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') ||
        pathname === '/robots.txt'
    ) {
        return NextResponse.next();
    }

    // 1. Determine Locale and SubPathname (Unify)
    const currentLocaleMatch = locales.find(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );
    const pathnameHasLocale = !!currentLocaleMatch;

    let locale: string;
    let subPathname: string;

    if (pathnameHasLocale && currentLocaleMatch) {
        locale = currentLocaleMatch;
        subPathname = pathname.replace(new RegExp(`^/${locale}/?`), '/') || '/';
    } else {
        locale = getLocale(request);
        subPathname = pathname;
    }

    const cleanSubPathname = subPathname.replace(/\/$/, '') || '/';

    // 2. Special Routes and Gatekeeper
    const isProduction = process.env.NODE_ENV === 'production';
    const isComingSoon = cleanSubPathname === '/coming-soon';
    const isAuth = cleanSubPathname.startsWith('/auth');
    const isPedalboard = cleanSubPathname.startsWith('/pedalboard');
    const isLogin = cleanSubPathname === '/login';
    const isDisconnect = cleanSubPathname === '/disconnect';

    // Hide coming-soon pages for production
    if (isProduction && isComingSoon) {
        return NextResponse.redirect(new URL(`/${locale}/`, request.url));
    }

    // Hide all auth-based routes in production
    if (isProduction && (isAuth || isPedalboard || isLogin || isDisconnect)) {
        return NextResponse.redirect(new URL(`/${locale}/`, request.url));
    }

    // Handle Auth Aliases (Development only, as production is covered above)
    if (isLogin) {
        return NextResponse.redirect(new URL(`/${locale}/auth/signin`, request.url));
    }
    if (isDisconnect) {
        return NextResponse.redirect(new URL(`/${locale}/api/auth/signout?callbackUrl=/${locale}/`, request.url));
    }

    const sessionTokenActive = AUTH_COOKIE_NAMES.some(name => request.cookies.get(name)?.value);

    // 3. Vision/Roadmap Aliases (Redirects)
    if (cleanSubPathname === '/roadmap' || cleanSubPathname === '/vision') {
        return NextResponse.redirect(new URL(`/${locale}/about/vision`, request.url));
    }

    // 4. Authenticated Area Enforcement (for pedalboard)
    if (isPedalboard && !sessionTokenActive) {
        const callbackUrl = encodeURIComponent(pathname);
        return NextResponse.redirect(new URL(`/${locale}/auth/signin?callbackUrl=${callbackUrl}`, request.url));
    }

    // 5. Handle Locale Prefixing (if not already there)
    if (!pathnameHasLocale) {
        const url = new URL(request.url);
        url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)',
    ],
};
