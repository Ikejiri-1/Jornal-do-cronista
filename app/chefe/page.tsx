import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { readSession } from '@/lib/auth';
import { SESSION_COOKIE } from '@/lib/http';
import { isChefe } from '@/lib/store';
import ChefePanel from './ChefePanel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Painel do chefe · O Contista', robots: { index: false } };

// Quem não é o chefe vê 404: a página não revela que existe. A API também checa (store.ts).
export default async function ChefePage() {
  const session = readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || !isChefe(session.user)) notFound();
  return <ChefePanel csrf={session.csrf} />;
}
