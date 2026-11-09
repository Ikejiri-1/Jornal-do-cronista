/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */

export let DEFAULT_GENRES, SEED, DEMO, GENRE_DESC, CAPA_SIZE, PAGE_SIZE, state, $, noteTimer;
export function __set_noteTimer(v){ noteTimer=v; return v; }

export 
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
export 
function newId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
export 
function fmtDate(ms){try{return new Date(ms).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})}catch(e){return ''}}
export 
function isPoem(it){return /poema|poesia|verso/i.test(it.genre||'')}
export 
function plural(n,a,b){return n===1?a:b}

export function init(){


DEFAULT_GENRES=['Contos','Poemas','Aventuras','Fantasia','Crônicas','Ficção Científica','Terror e Suspense'];


/* Textos de exemplo do autor (podem ser ocultados na Mesa do redator) */
SEED=[
{id:'ex1',title:'A Última Linha do Ônibus',genre:'Contos',at:Date.UTC(2026,9,14),sample:true,text:
"O motorista só abria a porta para quem soubesse o nome da parada. Dona Isaura sabia todas, e por isso viajava sempre de graça.\n\nNaquela noite, porém, o ônibus passou direto pelo ponto da farmácia, pela padaria fechada, pela praça sem fonte. Os passageiros se olharam, e ninguém reclamou, porque do lado de fora as ruas estavam ficando familiares demais: a casa da infância, o campinho, o muro onde alguém escreveu um nome que ela nunca esqueceu.\n\n— Esta linha só roda uma vez por ano — disse o motorista, sem virar o rosto. — Leva cada um até o lugar de onde nunca saiu.\n\nDona Isaura ajeitou a bolsa no colo. Quando a porta enfim se abriu, havia uma cozinha acesa, cheiro de café e uma voz que a chamava pelo apelido de menina.\n\nEla desceu devagar. Atrás dela, o ônibus acendeu a placa e seguiu viagem, leve de saudades, pronto para a próxima."},
{id:'ex2',title:'Tinta',genre:'Poemas',at:Date.UTC(2026,9,12),sample:true,text:
"Há dias em que escrevo com a mão\ne há dias em que escrevo com o silêncio.\nOs dois deixam manchas.\n\nA tinta não pergunta de onde vem a pressa:\nescorre, seca, vira marca,\nvira um jeito de ficar.\n\nGuardo no bolso um verso inacabado\ncomo quem guarda uma chave\nsem saber qual porta.\n\nSe alguém ler isto amanhã,\nque encontre a porta aberta\ne a luz da cozinha acesa."},
{id:'ex3',title:'O Mapa Rasgado ao Meio',genre:'Aventuras',at:Date.UTC(2026,9,9),sample:true,text:
"A metade do mapa chegou numa garrafa que não era de vidro, mas de casca de coco lacrada com cera. Tomás a abriu na proa do Vento Sul, sob o olhar desconfiado de toda a tripulação.\n\n— Falta o outro pedaço — disse Marta, a navegadora, traçando com o dedo uma costa que terminava em nada. — Quem rasga um mapa quer que dois estranhos se encontrem.\n\nTrês dias depois, avistaram uma vela vermelha no horizonte. Do convés do outro barco, um homem de chapéu de palha acenava com um papel dobrado no alto, como quem pede trégua ou deseja uma partida.\n\n— Ele é pirata? — sussurrou o grumete.\n\n— Pior — respondeu Tomás, guardando no casaco a metade que tinha. — Parece alguém que também sente que o tesouro é o de menos.\n\nO Vento Sul virou lentamente. Era hora de descobrir o que fica escrito do outro lado de um rasgo."},
{id:'ex4',title:'O Reino que Cabia numa Gaveta',genre:'Fantasia',at:Date.UTC(2026,9,6),sample:true,text:
"Quando a avó de Lia morreu, deixou uma cômoda velha com onze gavetas. Dez abriam normalmente. A décima primeira só abria à noite, e só para quem estivesse com medo.\n\nLia puxou o puxador de latão numa terça-feira de trovões. Em vez de meias e botões, encontrou um céu pequeno, uma estrada de cinza prateada e um reino inteiro do tamanho de um jogo de damas. Havia torres, pontes, cavaleiros do comprimento de um dedo.\n\n— Você demorou — disse a rainha, que cabia na palma de sua mão. — A guerra começou quando sua avó parou de visitar.\n\n— Que guerra?\n\n— A do silêncio contra o barulho. Ela sempre dava um jeito de empatar.\n\nLia olhou o trovão pela janela, olhou o reino na gaveta e entendeu que a herança não era uma cômoda: era um posto de trabalho."},
{id:'ex5',title:'Domingo, Pão e Jornal',genre:'Crônicas',at:Date.UTC(2026,9,3),sample:true,text:
"Há uma beleza discreta em comprar pão no domingo de manhã. A fila anda devagar, o padeiro conhece o pedido de cada um, e o cheiro de forno faz até o sujeito mais apressado fingir que não tem horário.\n\nNa banca ao lado, o jornal de papel resiste, dobrado em quatro, com a tinta ainda soltando um pouco nos dedos. Eu sei, eu sei: tudo isso está na tela, de graça, em segundos. Mas existe um tipo de notícia que só se lê direito com as mãos sujas.\n\nVolto para casa com o pão debaixo de um braço e o jornal debaixo do outro, feito alguém carregando duas pequenas certezas. Em tempos de tanta pressa, é quase um ato de coragem."}
];


/* Edição de demonstração: só local, não vai para o banco. */
DEMO=[
{pen:'Cecília P.',genre:'Contos',title:'A Gata que Contava Estrelas',likes:48,at:Date.UTC(2026,9,2),text:"Toda noite, a gata subia ao telhado e contava as estrelas em voz baixa. Nunca passava de trinta e sete, porque era aí que o sono vencia. Uma noite, uma criança ouviu do quintal e completou: trinta e oito. A gata sorriu pela primeira vez e, daquele dia em diante, ensinou o céu a ser contado a dois."},
{pen:'Henrique B.',genre:'Poemas',title:'Carta para Depois da Chuva',likes:41,at:Date.UTC(2026,9,4),text:"Escrevo depois da chuva,\nquando o chão ainda guarda o céu\nem pequenas poças,\ne cada passo meu\né um jeito de atravessar o azul\nsem molhar o futuro."},
{pen:'Duda L.',genre:'Aventuras',title:'O Faroleiro de Pedra',likes:37,at:Date.UTC(2026,9,5),text:"O faroleiro não acendia a luz para os barcos. Acendia para as pedras, que reclamavam do escuro desde o primeiro naufrágio. Numa madrugada de tempestade, as pedras sussurraram um mapa inteiro, e foi assim que o velho descobriu um caminho que nenhum navegante jamais desenhara."},
{pen:'Iara M.',genre:'Fantasia',title:'Dragão de Segunda-Feira',likes:29,at:Date.UTC(2026,9,7),text:"Na segunda-feira, o dragão chegou atrasado à própria caverna. Tinha perdido o ônibus e meio tesouro. Explicou ao chefe, um grifo severo, que voar também cansa. O grifo suspirou, serviu café e prometeu que, na terça, ninguém ia cobrar fogo de ninguém."},
{pen:'Otávio R.',genre:'Ficção Científica',title:'Última Estação, Plataforma Zero',likes:18,at:Date.UTC(2026,9,8),text:"A estação Zero ficava depois do último planeta habitado. Ninguém descia lá, mas todos os trens paravam, por respeito. Helena foi a primeira a pisar na plataforma e ouviu, vindo do vazio, o apito de um trem que ainda não tinha sido construído."},
{pen:'Lúcia F.',genre:'Crônicas',title:'Receita de Avó',likes:12,at:Date.UTC(2026,9,10),text:"A receita da vovó dizia apenas: farinha, ovos, paciência. Passei a vida procurando a medida certa de cada coisa. Só entendi quando fiz o bolo de olhos fechados, ouvindo a cozinha: a medida era a lembrança, e ela nunca cabia na xícara."},
{pen:'Bento A.',genre:'Terror e Suspense',title:'O Quarto que Respirava',likes:7,at:Date.UTC(2026,9,11),text:"O quarto respirava quando eu fingia dormir. Primeiro devagar, depois no mesmo compasso do meu peito. Na terceira noite, percebi que não era o quarto que imitava a mim. Era eu que, havia anos, aprendia a respirar como ele."}
];


GENRE_DESC={'Contos':'Histórias curtas, com uma virada no fim.','Poemas':'Versos para ler devagar.','Aventuras':'Mapas, viagens e travessias.','Fantasia':'Mundos onde o impossível tem endereço.','Crônicas':'O cotidiano visto de perto.','Ficção Científica':'Futuros, estações e máquinas.','Terror e Suspense':'Histórias para ler com a luz acesa.'};

CAPA_SIZE=4;
PAGE_SIZE=6;


state={
  layer:'autor', section:'Todas', lsec:null, capaPage:1, reading:null,
  db:null, dbOff:false, uid:null, canEdit:false, canWrite:null,
  works:[], storyDocs:{}, likeDocs:{}, hideSamples:false,
  ready:{stories:false,likes:false}, demo:false,
  composerOpen:false, workFormOpen:false, editing:null,
  armed:null, busy:false, busyLike:false, optsKey:''
};


$=function(s){return document.querySelector(s)};


noteTimer=null;
}
