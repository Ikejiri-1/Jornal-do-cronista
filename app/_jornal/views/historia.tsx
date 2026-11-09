// Peças de história: ferramentas por texto (denunciar, remover...), cartão "storyPiece" e o selo de status.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { state } from '../core/base.js';
import { Excerpt, OpenBtn, plural } from './kit';
import { Byline, LikeBtn } from './pecas';
import { earlyAccessDaysLeft } from './foto.js';
import { pageOfWork } from './imersivo.js';

type Item = any;

export function StoryTools({ s }: { s: Item }) {
  if (s.demo || !state.db) return null;
  const reported = state.reported[s.key];
  const rep = s.uid !== state.uid && state.uid && state.canWrite !== false
    ? <button className="btn small" data-act="report" data-key={s.key} disabled={!!reported}>{reported ? 'Denunciada' : 'Denunciar'}</button>
    : null;
  if (!state.canEdit) return rep;
  const rc = state.reports[s.key] ? <span className="hint">⚑ {state.reports[s.key]} {plural(state.reports[s.key], 'denúncia', 'denúncias')}</span> : null;
  const ed = s.uid && s.uid !== state.uid
    ? <>
        <button className="btn small" data-act="reverify" data-key={s.key}>Reverificar</button>
        <button className="btn small danger" data-act="banuser" data-uid={s.uid}>{state.bans[s.uid] ? 'Desbloquear autor' : (state.armed === 'ban:' + s.uid ? 'Confirmar bloqueio' : 'Bloquear autor')}</button>
      </>
    : null;
  const armed = state.armed === 's:' + s.key;
  return <>{rep}{rc}{ed}<button className="btn small danger" data-act="delstory" data-key={s.key}>{armed ? 'Confirmar remoção' : (s.uid === state.uid ? 'Retirar minha história' : 'Remover da Capa')}</button></>;
}

export function StoryPiece({ s, rank }: { s: Item; rank: number }) {
  return (
    <article className="piece">
      <span className="rank-sm">{rank}<sup>º</sup></span>
      <p className="kicker">{s.genre}</p>
      <h3 className="h-mid"><OpenBtn item={s} className="hl">{s.title}</OpenBtn></h3>
      <p className="byline"><Byline item={s} /></p>
      <p className="excerpt"><Excerpt item={s} n={230} /></p>
      <div className="foot"><LikeBtn item={s} /><OpenBtn item={s} className="btn small">Ler</OpenBtn></div>
    </article>
  );
}

export function WorkTools({ w }: { w: Item }) {
  if (!state.canEdit || !state.db || w.sample) return null;
  const armed = state.armed === 'w:' + w.key;
  const d = w.earlyUntil > Date.now() ? earlyAccessDaysLeft(w.earlyUntil) : 0;
  return (
    <>
      {w.earlyUntil > Date.now() && <span className="chip">Primeira mão · {d} {plural(d, 'dia', 'dias')}</span>}
      <button className="btn small" data-act="editwork" data-key={w.key}>Editar</button>
      <button className="btn small danger" data-act="delwork" data-key={w.key}>{armed ? 'Confirmar exclusão' : 'Excluir'}</button>
    </>
  );
}

export function LeituraPiece({ w, n }: { w: Item; n: number }) {
  return (
    <article className="piece">
      <p className="kicker">{w.genre}</p>
      <h3 className="h-mid"><OpenBtn item={w} className="hl">{w.title}</OpenBtn></h3>
      <p className="byline"><Byline item={w} /></p>
      <p className="excerpt"><Excerpt item={w} n={n} /></p>
      <p className="jump">Continua na página {pageOfWork(w)} ›</p>
      <div className="foot"><OpenBtn item={w} className="btn small">Ler completo</OpenBtn><WorkTools w={w} /></div>
    </article>
  );
}
