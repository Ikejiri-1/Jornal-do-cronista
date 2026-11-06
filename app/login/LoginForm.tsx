'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './login.module.css';

type Mode = 'in' | 'up';
const KNOWN_PAGES = ['capa', 'autor', 'leituras', 'envios', 'assinatura', 'perfil'];

export default function LoginForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>('in');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; good: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Só volta para páginas conhecidas do jornal, nunca para um endereço vindo da URL.
  const next = params.get('next') || '';
  const target = KNOWN_PAGES.includes(next) ? '/#' + next : '/';

  useEffect(() => {
    try { setHasDraft(sessionStorage.getItem('gazeta-resume') === 'story'); } catch { /* sem storage */ }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: Record<string, string> = { email: String(form.get('email') || ''), password: String(form.get('password') || '') };
    if (mode === 'up') body.name = String(form.get('name') || '');
    setBusy(true); setMessage(null);
    try {
      const response = await fetch('/api/auth/' + (mode === 'in' ? 'login' : 'register'), {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const json = await response.json().catch(() => ({}));
      if (response.ok) { setMessage({ text: 'Entrando na redação…', good: true }); window.location.href = target; return; }
      let text: string = json.error?.message || 'Não foi possível entrar agora.';
      const wait = Number(response.headers.get('Retry-After'));
      if (wait) text += ` (tente de novo em ${Math.ceil(wait / 60)} min)`;
      setMessage({ text, good: false });
      if (json.error?.field) document.getElementById(json.error.field)?.focus();
    } catch {
      setMessage({ text: 'Sem conexão com o servidor. Tente de novo.', good: false });
    }
    setBusy(false);
  }

  return (
    <main className={styles.wrap}>
      <section className={styles.paper} aria-labelledby="login-title">
        <p className={styles.dateline}>O Contista · Classificados · Entrada de autores</p>
        <h1 id="login-title" className={styles.title}>{mode === 'in' ? 'Entre para publicar' : 'Abra a sua conta'}</h1>
        <p className={styles.sub}>
          {hasDraft ? 'Seu rascunho está guardado. Entre e ele volta na mesa de escrita.' : 'Para enviar uma história ao editor é preciso estar identificado.'}
        </p>

        <div className={styles.tabs} role="tablist" aria-label="Entrar ou criar conta">
          <button type="button" role="tab" aria-selected={mode === 'in'} onClick={() => { setMode('in'); setMessage(null); }}>Já tenho conta</button>
          <button type="button" role="tab" aria-selected={mode === 'up'} onClick={() => { setMode('up'); setMessage(null); }}>Criar conta</button>
        </div>

        <form onSubmit={submit} noValidate>
          {mode === 'up' && (
            <label htmlFor="name">Nome de autor
              <input id="name" name="name" maxLength={40} autoComplete="nickname" required />
            </label>
          )}
          <label htmlFor="email">E-mail
            <input id="email" name="email" type="email" maxLength={254} autoComplete="email" inputMode="email" required />
          </label>
          <label htmlFor="password">Senha
            <span className={styles.pw}>
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} maxLength={128} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} required />
              <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-pressed={showPassword}>{showPassword ? 'Esconder' : 'Mostrar'}</button>
            </span>
          </label>
          {mode === 'up' && <p className={styles.hint}>Use uma frase longa, com pelo menos 15 caracteres. Ex.: “o gato conta estrelas no telhado”.</p>}
          {message && <p role="alert" className={message.good ? styles.good : styles.bad}>{message.text}</p>}
          <button type="submit" className={styles.go} disabled={busy}>{mode === 'in' ? 'Entrar' : 'Criar conta e entrar'}</button>
        </form>
        <a className={styles.back} href="/">← Voltar ao jornal</a>
      </section>
    </main>
  );
}
