// Peças de história/texto usadas por várias telas (Capa, Enviados, Leituras, Autor): autor, curtir, estrelas, comentários, arte da edição.
// Mesma marcação e data-act dos construtores de string antigos; texto do banco sempre escapado pelo React.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLayoutEffect, useRef } from 'react';
import { state, fmtDate } from '../core/base.js';
import { myLikes } from '../core/dados.js';
import { ART_CAP, ART_SC, ART_ST, weekNow } from './semana.js';
import { ART_TOP, IN_ONCE, IN_SC } from './introducao.js';
import { RAUL_PROFILE_ID, profileIdOfItem } from './perfil.js';
import { commentsFor, ratingStats } from './edicao.js';
import { fsScale, readHas, readMin, shelfHas } from './extras.js';
import { chessHtml } from '../engine.js';
import { plural } from './kit';

type Item = any;
let seq = 0;

export function AuthorLink({ item }: { item: Item }) {
  const id = profileIdOfItem(item), label = item.kind === 'work' ? 'Raul Xavier' : (item.pen || 'Anônimo');
  if (!id || item.demo) return <b>{label}</b>;
  return <button className="author-link" data-act="profile" data-profile={id} title={'Ver o perfil de ' + label}><b>{label}</b></button>;
}
void RAUL_PROFILE_ID;

export function Byline({ item }: { item: Item }) {
  const tag = item.kind === 'work'
    ? (item.sample ? 'exemplo' : '')
    : item.demo ? 'exemplo' : item.status === 'analise' ? 'em análise' : item.check ? '✓ vistoriada' : '';
  return <>por <AuthorLink item={item} /> · {fmtDate(item.at)} · {readMin(item)} min{readHas(item.key) ? ' · ✓ lida' : ''}{tag && <span className="tag">{tag}</span>}</>;
}

export function LikeBtn({ item }: { item: Item }) {
  const liked = myLikes().indexOf(item.key) >= 0;
  let why = '';
  if (item.demo) why = 'Exemplo: as curtidas são fixas.';
  else if (item.wk && item.wk < weekNow()) why = 'A votação desta história já foi encerrada.';
  else if (item.status === 'analise') why = 'Esta história ainda está em análise.';
  else if (state.dbOff || !state.uid) why = 'Entre na sua conta para curtir.';
  else if (state.canWrite === false) why = 'Seu acesso é só de leitura.';
  else if (item.uid === state.uid) why = 'Você não pode curtir a própria história.';
  return <button className={'like' + (liked ? ' on' : '')} data-act="like" data-key={item.key} disabled={!!why} title={why || undefined} aria-pressed={liked}>☞ {liked ? 'Curtida' : 'Curtir'} · <b>{item.likes}</b></button>;
}

export function Stars({ item }: { item: Item }) {
  const st = ratingStats(item);
  let why = '';
  if (item.demo) why = 'Exemplo: as avaliações são fixas.';
  else if (state.dbOff || !state.uid) why = 'Entre na sua conta para avaliar.';
  else if (state.canWrite === false) why = 'Seu acesso é só de leitura.';
  else if (item.uid && item.uid === state.uid) why = 'Você não pode avaliar o próprio texto.';
  else if (item.kind === 'work' && state.canEdit) why = 'O autor não avalia os próprios textos.';
  return (
    <span className="stars" role="group" aria-label="Avaliação de 1 a 5 estrelas">
      {[1, 2, 3, 4, 5].map((i) => {
        const on = st.mine ? i <= st.mine : i <= Math.round(st.avg);
        return <button key={i} type="button" className={on ? '' : 'dim'} data-act="rate" data-key={item.key} data-n={i} aria-label={i + ' ' + plural(i, 'estrela', 'estrelas')} disabled={!!why} title={why || undefined}>★</button>;
      })}
      {why && !item.demo && <span className="why">({why.toLowerCase().replace(/\.$/, '')})</span>}
      <span className="meta">{st.n ? st.avg.toFixed(1).replace('.', ',') + ' · ' + st.n + ' ' + plural(st.n, 'avaliação', 'avaliações') : 'sem avaliações'}{st.mine ? ' · você deu ' + st.mine : ''}</span>
    </span>
  );
}

export function ReaderTools({ item }: { item: Item }) {
  const on = shelfHas(item.key);
  return (
    <div className="reader-tools" role="group" aria-label="Ferramentas de leitura">
      <button className="btn small" data-act="fs" data-d="-1" aria-label="Diminuir a letra">A−</button>
      <button className="btn small" data-act="fs" data-d="1" aria-label="Aumentar a letra">A+</button>
      <button className="btn small" data-act="shelf" data-key={item.key} aria-pressed={on}>{on ? '★ Na estante' : '☆ Guardar'}</button>
      <button className="btn small" data-act="print">Imprimir</button>
    </div>
  );
}

export function CommentsBox({ item }: { item: Item }) {
  const list = commentsFor(item), draft = state.cmDraft[item.key] || '';
  const can = !item.demo && state.db && state.uid && state.canWrite !== false;
  return (
    <section className="cm-box">
      <h3>Comentários que motivam o escritor:</h3>
      {list.length ? list.map((c) => (
        <div className="cm" key={c.uid + c.id}><b>{c.p}</b> — {c.t}{c.uid !== 'demo' && (c.uid === state.uid || state.canEdit) && <>{' '}<button className="hl" data-act="cmdel" data-uid={c.uid} data-id={c.id}><u>apagar</u></button></>}</div>
      )) : <p className="hint">Ainda sem comentários. Seja a primeira pessoa a incentivar.</p>}
      {can ? (
        <>
          <div className="cm-form">
            {/* key = rascunho guardado: quando ele muda (envio limpa), o campo é refeito, como o desenho antigo fazia */}
            <input className="cm-input" key={draft} data-key={item.key} maxLength={240} placeholder="Deixe uma palavra de incentivo para o escritor" aria-label="Comentário de incentivo" defaultValue={draft} />
            <button className="btn small" data-act="cmsend" data-key={item.key}>Comentar</button>
          </div>
          <p className="hint">Só comentários de incentivo e sem links. O editor remove o que não for gentil.</p>
        </>
      ) : !item.demo && <p className="hint">Entre na sua conta para comentar.</p>}
      <div className="cm-foot"><span><b className="hint">AVALIAÇÃO:</b> <Stars item={item} /></span></div>
    </section>
  );
}

// As ilustrações (IN_SC / IN_ONCE) são SVG fixos do projeto, nunca texto de usuário.
export function ArtSvg({ genre, tall }: { genre: string; tall?: boolean | string }) {
  const sc = ART_SC[genre] || 'vila', st = ART_ST[sc], id = 'a' + ++seq, H = tall === 'world' ? 480 : (tall ? 330 : 190);
  const fit = Math.min(1, H / (200 - (ART_TOP[sc] || -60) + 12)), tw = 880 * fit, left = (880 - tw) / 2, baseY = H - 200 * fit;
  const tf = (x: number) => `translate(${x.toFixed(1)},${baseY.toFixed(1)}) scale(${fit.toFixed(3)})`;
  return (
    <svg className="art" viewBox={`0 0 880 ${H}`} preserveAspectRatio="xMidYMax slice" role="img" aria-label={'Ilustração: ' + ART_CAP[sc]}>
      <defs>
        <linearGradient id={'g' + id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={st[0]} /><stop offset="1" stopColor={st[1]} /></linearGradient>
        <pattern id={'h' + id} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="3.5" cy="3.5" r="1.7" fill="#000" /></pattern>
      </defs>
      <rect width="880" height={H} fill={`url(#g${id})`} />
      <g style={{ color: st[2] }} fill="currentColor">
        {[-3, -2, -1, 0, 1, 2, 3].map((k) => <g key={k} transform={tf(left + k * tw)} dangerouslySetInnerHTML={{ __html: IN_SC[sc] }} />)}
        <g transform={tf(left)} dangerouslySetInnerHTML={{ __html: IN_ONCE[sc] }} />
      </g>
      <rect width="880" height={H} fill={`url(#h${id})`} opacity=".2" />
    </svg>
  );
}

export function ArtFigure({ item, tall }: { item: Item; tall?: boolean }) {
  const sc = ART_SC[item.genre] || 'vila';
  return <figure className="cover-fig"><ArtSvg genre={item.genre} tall={tall} /><figcaption>Ilustração da edição · {ART_CAP[sc]}</figcaption></figure>;
}

export function Body({ item }: { item: Item }) {
  if (/poema|poesia|verso/i.test(item.genre || '')) return <div className="poem">{item.text}</div>;
  return <div className="art-body">{item.text.split(/\n\s*\n/).map((p: string, i: number) => <p key={i}>{p.replace(/\n/g, ' ').trim()}</p>)}</div>;
}

export const fsStyle = () => ({ '--fs': String(fsScale()) }) as React.CSSProperties;

// O bloco do xadrez é carregado sob demanda pelo engine.js: ele devolve um espaço reservado e depois troca pelo tabuleiro.
// Esta caixa é do React só como casca; o conteúdo é do módulo do xadrez e é refeito a cada desenho da Capa, como antes.
export function ChessSlot() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (ref.current) ref.current.innerHTML = chessHtml(); });
  return <div ref={ref} style={{ display: 'contents' }} />;
}
