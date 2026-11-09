// Peças de tela repetidas (avatar, resumo, botão de abrir, selo de status). Substituem os construtores de string de html.js/edicao.js/engine.js
// nas telas já convertidas; texto do banco sempre passa pelo escape do React.
import { Fragment } from 'react';
import { hashStr } from './semana.js';

const tint = ['#d8d8d3', '#bdbdb7', '#a0a09a', '#7c7c78', '#e6e6e1'];
let seq = 0;

export function Avatar({ name }: { name: string }) {
  const g = tint[hashStr(name) % 5];
  const id = 'kv' + ++seq; // um id por desenho: o padrão e o recorte do SVG são referenciados por ele
  const ini = (String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0)).join('') || '?').toUpperCase();
  return (
    <svg className="avatar" viewBox="0 0 64 64" role="img" aria-label={'Retrato ilustrado de ' + name}>
      <defs>
        <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2.5" cy="2.5" r="1.1" fill="#000" /></pattern>
        <clipPath id={'c' + id}><circle cx="32" cy="32" r="31" /></clipPath>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <rect width="64" height="64" fill={g} />
        <circle cx="32" cy="26" r="11" fill="#111" />
        <path d="M8 64q0-22 24-22t24 22z" fill="#111" />
        <rect width="64" height="64" fill={`url(#${id})`} opacity=".25" />
      </g>
      <text x="32" y="59" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#fff">{ini}</text>
    </svg>
  );
}

type Item = { kind: string; key: string; text: string; locked?: boolean; earlyUntil?: number; genre?: string; status?: string; check?: { v?: number; revisadoPorEditor?: boolean } };

const daysLeft = (until: number) => Math.max(1, Math.ceil((until - Date.now()) / 864e5));
const isPoem = (it: Item) => /poema|poesia|verso/i.test(it.genre || '');

export function Excerpt({ item, n }: { item: Item; n: number }) {
  if (item.locked) {
    const d = daysLeft(item.earlyUntil || 0);
    return <>Em primeira mão para assinantes. Abre para todos em {d} {d === 1 ? 'dia' : 'dias'}.</>;
  }
  if (isPoem(item)) {
    const all = item.text.split('\n').filter((l) => l.trim());
    const lines = all.slice(0, 4);
    return <>{lines.map((l, i) => <Fragment key={i}>{i > 0 && <br />}{l}</Fragment>)}{all.length > 4 && <><br />…</>}</>;
  }
  const t = item.text.replace(/\s+/g, ' ').trim();
  if (t.length <= n) return <>{t}</>;
  let cut = t.slice(0, n); cut = cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 30));
  return <>{cut.replace(/[\s,;:—-]+$/, '')}…</>;
}

export function OpenBtn({ item, className, children }: { item: Item; className: string; children: React.ReactNode }) {
  return <button className={className} data-act="open" data-kind={item.kind} data-key={item.key}>{children}</button>;
}

export function StatusChip({ item }: { item: Item }) {
  if (item.status === 'analise' || !(item.check && item.check.v)) return <span className="chip wait">Em análise do editor</span>;
  return <span className="chip ok">{item.check.revisadoPorEditor ? 'Aprovada pelo editor' : 'Aprovada na vistoria'}</span>;
}

export const plural = (n: number, a: string, b: string) => (n === 1 ? a : b);
