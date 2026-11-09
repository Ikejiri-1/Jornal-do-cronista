// Aba Assinatura em React. A marcação e os data-act são os mesmos de antes (os cliques seguem pelo ouvinte global em foto.js),
// mas todo texto vindo do banco passa pelo escape do React: nada entra como HTML.
import { Fragment } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { state, fmtDate } from '../core/base.js';
import {
  CHIEF_REQUEST_MAX_LENGTH, EARLY_ACCESS_DAYS, MONTHLY_LETTER_MAX_LENGTH,
  SUBSCRIPTION_PLAN_DETAILS, SUBSCRIPTION_PLAN_LABELS, SUBSCRIPTION_PLAN_ORDER,
} from './assinatura.js';
import {
  currentReaderPlan, formatMonthAndYear, formatSubscriberNumber, readerCodeOf, safePaymentUrl,
  subscriptionPlanRank, waitlistPlanOfCurrentReader,
} from './foto.js';

const label = (plan: string) => SUBSCRIPTION_PLAN_LABELS[plan] ?? '';
const paragraphs = (text: string) => text.split(/\n\s*\n/);

function PlanButton({ planKey, currentPlan, waitingPlan }: { planKey: string; currentPlan: string; waitingPlan: string }) {
  if (planKey === 'banca') return <button className="btn" data-act="layer" data-v="leituras">Continuar na banca</button>;
  if (planKey === currentPlan) return <button className="btn" disabled>Seu plano atual</button>;
  if (subscriptionPlanRank(currentPlan) > subscriptionPlanRank(planKey)) return null;
  if (planKey === waitingPlan) {
    return <><button className="btn" disabled>Na lista de espera</button>{' '}<button className="btn small" data-act="leavewaitlist">Sair da lista</button></>;
  }
  return <button className="btn primary" data-act="joinwaitlist" data-plan={planKey}>Quero ser {label(planKey)}</button>;
}

function PlanCard({ planKey, currentPlan, waitingPlan }: { planKey: string; currentPlan: string; waitingPlan: string }) {
  const d = SUBSCRIPTION_PLAN_DETAILS[planKey];
  return (
    <article className={'sub-card' + (planKey === 'assinante' ? ' main' : '')}>
      <header>
        <p className="sub-kicker">
          {label(planKey)}
          {d.badge && <>{' '}<span className="chip">{d.badge}</span></>}
          {planKey === currentPlan && <>{' '}<span className="chip ok">Seu plano</span></>}
        </p>
        <p className="price">{d.price}{d.priceUnit && <>{' '}<small>{d.priceUnit}</small></>}</p>
        <p className="sub-note">{d.priceNote}</p>
      </header>
      <ul>{d.benefits.map((b: string) => <li key={b}>— {b}</li>)}</ul>
      <div className="foot"><PlanButton planKey={planKey} currentPlan={currentPlan} waitingPlan={waitingPlan} /></div>
    </article>
  );
}

function SubscriberCard({ plan }: { plan: string }) {
  const sub = state.subscriptionDocs[state.uid];
  if (plan === 'banca' || !sub) return null;
  return (
    <section className="sub-block">
      <div className="sub-id">
        <div className="sub-id-head"><span className="mast">O Contista</span><span className="sub-kicker">Cartão de assinante</span></div>
        <p className="sub-id-plan">Plano {label(plan)}</p>
        <p className="sub-id-meta"><span>Assinante nº {formatSubscriberNumber(sub.number)}</span><span>Desde {formatMonthAndYear(sub.since)}</span></p>
        <div className="sub-barcode" aria-hidden="true"></div>
      </div>
    </section>
  );
}

function Step({ kicker, title, text, dark }: { kicker: string; title: string; text: string; dark?: boolean }) {
  return <div className={'sub-step' + (dark ? ' dark' : '')}><p className="sub-kicker">{kicker}</p><p className="sub-step-title">{title}</p><p>{text}</p></div>;
}
const Link = ({ text }: { text: string }) => <div className="sub-link" aria-hidden="true"><i></i><span>{text}</span></div>;

function EarlyAccessSteps() {
  return (
    <section className="sub-block">
      <h3>Como a liberação funciona</h3>
      <p>A assinatura compra tempo, não acesso permanente. Todo conto segue o mesmo caminho.</p>
      <div className="sub-steps">
        <Step dark kicker="Dia 0" title="Conto novo, só para assinantes" text="Quem assina lê, comenta e avalia primeiro." />
        <Link text={EARLY_ACCESS_DAYS + ' dias'} />
        <Step kicker={'Dia ' + EARLY_ACCESS_DAYS} title="Abre de graça para todos" text="Qualquer leitor lê, curte, avalia e comenta." />
        <Link text="depois" />
        <Step kicker="Para sempre" title="Fica aberto na banca" text="Nada é trancado de novo, nem para quem deixa de assinar." />
      </div>
    </section>
  );
}

function HowTo({ currentPlan, waitingPlan }: { currentPlan: string; waitingPlan: string }) {
  if (currentPlan !== 'banca') return null;
  const pay = state.paymentSettings;
  const url = safePaymentUrl(pay.payUrl); // só https; qualquer outra coisa não vira link
  const code = state.uid ? readerCodeOf(state.uid) : '';
  return (
    <section className="sub-block">
      <h3>Como assinar</h3>
      <ol className="sub-howto">
        <li>Escolha o plano acima e entre na lista de espera.{waitingPlan && <>{' '}<b>Você está na lista do plano {label(waitingPlan)}.</b></>}</li>
        <li>
          Pague pelo link do Raul
          {url ? <>: <a href={url} target="_blank" rel="noopener noreferrer">abrir o pagamento</a>.</> : '. O link ainda não foi publicado; o Raul avisa aqui quando abrir.'}
          {pay.instructions && ' ' + pay.instructions}
        </li>
        <li>
          {code ? <>Informe o seu código de leitor no pagamento: <b className="sub-code">{code}</b>. </> : 'Entre na sua conta para ver o seu código de leitor. '}
          O Raul ativa o plano e o seu cartão aparece aqui.
        </li>
      </ol>
      <p className="hint">O pagamento acontece fora do site. Ao entrar na lista, você concorda com a <button className="hl" data-act="privacy"><u>política de privacidade</u></button>.</p>
    </section>
  );
}

function MonthlyLetter({ plan }: { plan: string }) {
  if (plan === 'banca' && !state.canEdit) return null;
  const letter = state.monthlyLetter;
  return (
    <section className="sub-block">
      <h3>Carta do Raul</h3>
      {letter.text
        ? <><p className="hint">{fmtDate(letter.at)}</p>{paragraphs(letter.text).map((p, i) => <p key={i}>{p.replace(/\n/g, ' ').trim()}</p>)}</>
        : <p>A primeira carta do Raul chega no próximo mês.</p>}
    </section>
  );
}

function ChiefRequestForm() {
  return (
    <section className="sub-block">
      <h3>Pedidos de Editor-chefe</h3>
      <p>Você pode pedir o nome de um personagem do próximo conto (1 pedido por mês) e sugerir o tema de um conto do mês. O Raul decide.</p>
      <div className="sub-form">
        <label htmlFor="req-kind">Pedido<select id="req-kind"><option value="personagem">Nome de personagem</option><option value="tema">Tema de um conto</option></select></label>
        <label htmlFor="req-text">Nome ou tema<input id="req-text" maxLength={CHIEF_REQUEST_MAX_LENGTH} autoComplete="off" /></label>
        <button className="btn primary" data-act="sendrequest">Enviar pedido</button>
      </div>
    </section>
  );
}

const RULES = [
  ['1 · Pagar não compra voto', 'A manchete da semana continua decidida só pelas curtidas dos leitores.'],
  ['2 · Todo conto fica aberto', 'A assinatura compra tempo e bastidores, nunca o acesso permanente.'],
  ['3 · Cancelou? Nada some', 'Seus comentários e avaliações continuam no site, e você volta para a banca.'],
  ['4 · O preço é o preço', 'A taxa do pagamento já está dentro do valor, sem surpresa na fatura.'],
];
const Rules = () => (
  <section className="sub-block">
    <h3>As regras do jornal</h3>
    <div className="sub-rules">{RULES.map(([k, t]) => <div key={k}><p className="sub-kicker">{k}</p><p>{t}</p></div>)}</div>
  </section>
);

const Row = ({ children }: { children: React.ReactNode }) => <div className="sub-row">{children}</div>;

function EditorPanel() {
  const waiting = Object.keys(state.waitlistDocs).sort((a, b) => state.waitlistDocs[a].at - state.waitlistDocs[b].at);
  const active = Object.keys(state.subscriptionDocs).sort((a, b) => state.subscriptionDocs[a].number - state.subscriptionDocs[b].number);
  const requests: { readerId: string; kind: string; request: { text: string } }[] = [];
  Object.keys(state.requestDocs).forEach((readerId) => {
    ['personagem', 'tema'].forEach((kind) => { const request = state.requestDocs[readerId][kind]; if (request) requests.push({ readerId, kind, request }); });
  });
  // key = valor guardado: se ele mudar no servidor, o campo é refeito; enquanto não mudar, o que a pessoa digitou fica
  return (
    <section className="sub-block sub-editor">
      <h3>Painel do editor · Assinaturas</h3>
      <h4>Pagamento</h4>
      <div className="sub-form">
        <label htmlFor="sub-pay-url">Link de pagamento (https)<input id="sub-pay-url" key={state.paymentSettings.payUrl} defaultValue={state.paymentSettings.payUrl} placeholder="https://" /></label>
        <label htmlFor="sub-pay-text">Instruções para quem vai pagar<textarea id="sub-pay-text" key={state.paymentSettings.instructions} maxLength={300} rows={2} defaultValue={state.paymentSettings.instructions}></textarea></label>
        <button className="btn" data-act="savepayment">Salvar pagamento</button>
      </div>
      <h4>Carta do mês</h4>
      <div className="sub-form">
        <label htmlFor="sub-letter-text">Texto da carta (aparece para assinantes)<textarea id="sub-letter-text" key={state.monthlyLetter.text} maxLength={MONTHLY_LETTER_MAX_LENGTH} rows={4} defaultValue={state.monthlyLetter.text}></textarea></label>
        <button className="btn" data-act="savecarta">Publicar a carta</button>
      </div>
      <h4>Lista de espera ({waiting.length})</h4>
      <div className="sub-form"><label htmlFor="sub-honor-name">Nome para o Expediente (só Editor-chefe, opcional)<input id="sub-honor-name" maxLength={40} autoComplete="off" /></label></div>
      {waiting.length ? waiting.map((id) => {
        const e = state.waitlistDocs[id];
        return <Row key={id}><b className="sub-code">{readerCodeOf(id)}</b><span>{label(e.plan)} · {fmtDate(e.at)}</span><button className="btn small primary" data-act="activatesub" data-reader={id} data-plan={e.plan}>Ativar</button></Row>;
      }) : <p className="hint">Ninguém na lista agora.</p>}
      <h4>Ativar por código</h4>
      <div className="sub-form">
        <label htmlFor="sub-code-input">Código de leitor<input id="sub-code-input" maxLength={8} autoComplete="off" /></label>
        <label htmlFor="sub-code-plan">Plano<select id="sub-code-plan"><option value="assinante">Assinante</option><option value="editor">Editor-chefe</option></select></label>
        <button className="btn" data-act="activatebycode">Ativar</button>
      </div>
      <h4>Assinantes ativos ({active.length})</h4>
      {active.length ? active.map((id) => {
        const s = state.subscriptionDocs[id];
        const armed = state.armed === 'sub:' + id;
        return <Row key={id}><b>nº {formatSubscriberNumber(s.number)}</b><b className="sub-code">{readerCodeOf(id)}</b><span>{label(s.plan)}{s.honorName ? ' · ' + s.honorName : ''}</span><button className="btn small danger" data-act="revokesub" data-reader={id}>{armed ? 'Confirmar encerramento' : 'Encerrar'}</button></Row>;
      }) : <p className="hint">Nenhum assinante ativo ainda.</p>}
      <h4>Pedidos dos editores-chefe ({requests.length})</h4>
      {requests.length ? requests.map((r) => (
        <Row key={r.readerId + r.kind}><b className="sub-code">{readerCodeOf(r.readerId)}</b><span>{r.kind === 'tema' ? 'Tema' : 'Personagem'}: {r.request.text}</span><button className="btn small" data-act="delrequest" data-reader={r.readerId} data-kind={r.kind}>Concluído</button></Row>
      )) : <p className="hint">Nenhum pedido no momento.</p>}
    </section>
  );
}

function Assinatura() {
  const plan = currentReaderPlan();
  const waitingPlan = waitlistPlanOfCurrentReader();
  return (
    <Fragment>
      <section className="sub-block sub-hero"><p className="sub-kicker">Assine o jornal</p><h3 className="sub-headline">Leia primeiro. Depois, todo mundo lê.</h3><p>Todo conto novo do Raul sai uma semana antes para quem assina. Passados sete dias, ele abre de graça para todos, e nunca mais fecha.</p></section>
      <SubscriberCard plan={plan} />
      <EarlyAccessSteps />
      <section className="sub-block">
        <h3>Escolha a sua assinatura</h3>
        <p>Três lugares na banca. O primeiro é grátis e continua grátis.</p>
        <div className="sub-grid">{SUBSCRIPTION_PLAN_ORDER.map((k: string) => <PlanCard key={k} planKey={k} currentPlan={plan} waitingPlan={waitingPlan} />)}</div>
        <p className="hint">Valores de lançamento. A taxa do meio de pagamento já está incluída no preço.</p>
      </section>
      <HowTo currentPlan={plan} waitingPlan={waitingPlan} />
      <MonthlyLetter plan={plan} />
      {plan === 'editor' && <ChiefRequestForm />}
      <Rules />
      {state.canEdit && <EditorPanel />}
    </Fragment>
  );
}

const roots = new WeakMap<HTMLElement, Root>();
// flushSync: o código antigo lê o DOM logo depois de render(), então o desenho tem de ser síncrono.
export function mountAssinatura(el: HTMLElement) {
  let root = roots.get(el);
  if (!root) { el.textContent = ''; root = createRoot(el); roots.set(el, root); }
  flushSync(() => root!.render(<Assinatura />));
}
