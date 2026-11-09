// Abas "Edição do Autor" (destaque) e "Leituras" (catálogo, busca, seção, estante) em React.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { state, plural, GENRE_DESC } from '../core/base.js';
import { allWorks, genres } from '../core/dados.js';
import { norm, shelfHas } from './extras.js';
import { pageOfWork } from './imersivo.js';
import { Excerpt, OpenBtn } from './kit';
import { ArtSvg, Byline } from './pecas';
import { LeituraPiece, WorkTools } from './historia';

const isPoem = (it: any) => /poema|poesia|verso/i.test(it.genre || '');

function Autor() {
  const works = allWorks();
  if (!works.length) return <div className="empty"><p className="big">Nenhum texto ainda</p><p>{state.canEdit ? 'Use “Escrever novo texto” na Mesa do redator.' : 'Volte em breve.'}</p></div>;
  const lead = works[0];
  return (
    <>
      <article className="lead">
        <p className="kicker">{lead.genre} · Destaque</p>
        <h2 className="h-lead"><OpenBtn item={lead} className="hl">{lead.title}</OpenBtn></h2>
        <p className="byline"><Byline item={lead} /></p>
        <div className="lead-body"><p className={'excerpt' + (isPoem(lead) ? '' : ' drop')}><Excerpt item={lead} n={620} /></p></div>
        <p className="jump">Continua na página {pageOfWork(lead)} ›</p>
        <div className="foot"><OpenBtn item={lead} className="btn small">Ler completo</OpenBtn><WorkTools w={lead} /></div>
      </article>
      <div className="empty"><p className="big">Leituras</p><p>{works.length} {plural(works.length, 'texto', 'textos')} organizados por tipo de escrita.</p><div className="row"><button className="btn primary" data-act="layer" data-v="leituras">Ver as leituras</button></div></div>
    </>
  );
}

function Leituras() {
  const works = allWorks(), gs = genres();
  const qn = norm(state.q);
  if (qn) {
    const found = works.filter((w: any) => norm(w.title + ' ' + w.genre + ' ' + w.text).indexOf(qn) >= 0);
    return (
      <>
        <div className="sec-head"><h3>Resultados</h3><button className="btn small" data-act="clearq">Limpar busca</button></div>
        <p className="pageinfo">{found.length} {plural(found.length, 'leitura', 'leituras')} para “{state.q}”</p>
        {found.length
          ? <div className="paper-cols">{found.map((w: any) => <LeituraPiece key={w.key} w={w} n={260} />)}</div>
          : <div className="empty"><p className="big">Nada encontrado</p><p>Tente outra palavra ou volte ao catálogo.</p></div>}
      </>
    );
  }
  const cnt: Record<string, number> = {};
  works.forEach((w: any) => { cnt[w.genre] = (cnt[w.genre] || 0) + 1; });
  if (state.lsec && state.lsec !== 'Todas' && state.lsec !== '__shelf' && gs.indexOf(state.lsec) < 0) state.lsec = null;
  if (!state.lsec) {
    return (
      <>
        <p className="pageinfo">Catálogo · tipos de escrita</p>
        <div className="catalog">
          {['Todas'].concat(gs).map((g) => {
            const n = g === 'Todas' ? works.length : (cnt[g] || 0);
            const d = g === 'Todas' ? 'Todos os textos, do mais recente ao mais antigo.' : (GENRE_DESC[g] || 'Textos desta seção.');
            return (
              <button key={g} className={'cat-card' + (g === 'Todas' ? ' all' : '')} data-act="ltype" data-v={g}>
                <span className="cat-n">{n}</span><span className="h-mid">{g}</span><p>{d}</p>
                <span className="cnt">{n ? 'Abrir ' + plural(n, 'leitura', 'leituras') : 'Em breve'}</span>
              </button>
            );
          })}
        </div>
      </>
    );
  }
  const sec: string = state.lsec;
  const list = sec === 'Todas' ? works : (sec === '__shelf' ? works.filter((w: any) => shelfHas(w.key)) : works.filter((w: any) => w.genre === sec));
  return (
    <>
      <div className="sec-head"><h3>{sec === 'Todas' ? 'Todas as leituras' : (sec === '__shelf' ? 'Minha estante' : sec)}</h3><button className="btn small" data-act="ltypes">← Todos os tipos</button></div>
      {sec !== 'Todas' && sec !== '__shelf' && <figure className="sec-art" aria-hidden="true"><ArtSvg genre={sec} /></figure>}
      <p className="pageinfo">{list.length} {plural(list.length, 'leitura', 'leituras')}</p>
      {list.length
        ? <div className="paper-cols">{list.map((w: any) => <LeituraPiece key={w.key} w={w} n={260} />)}</div>
        : <div className="empty"><p className="big">Seção sem textos</p><p>{sec === '__shelf' ? 'Toque em “Guardar” dentro de uma leitura para ela aparecer aqui.' : 'Ainda não há nada em ' + sec + '.'}</p></div>}
    </>
  );
}

const roots = new WeakMap<HTMLElement, Root>();
function put(el: HTMLElement, node: React.ReactNode) {
  let root = roots.get(el);
  if (!root) { el.textContent = ''; root = createRoot(el); roots.set(el, root); }
  flushSync(() => root!.render(node));
}
export const mountAutor = (el: HTMLElement) => put(el, <Autor />);
export const mountLeituras = (el: HTMLElement) => put(el, <Leituras />);
// o leitor de texto ainda desenha HTML no mesmo lugar: solta o React antes
export function unmountLeitura(el: HTMLElement) {
  const r = roots.get(el);
  if (r) { flushSync(() => r.unmount()); roots.delete(el); }
}
