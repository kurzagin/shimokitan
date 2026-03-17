
import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'id', 'ja'];
const defaultLocale = 'en';

function getLocale(request: NextRequest): string {
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    if (cookieLocale && locales.includes(cookieLocale)) {
        return cookieLocale;
    }

    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
        const preferredLocales = acceptLanguage
            .split(',')
            .map((lang: string) => lang.split(';')[0].split('-')[0].trim())
            .filter(Boolean);

        const match = preferredLocales.find((lang: string) => locales.includes(lang));
        if (match) return match;
    }

    return defaultLocale;
}

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // If it's already localized, continue
    if (pathnameHasLocale) return NextResponse.next();

    // If it's the root path exactly, redirect to default locale
    if (pathname === '/') {
        return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
    }

    // Otherwise, prefix with detected locale
    const locale = getLocale(request);
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)',
    ],
};
