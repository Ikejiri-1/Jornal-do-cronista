// Aba Perfil em React. Mesma marcação e mesmos data-act de antes; texto do banco sempre escapado pelo React.
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { state, fmtDate } from '../core/base.js';
import { findItem } from '../core/dados.js';
import { SUBSCRIPTION_PLAN_LABELS } from './assinatura.js';
import { PROFILE_PHOTO_SIZE, currentReaderPlan, formatMonthAndYear, profilePhotoOf, readerCodeOf } from './foto.js';
import {
  PROFILE_BIO_MAX_LENGTH, PROFILE_NAME_MAX_LENGTH, RAUL_PROFILE_ID, followersOf, followingOf, isFollowing,
  latestStoryOf, profileBioOf, profileHasData, profileNameOf, profileStoriesOf,
} from './perfil.js';
import { lsGet, readMin } from './extras.js';
import { ratingStats } from './edicao.js';
import { Avatar, Excerpt, OpenBtn, StatusChip, plural } from './kit';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Story = any;
const trunc = (s: string, n: number) => (typeof s === 'string' ? s.slice(0, n) : '');
const stars = (avg: number) => avg.toFixed(1).replace('.', ',');

function ProfileAvatar({ id, name, photo }: { id: string; name: string; photo?: string }) {
  const p = photo !== undefined ? photo : profilePhotoOf(id);
  // a foto só chega aqui depois de passar por cleanProfilePhoto (data URL de imagem, tamanho limitado)
  return p
    ? <img className="avatar-photo" src={p} alt={'Foto de perfil de ' + name} width={PROFILE_PHOTO_SIZE} height={PROFILE_PHOTO_SIZE} />
    : <Avatar name={name} />;
}

function Actions({ id }: { id: string }) {
  if (id === state.uid) return <button className="btn small" data-act="editprofile">Editar perfil</button>;
  if (!state.uid || !state.db) return <button className="btn small" disabled title="Entre na sua conta para seguir.">Seguir</button>;
  const following = isFollowing(id);
  return <button className={'btn small' + (following ? '' : ' primary')} data-act="follow" data-profile={id} aria-pressed={following}>{following ? 'Seguindo' : 'Seguir'}</button>;
}

function Header({ id }: { id: string }) {
  const name = profileNameOf(id);
  const stories = profileStoriesOf(id);
  const pub = stories.filter((s: Story) => !s.pending);
  const likes = pub.reduce((t: number, s: Story) => t + (s.likes || 0), 0);
  const rated = pub.filter((s: Story) => s.kind === 'story').map(ratingStats).filter((r: any) => r.n);
  const ratingCount = rated.reduce((t: number, r: any) => t + r.n, 0);
  const ratingAvg = ratingCount ? rated.reduce((t: number, r: any) => t + r.avg * r.n, 0) / ratingCount : 0;
  const oldest = stories.reduce((lo: number, s: Story) => (s.at && (!lo || s.at < lo) ? s.at : lo), 0);
  const bio = profileBioOf(id);
  const followers = followersOf(id).length;
  const following = followingOf(id).length;
  const hasPhoto = !!profilePhotoOf(id);
  return (
    <header className="pf-head">
      <div className={'pf-avatar' + (hasPhoto ? ' has-photo' : '')}><ProfileAvatar id={id} name={name} /></div>
      <div className="pf-main">
        <div className="pf-line"><h2 className="pf-name">{name}</h2>{id === RAUL_PROFILE_ID && <span className="chip ok">Autor e editor</span>}</div>
        <div className="pf-actions">
          <Actions id={id} />
          {state.canEdit && id !== RAUL_PROFILE_ID && state.profileDocs[id] && <button className="btn small danger" data-act="clearprofile" data-profile={id}>{state.armed === 'pf:' + id ? 'Confirmar limpeza' : 'Limpar perfil (editor)'}</button>}
          {state.canEdit && hasPhoto && <button className="btn small danger" data-act="clearphoto" data-profile={id}>{state.armed === 'ph:' + id ? 'Confirmar remoção' : 'Remover foto (editor)'}</button>}
        </div>
        <ul className="pf-stats">
          <li><b>{stories.length}</b> {plural(stories.length, 'história', 'histórias')}</li>
          <li><button data-act="pflist" data-list="followers"><b>{followers}</b> {plural(followers, 'seguidor', 'seguidores')}</button></li>
          <li><button data-act="pflist" data-list="following"><b>{following}</b> seguindo</button></li>
        </ul>
        {bio ? <p className="pf-bio">{bio}</p> : <p className="pf-bio pf-empty">{id === state.uid ? 'Conte em poucas palavras quem você é. Use “Editar perfil”.' : 'Este perfil ainda não tem bio.'}</p>}
        <p className="pf-meta">{oldest ? 'Escreve desde ' + formatMonthAndYear(oldest) + ' · ' : ''}♥ {likes} {plural(likes, 'curtida recebida', 'curtidas recebidas')}{ratingCount ? ' · ★ ' + stars(ratingAvg) + ' de média' : ''}</p>
      </div>
    </header>
  );
}

function Highlights({ id }: { id: string }) {
  const stories = profileStoriesOf(id);
  const counts: Record<string, number> = {};
  stories.forEach((s: Story) => { counts[s.genre] = (counts[s.genre] || 0) + 1; });
  const names = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  if (!names.length) return null;
  const Circle = ({ label, genre, count }: { label: string; genre: string; count: number }) => (
    <button className="pf-hl" data-act="pfgenre" data-genre={genre} aria-pressed={state.profileGenre === genre}>
      <span className="pf-hl-circle">{label.charAt(0).toUpperCase()}</span><span className="pf-hl-name">{label}</span><span className="pf-hl-count">{count}</span>
    </button>
  );
  return (
    <div className="pf-highlights" role="group" aria-label="Tipos de escrita">
      <Circle label="Todas" genre="" count={stories.length} />
      {names.map((g) => <Circle key={g} label={g} genre={g} count={counts[g]} />)}
    </div>
  );
}

function Tabs({ id }: { id: string }) {
  const tabs: [string, string][] = [['historias', 'Histórias']];
  if (id === state.uid) tabs.push(['salvos', 'Salvos']);
  tabs.push(['sobre', 'Sobre']);
  return (
    <div className="pf-tabs" role="tablist" aria-label="Seções do perfil">
      {tabs.map(([k, t]) => <button key={k} role="tab" data-act="pftab" data-tab={k} aria-selected={state.profileTab === k}>{t}</button>)}
    </div>
  );
}

function Card({ story }: { story: Story }) {
  const rating = story.kind === 'story' ? ratingStats(story) : null;
  const meta = story.kind === 'work'
    ? readMin(story) + ' min de leitura'
    : '♥ ' + (story.likes || 0) + (rating && rating.n ? ' · ★ ' + stars(rating.avg) : '') + ' · ' + fmtDate(story.at);
  return (
    <article className="pf-card">
      <p className="kicker">{story.genre}</p>
      <h3 className="h-mid"><OpenBtn item={story} className="hl">{story.title}</OpenBtn></h3>
      <p className="excerpt"><Excerpt item={story} n={130} /></p>
      <p className="pf-card-meta">{story.pending ? <StatusChip item={story} /> : meta}</p>
    </article>
  );
}

function Grid({ stories, empty }: { stories: Story[]; empty: React.ReactNode }) {
  return stories.length ? <div className="pf-grid">{stories.map((s) => <Card key={s.key} story={s} />)}</div> : <>{empty}</>;
}

function People({ id }: { id: string }) {
  const kind = state.profileList;
  const ids = (kind === 'followers' ? followersOf(id) : followingOf(id)).slice(0, 100);
  return (
    <section className="pf-people">
      <div className="pf-people-head"><h3>{kind === 'followers' ? 'Seguidores' : 'Seguindo'} ({ids.length})</h3><button className="btn small" data-act="pflist" data-list="">Fechar</button></div>
      {ids.length ? ids.map((rid) => {
        const name = profileNameOf(rid), bio = profileBioOf(rid);
        return (
          <div className="pf-person" key={rid}>
            <span className="pf-person-avatar"><ProfileAvatar id={rid} name={name} /></span>
            <span className="pf-person-text"><button className="author-link" data-act="profile" data-profile={rid}><b>{name}</b></button>{bio && <small>{trunc(bio, 80)}</small>}</span>
            {rid === state.uid ? null : <Actions id={rid} />}
          </div>
        );
      }) : <p className="hint">Ninguém por aqui ainda.</p>}
    </section>
  );
}

function About({ id }: { id: string }) {
  const latest = latestStoryOf(id), own = id === state.uid, plan = currentReaderPlan();
  const bio = profileBioOf(id);
  return (
    <section className="pf-about">
      <h3>Sobre</h3>
      <p>{bio ? bio : 'Sem bio por enquanto.'}</p>
      {own && <p className="hint">Seu código de leitor: <b className="sub-code">{readerCodeOf(state.uid)}</b> · Plano {SUBSCRIPTION_PLAN_LABELS[plan]} · <button className="hl" data-act="layer" data-v="assinatura"><u>Ver a assinatura</u></button></p>}
      {latest && latest.pen && !own && id !== RAUL_PROFILE_ID && <p className="hint">Assina as histórias como “{latest.pen}”.</p>}
    </section>
  );
}

function PhotoRow({ preview, name }: { preview: string | undefined; name: string }) {
  return (
    <div className="pf-photo-row">
      <span className={'pf-avatar pf-avatar-preview' + (preview ? ' has-photo' : '')}><ProfileAvatar id={state.uid} name={name} photo={preview} /></span>
      <div className="pf-photo-actions">
        <label className="btn small" htmlFor="pf-photo-input">{preview ? 'Trocar foto' : 'Escolher foto'}</label>
        <input id="pf-photo-input" className="pf-file" type="file" accept="image/*" />
        {preview && <button className="btn small" data-act="removephoto">Remover foto</button>}
        <p className="hint">A foto fica pública no seu perfil. Use uma foto sua ou um desenho. Ela é cortada em quadrado e reduzida no seu aparelho, e os dados da câmera, como a localização, são apagados. Não envie fotos de outras pessoas, de crianças, nudez ou conteúdo ofensivo.</p>
      </div>
    </div>
  );
}

function EditForm() {
  const draft = state.profileTextDraft, saved = state.profileDocs[state.uid];
  const name: string = draft ? draft.name : (saved ? saved.name : (profileNameOf(state.uid).indexOf('Leitor ') === 0 ? '' : profileNameOf(state.uid)));
  const bio: string = draft ? draft.bio : profileBioOf(state.uid);
  const preview = state.profilePhotoDraft !== undefined ? state.profilePhotoDraft : profilePhotoOf(state.uid);
  return (
    <section className="sub-block pf-edit">
      <h3>Editar perfil</h3>
      <PhotoRow preview={preview} name={name || profileNameOf(state.uid)} />
      <div className="sub-form">
        <label htmlFor="pf-name-input">Nome de autor<input id="pf-name-input" key={'n' + name} maxLength={PROFILE_NAME_MAX_LENGTH} autoComplete="off" defaultValue={name} /></label>
        <label htmlFor="pf-bio-input">Bio (até {PROFILE_BIO_MAX_LENGTH} caracteres)<textarea id="pf-bio-input" key={'b' + bio} maxLength={PROFILE_BIO_MAX_LENGTH} rows={3} defaultValue={bio}></textarea></label>
        <p className="hint">O perfil é público: nome, bio e foto aparecem para todos. Links e e-mails não são permitidos.</p>
        <div className="row"><button className="btn primary" data-act="saveprofile">Salvar perfil</button><button className="btn" data-act="cancelprofile">Cancelar</button></div>
      </div>
    </section>
  );
}

function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return <div className="empty"><p className="big">{title}</p>{children}</div>;
}

function Perfil({ id }: { id: string }) {
  if (!profileHasData(id)) return <Empty title="Perfil não encontrado"><p>Este autor ainda não publicou nada.</p></Empty>;
  const stories = profileStoriesOf(id);
  const filtered = state.profileGenre ? stories.filter((s: Story) => s.genre === state.profileGenre) : stories;
  const own = id === state.uid;
  let content: React.ReactNode;
  if (state.profileList) content = <People id={id} />;
  else if (state.profileTab === 'sobre') content = <About id={id} />;
  else if (state.profileTab === 'salvos' && own) {
    const saved = lsGet<string[]>('gazeta-shelf', []).map((key) => findItem({ kind: key.indexOf(':') > 0 ? 'story' : 'work', key })).filter(Boolean);
    content = <Grid stories={saved} empty={<Empty title="Nada guardado"><p>Use “Guardar” em qualquer leitura para ela aparecer aqui.</p></Empty>} />;
  } else {
    content = <Grid stories={filtered} empty={
      <Empty title="Nenhuma história ainda">
        <p>{own ? 'Envie a sua primeira história para concorrer à capa da semana.' : 'Volte em breve.'}</p>
        {own && <div className="row"><button className="btn primary" data-act="newstory">Escrever e enviar ao editor</button></div>}
      </Empty>} />;
  }
  return (
    <>
      {state.profileEditing && own && <EditForm />}
      <Header id={id} />
      {!state.profileList && <><Highlights id={id} /><Tabs id={id} /></>}
      {content}
    </>
  );
}

const roots = new WeakMap<HTMLElement, Root>();
export function mountPerfil(el: HTMLElement, id: string) {
  let root = roots.get(el);
  if (!root) { el.textContent = ''; root = createRoot(el); roots.set(el, root); }
  flushSync(() => root!.render(<Perfil id={id} />));
}
// o leitor de texto ainda desenha HTML no mesmo lugar: solta o React antes
export function unmountPerfil(el: HTMLElement) {
  const root = roots.get(el);
  if (root) { flushSync(() => root.unmount()); roots.delete(el); }
}
