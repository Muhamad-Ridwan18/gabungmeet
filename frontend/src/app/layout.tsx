import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/common/Providers";
import { APP_NAME } from "@/constants";
import { fetchPublicBranding } from "@/lib/branding-server";
import "./globals.css";

const display = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchPublicBranding();
  const icons = branding.logo_url
    ? { icon: branding.logo_url, shortcut: branding.logo_url, apple: branding.logo_url }
    : undefined;

  return {
    title: {
      default: APP_NAME,
      template: `%s · ${APP_NAME}`,
    },
    description:
      "Private trading community. Verify your broker with Santara Pips to unlock premium content.",
    icons,
  };
}

const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('ib_theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.remove('light','dark');
    document.documentElement.classList.add(theme);
    var loc = localStorage.getItem('ib_locale');
    document.documentElement.lang = (loc === 'en' || loc === 'id') ? loc : 'id';
  } catch (e) {
    document.documentElement.classList.add('dark');
    document.documentElement.lang = 'id';
  }
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
