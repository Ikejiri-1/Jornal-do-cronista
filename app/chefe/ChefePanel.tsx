'use client';
import { useCallback, useEffect, useState } from 'react';
import styles from './chefe.module.css';

type Work = { id: string; title: string; genre: string; text: string; at?: number };
const fmtDate = (at?: number) => (at ? new Date(at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'sem data');
// Mesma lista de seções do jornal (DEFAULT_GENRES em public/legacy/index.html).
const THEMES = ['Contos', 'Poemas', 'Aventuras', 'Fantasia', 'Crônicas', 'Ficção Científica', 'Terror e Suspense'];

export default function ChefePanel({ csrf }: { csrf: string }) {
  const [works, setWorks] = useState<Work[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState(THEMES[0]);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');

  const api = useCallback(async (method: string, id: string, data?: unknown) => {
    const res = await fetch('/api/db/works/' + encodeURIComponent(id), {
      method, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: data ? JSON.stringify({ data }) : undefined,
    });
    if (!res.ok) throw new Error(((await res.json().catch(() => ({}))).error || {}).message || 'Erro.');
  }, [csrf]);

  const load = useCallback(async () => {
    const res = await fetch('/api/db/works', { credentials: 'same-origin' });
    const list: { id: string; data: Work }[] = (await res.json()).data || [];
    setWorks(list.map((d) => ({ ...d.data, id: d.id })));
  }, []);
  useEffect(() => { load(); }, [load]);

  const themes = [...new Set([...THEMES, ...works.map((w) => w.genre)])];
  const reset = () => { setEditing(null); setTitle(''); setText(''); setTheme(THEMES[0]); };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const genre = theme;
    if (!title.trim() || text.trim().length < 20) return setMsg('Preencha título, tema e um texto com pelo menos 20 caracteres.');
    try {
      const fields = { title: title.trim(), genre, text: text.replace(/\r/g, '').trim() };
      if (editing) await api('PATCH', editing, fields);
      else await api('PUT', Date.now().toString(36) + Math.random().toString(36).slice(2, 6), { ...fields, at: Date.now(), earlyUntil: 0, behind: '' });
      setMsg(editing ? 'Conto atualizado.' : 'Conto publicado.');
      reset(); load();
    } catch (err) { setMsg((err as Error).message); }
  }

  async function remove(w: Work) {
    if (!confirm(`Excluir “${w.title}”?`)) return;
    try { await api('DELETE', w.id); setMsg('Conto excluído.'); load(); } catch (err) { setMsg((err as Error).message); }
  }

  const byTheme = themes.map((t) => ({ theme: t, items: works.filter((w) => w.genre === t).sort((x, y) => (y.at || 0) - (x.at || 0)) })).filter((g) => g.items.length);

  return (
    <main className={styles.wrap}>
      <div className={styles.paper}>
        <p className={styles.dateline}>O Contista · Mesa do chefe</p>
        <h1 className={styles.title}>Painel do chefe</h1>
        <p className={styles.sub}>Escolha o tema e escreva cada conto. Só o Raul vê esta página.</p>
        <a className={styles.back} href="/">← Voltar ao jornal</a>
        {msg && <p role="status" className={styles.status}>{msg}</p>}

        <h2 className={styles.h2}>{editing ? 'Editar conto' : 'Novo conto'}</h2>
        <form onSubmit={save} className={styles.form}>
          <label>Título<input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></label>
          <label>Tema
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              {themes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label>História<textarea value={text} rows={14} maxLength={20000} onChange={(e) => setText(e.target.value)} /></label>
          <div className={styles.actions}>
            <button type="submit" className={`${styles.btn} ${styles.primary}`}>{editing ? 'Salvar alterações' : 'Publicar conto'}</button>
            {editing && <button type="button" className={styles.btn} onClick={reset}>Cancelar</button>}
          </div>
        </form>

        <h2 className={styles.h2}>Contos publicados ({works.length})</h2>
        {!byTheme.length && <p className={styles.empty}>Nenhum conto ainda.</p>}
        {byTheme.map((g) => (
          <section key={g.theme} className={styles.theme}>
            <h3 className={styles.themeHead}><span>{g.theme}</span><span>{g.items.length}</span></h3>
            <ul className={styles.list}>
              {g.items.map((w) => (
                <li key={w.id} className={styles.item}>
                  <span className={styles.itemTitle}>{w.title}</span>
                  <span className={styles.date}>{fmtDate(w.at)}</span>
                  <span className={styles.itemActions}>
                    <button type="button" className={`${styles.btn} ${styles.small}`} onClick={() => { setEditing(w.id); setTitle(w.title); setText(w.text); setTheme(w.genre); window.scrollTo(0, 0); }}>Editar</button>
                    <button type="button" className={`${styles.btn} ${styles.small} ${styles.danger}`} onClick={() => remove(w)}>Excluir</button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
