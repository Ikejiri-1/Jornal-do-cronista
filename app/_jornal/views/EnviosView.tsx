// Aba "Enviados da semana": o que eu enviei, o que está em análise e quem concorre à manchete.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { state, fmtDate, plural } from '../core/base.js';
import { rankedStories } from '../core/dados.js';
import { likeCounts, weekNoOf, weekNow } from './semana.js';
import { lsGet } from './extras.js';
import { OpenBtn, StatusChip } from './kit';
import { StoryPiece, StoryTools } from './historia';

function Envios() {
  const W = weekNow(), counts = likeCounts();
  const mine: any[] = [];
  ((state.storyDocs[state.uid] || {}).items || []).forEach((x: any) => {
    if (weekNoOf(x.at || 0) === W) mine.push(Object.assign({}, x, { kind: 'story', uid: state.uid, key: state.uid + ':' + x.id, likes: counts[state.uid + ':' + x.id] || 0, wk: W }));
  });
  mine.sort((a, b) => b.at - a.at);
  const wait: any[] = [];
  Object.keys(state.storyDocs).forEach((uid) => {
    ((state.storyDocs[uid] || {}).items || []).forEach((x: any) => {
      if (weekNoOf(x.at || 0) === W && (x.status === 'analise' || !(x.check && x.check.v)) && !state.bans[uid]) wait.push({ id: uid + ':' + x.id, pen: x.pen, title: x.title, genre: x.genre, at: x.at, own: uid === state.uid });
    });
  });
  wait.sort((a, b) => b.at - a.at);
  const cand = rankedStories().filter((s: any) => s.demo || s.wk === W);
  return (
    <>
      <details className="how" open={lsGet<number>('gazeta-how', 0) !== 1}>
        <summary>Como funciona a semana</summary>
        <ol>
          <li>Escreva sua história na máquina de escrever e envie ao editor.</li>
          <li>O texto passa pela vistoria de originalidade, e o editor pode revisar.</li>
          <li>Até domingo, os leitores leem e votam nos textos aprovados.</li>
          <li>Na segunda-feira, o mais votado vira a manchete da Capa e os seguintes ocupam as páginas.</li>
        </ol>
      </details>
      <h3 className="sec-title">Seus envios desta semana</h3>
      {!state.uid || state.dbOff
        ? <p className="hint">Entre na sua conta para enviar e acompanhar seus textos.</p>
        : !mine.length
          ? <div className="empty"><p className="big">Você ainda não enviou nada</p><p>Escreva na máquina de escrever e envie ao editor. Depois, o status aparece aqui.</p></div>
          : mine.map((x) => {
              const fresh = Date.now() - x.at < 3 * 60 * 1000;
              return (
                <div className={'sent' + (fresh ? ' new' : '')} key={x.key}>
                  <StatusChip item={x} />{fresh && <span className="chip ok">Recém-enviado</span>}
                  <span className="t">{x.title}</span>
                  <span className="hint">{x.genre} · {fmtDate(x.at)} · {x.likes} {plural(x.likes, 'voto', 'votos')}</span>
                  <OpenBtn item={x} className="btn small">Ler</OpenBtn><StoryTools s={x} />
                </div>
              );
            })}
      <h3 className="sec-title">Aguardando análise do editor ({wait.length})</h3>
      {wait.length
        ? wait.map((x) => <div className="sent" key={x.id}><span className="chip wait">Em análise</span><span className="t">{x.title}</span><span className="hint">{x.pen} · {x.genre} · {fmtDate(x.at)}{x.own ? ' · seu envio' : ''}</span></div>)
        : <p className="hint">Nenhum texto aguardando análise agora.</p>}
      <h3 className="sec-title">Concorrendo à manchete ({cand.length})</h3>
      <p className="hint">Leia e vote até domingo. O mais votado ganha a Capa na segunda-feira.</p>
      {cand.length
        ? <div className="paper-cols two">{cand.map((s: any, i: number) => <StoryPiece key={s.key} s={s} rank={i + 1} />)}</div>
        : <div className="empty"><p className="big">Nenhum candidato ainda</p><p>Os textos aprovados aparecem aqui para receber votos.</p></div>}
    </>
  );
}

const roots = new WeakMap<HTMLElement, Root>();
export function mountEnvios(el: HTMLElement) {
  let root = roots.get(el);
  if (!root) { el.textContent = ''; root = createRoot(el); roots.set(el, root); }
  flushSync(() => root!.render(<Envios />));
}
export function unmountEnvios(el: HTMLElement) {
  const root = roots.get(el);
  if (root) { flushSync(() => root.unmount()); roots.delete(el); }
}
