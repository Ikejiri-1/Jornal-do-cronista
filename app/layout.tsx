import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Entrar · O Contista',
  description: 'O Contista: contos, poemas, crônicas e histórias em formato de jornal.',
  robots: { index: false },
};

export const viewport: Viewport = { viewportFit: 'cover' }; // o jornal usa as áreas seguras do iPhone

const FONTS = 'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Special+Elite&family=UnifrakturCook:wght@700&display=swap';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} referrerPolicy="no-referrer" />
        <link rel="stylesheet" href="/surreal.css" />
        <link rel="icon" href="data:," />
      </head>
      <body>
        {children}
        <Script src="/fundos/fundos.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
