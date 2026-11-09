/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { state } from '../core/base.js';

export let SUBSCRIPTION_PLAN_ORDER, SUBSCRIPTION_PLAN_LABELS, SUBSCRIPTION_PLAN_DETAILS, EARLY_ACCESS_DAYS, WEEKLY_SUBMISSION_LIMIT_BY_PLAN, BEHIND_THE_SCENES_MAX_LENGTH, MONTHLY_LETTER_MAX_LENGTH, CHIEF_REQUEST_MAX_LENGTH;



export function init(){

/* ---------- Assinatura do Contista ---------- */
SUBSCRIPTION_PLAN_ORDER=['banca','assinante','editor'];

SUBSCRIPTION_PLAN_LABELS={banca:'Banca',assinante:'Assinante',editor:'Editor-chefe'};

SUBSCRIPTION_PLAN_DETAILS={
  banca:{price:'Grátis',priceNote:'Para quem lê e quer concorrer à capa da semana.',benefits:[
    'Todos os contos, depois da liberação','Curtir, avaliar e comentar','Enviar 1 história por semana, só para concorrer à capa da semana','Puzzle de xadrez do dia','Estante e “Me surpreenda”']},
  assinante:{price:'R$ 9,90',priceUnit:'por mês',priceNote:'ou R$ 83 por ano, com 30% de desconto.',badge:'Plano principal',benefits:[
    'Tudo da banca','Conto novo uma semana antes','Bastidores: como cada conto nasceu','Carta do Raul uma vez por mês, aqui no site','Cartão de assinante com número']},
  editor:{price:'R$ 24,90',priceUnit:'por mês',priceNote:'ou R$ 209 por ano, com 30% de desconto.',benefits:[
    'Tudo do plano Assinante','Pedir o nome de um personagem do próximo conto (1 pedido por mês)','Seu nome no Expediente do site','Sugerir o tema de um conto do mês; o Raul decide']}
};

EARLY_ACCESS_DAYS=7;

WEEKLY_SUBMISSION_LIMIT_BY_PLAN={banca:1,assinante:1,editor:1};

BEHIND_THE_SCENES_MAX_LENGTH=1500;

MONTHLY_LETTER_MAX_LENGTH=1500;

CHIEF_REQUEST_MAX_LENGTH=120;

state.subscriptionDocs=Object.create(null);
 state.waitlistDocs=Object.create(null);
 state.requestDocs=Object.create(null);

state.paymentSettings={payUrl:'',instructions:''};
 state.monthlyLetter={text:'',at:0};
}
