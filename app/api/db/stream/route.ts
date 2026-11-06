import { NextRequest } from 'next/server';
import { getAuth } from '@/lib/http';
import { listeners } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Avisa o navegador de que um documento mudou (ele busca de novo; só recebe aviso do que pode ler).
export function GET(req: NextRequest) {
  const user = getAuth(req)?.user ?? null, encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const write = (text: string) => { try { controller.enqueue(encoder.encode(text)); } catch { cleanup(); } };
      const listener = { user, send: (event: { c: string; id: string }) => write('data: ' + JSON.stringify(event) + '\n\n') };
      listeners.add(listener);
      const heartbeat = setInterval(() => write(': ping\n\n'), 25000);
      cleanup = () => { clearInterval(heartbeat); listeners.delete(listener); };
      req.signal.addEventListener('abort', () => { cleanup(); try { controller.close(); } catch { /* já fechado */ } });
      write('retry: 3000\n\n');
    },
    cancel() { cleanup(); },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store, no-transform', Connection: 'keep-alive' } });
}
