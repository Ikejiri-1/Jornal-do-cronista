import type { Metadata } from 'next';
import body from './_jornal/body';
import Jornal from './_jornal/Jornal';

export const metadata: Metadata = {
  title: 'Raul Xavier',
  description: 'O Contista: contos, poemas, crônicas e histórias de Raul Xavier, em formato de jornal.',
  robots: { index: true },
  icons: { icon: '/jornal/icone.svg', apple: '/jornal/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'O Contista' },
  formatDetection: { telephone: false, date: false, address: false, email: false },
};

export default function Home() {
  return <Jornal html={body} />;
}
