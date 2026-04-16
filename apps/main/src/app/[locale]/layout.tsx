
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Providers from "../providers";
import { locales, Locale, defaultLocale, getDictionary } from "@shimokitan/utils";
import { PersistAudio } from "../../components/audio/PersistAudio";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://shimokitan.live";
  const dict = getDictionary(locale as Locale);

  const title = dict.home.title;
  const description = dict.home.description;

  return {
    title: {
      default: title,
      template: "%s // Shimokitan"
    },
    description: description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: baseUrl + (locale ? `/${locale}` : ''),
      languages: {
        'en': '/en',
        'ja': '/ja',
        'id': '/id',
        'x-default': '/en',
      },
    },
    openGraph: {
      type: "website",
      siteName: "Shimokitan",
      title: "Shimokitan",
      description: description,
      images: [
        {
          url: "/tokyo.jpg",
          width: 1200,
          height: 630,
          alt: "Shimokitan // District Overview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Shimokitan",
      description: description,
      images: ["/tokyo.jpg"],
    },
  };
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale || defaultLocale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-violet-500/30 selection:text-violet-200`}
      >
        <Providers>
          {children}
          <PersistAudio />
        </Providers>
      </body>
    </html>
  );
}
