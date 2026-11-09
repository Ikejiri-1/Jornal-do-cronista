'use client';
import { useEffect } from 'react';
import './jornal.css';

// A lógica do jornal (telas, votação, máquina de escrever, xadrez) roda como módulo do Next, depois que a marcação já chegou no HTML.
// O fundo ilustrado (scenes.js/fundos.js) vem do layout; espera ele estar pronto para o primeiro desenho sair com o tema certo.
export default function Jornal({ html }: { html: string }) {
  useEffect(() => {
    const ready = new Promise<void>((resolve) => {
      const w = window as unknown as { Fundos?: unknown };
      if (w.Fundos) return resolve();
      const timer = setInterval(() => { if (w.Fundos) { clearInterval(timer); resolve(); } }, 20);
      setTimeout(() => { clearInterval(timer); resolve(); }, 3000);
    });
    ready.then(() => import('./engine.js'));
  }, []);
  // display: contents mantém os filhos como se fossem filhos diretos do body (o CSS do jornal depende disso).
  return <div style={{ display: 'contents' }} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
