// Aba Capa do Jornal em React: abas de página, manchete, páginas da edição e colunas de leitura.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { state, plural } from '../core/base.js';
import { allWorks } from '../core/dados.js';
import { MESL, bioOf, nameOf } from './edicao.js';
import { closeLabel, dShort, editionData, weekNow, weekRange } from './semana.js';
import { Avatar, Excerpt, OpenBtn } from './kit';
import { ArtFigure, ArtSvg, Body, Byline, ChessSlot, CommentsBox, ReaderTools, Stars, fsStyle } from './pecas';

type Item = any;
const ord = (p: number) => (p === 1 ? 'Capa' : (p - 1) + 'ª Página');

function deckOf(it: Item) {
  const t = String(it.text || '').trim();
  if (/poema|poesia|verso/i.test(it.genre || '')) return t.split('\n').filter((l) => l.trim()).slice(0, 2).join(' / ').slice(0, 190);
  const s = t.replace(/\s+/g, ' '), m = s.match(/^.{40,}?[.!?](?=\s|$)/);
  return (m ? m[0] : s.slice(0, 150)).slice(0, 190);
}

const EmptyPage = ({ p }: { p: number }) => <div className="empty"><p className="big">Página em branco</p><p>Ainda não há texto para a {ord(p)} desta edição.</p></div>;

function EdHead({ p, ed }: { p: number; ed: any }) {
  const d = ed.mode === 'real' ? weekRange(weekNow())[0] : new Date();
  return <p className="ed-head"><span className="l">{d.getDate()} de {MESL[d.getMonth()]} de {d.getFullYear()}</span><span className="c">{p === 1 ? 'Capa' : 'Página nº ' + (p - 1)}</span><span className="r">{ed.mode === 'real' ? 'Edição #' + ed.week : 'Edição inaugural'}</span></p>;
}

function Cover({ ed }: { ed: any }) {
  const m = ed.list[0];
  if (!m) return <EmptyPage p={1} />;
  const boxes: [string, Item | null, number][] = [];
  if (ed.list[1]) boxes.push(['2º lugar · pág. 2', ed.list[1], 3]);
  if (ed.list[2]) boxes.push(['3º lugar · pág. 3', ed.list[2], 4]);
  if (ed.pick) boxes.push(['Texto do editor · pág. 4', ed.pick, 5]);
  boxes.push(['Mais textos · pág. 5', null, 6]);
  return (
    <>
      <article className="cover">
        <div className="cover-txt">
          <p className="kicker">Manchete da semana · {m.genre}</p>
          <h2 className="cover-h"><OpenBtn item={m} className="hl">{m.title}</OpenBtn></h2>
          <p className="cover-deck">{deckOf(m)}</p>
          <p className="byline"><Byline item={m} /> · <b>{m.likes} {plural(m.likes, 'voto', 'votos')}</b></p>
          <p className="jump">Texto completo na 1ª Página ›</p>
        </div>
        <ArtFigure item={m} tall />
      </article>
      <div className="cover-side">
        {boxes.map(([label, it, n]) => (
          <div className="box" key={n}>
            <p className="kicker">{label}</p>
            {it
              ? <><h3 className="h-mid"><button className="hl" data-act="page" data-n={n}>{it.title}</button></h3><p className="byline"><Byline item={it} /></p></>
              : <h3 className="h-mid"><button className="hl" data-act="page" data-n="6">Quatro colunas de leitura</button></h3>}
          </div>
        ))}
      </div>
    </>
  );
}

function EditionPage({ it, p }: { it: Item; p: number }) {
  const isEd = p === 5;
  return (
    <div className="edpage">
      <span className="ed-tab">{it.title}</span>
      {isEd && <p className="ed-by">Autor: Editor</p>}
      <div className="ed-box" style={fsStyle()}>
        <p className="kicker">{isEd ? 'Texto do editor' : (p - 1) + 'º lugar'} · {it.genre}{isEd ? '' : ' · ' + it.likes + ' ' + plural(it.likes, 'voto', 'votos')}</p>
        <ArtFigure item={it} />
        <ReaderTools item={it} />
        <Body item={it} />
        <p className="endmark">— Fim —</p>
        <div className="ed-foot"><span>Dias faltando: {closeLabel()} para a próxima edição</span><span className="who">{nameOf(it)}</span></div>
      </div>
      <CommentsBox item={it} />
    </div>
  );
}

function Cols({ ed }: { ed: any }) {
  const notPick = (w: Item) => !ed.pick || w.key !== ed.pick.key;
  const short = ed.list.slice(3).concat(allWorks().filter(notPick)).sort((a: Item, b: Item) => String(a.text).length - String(b.text).length).slice(0, 4);
  let others = ed.list.slice(3, 6);
  if (others.length < 3) others = others.concat(allWorks().filter(notPick).slice(0, 3 - others.length));
  const au = ed.list.slice(0, 3);
  return (
    <>
      <h3 className="sec-banner">Contos e histórias para quem tem muita pressa</h3>
      {short.length ? (
        <div className="cols4">
          {short.map((x: Item) => (
            <article className="piece" key={x.key}>
              <p className="kicker">{x.genre}</p>
              <h3 className="h-mid"><OpenBtn item={x} className="hl">{x.title}</OpenBtn></h3>
              <p className="byline"><Byline item={x} /></p>
              <p className="excerpt"><Excerpt item={x} n={520} /></p>
              <p className="jump"><OpenBtn item={x} className="hl">Ler completo ›</OpenBtn></p>
              <div className="rate"><Stars item={x} /></div>
            </article>
          ))}
        </div>
      ) : <EmptyPage p={6} />}
      {au.length > 0 && (
        <>
          <h3 className="sec-banner">Sobre os autores da semana:</h3>
          <div className="authors3">
            {au.map((x: Item) => (
              <div className="acard" key={x.key}><Avatar name={nameOf(x)} /><div><b>{nameOf(x)}</b><p>{bioOf(x)}</p><p><OpenBtn item={x} className="hl">Ler “{x.title}” ›</OpenBtn></p></div></div>
            ))}
          </div>
        </>
      )}
      {others.length > 0 && (
        <>
          <h3 className="sec-banner">Conheça mais sobre os outros escritores</h3>
          <div className="others3">
            {others.map((x: Item) => (
              <div className="ocard" key={x.key}><ArtSvg genre={x.genre} /><p className="lbl">Sobre:</p><p>{nameOf(x)} · {bioOf(x)}</p><p className="lbl">Texto:</p><p><OpenBtn item={x} className="hl">Ler “{x.title}” ›</OpenBtn></p></div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function Tabs() {
  return <>{[1, 2, 3, 4, 5, 6].map((p) => <button key={p} className="ptab" data-act="page" data-n={p} aria-current={p === state.capaPage ? 'page' : undefined}>{ord(p)}</button>)}</>;
}

function Corpo() {
  const ed = editionData(), p: number = state.capaPage;
  return (
    <>
      <EdHead p={p} ed={ed} />
      {ed.mode === 'inaugural' && <p className="pageinfo">A primeira edição com os textos dos leitores sai na segunda-feira, {dShort(weekRange(weekNow() + 1)[0])}. Até lá, esta é uma edição de exemplo.</p>}
      {ed.mode === 'vazia' && <p className="pageinfo">Ninguém enviou textos na semana passada. Esta é uma edição de exemplo.</p>}
      {p === 1 && <><Cover ed={ed} /><ChessSlot /></>}
      {p >= 2 && p <= 4 && (ed.list[p - 2] ? <EditionPage it={ed.list[p - 2]} p={p} /> : <EmptyPage p={p} />)}
      {p === 5 && (ed.pick ? <EditionPage it={ed.pick} p={p} /> : <EmptyPage p={p} />)}
      {p === 6 && <Cols ed={ed} />}
    </>
  );
}

const roots = new WeakMap<HTMLElement, Root>();
function put(el: HTMLElement, node: React.ReactNode) {
  let root = roots.get(el);
  if (!root) { el.textContent = ''; root = createRoot(el); roots.set(el, root); }
  flushSync(() => root!.render(node));
}
export function mountCapa(tabs: HTMLElement, body: HTMLElement) {
  put(tabs, <Tabs />);
  put(body, <Corpo />);
}
// o leitor de texto ainda desenha HTML no mesmo lugar: solta o React antes
export function unmountCapa(tabs: HTMLElement, body: HTMLElement) {
  [tabs, body].forEach((el) => { const r = roots.get(el); if (r) { flushSync(() => r.unmount()); roots.delete(el); } });
}
