/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { $, esc, plural, state } from '../core/base.js';
import { renderAutor } from './autor.js';
import { renderLeituras } from './leituras.js';
import { renderTools, syncOptions } from './mesa.js';
import { renderProfile } from './perfil.js';
import { renderHonorRoll, renderSubscription, renderWeeklySubmissionHint } from './foto.js';
import { renderCapa } from './capa.js';
import { renderEnvios } from './envios.js';

export let WEATHER, DATES, CAMPAIGNS, CURIOS, raf;
export function __set_render(v){ render=v; return v; }

export 

/* ---------- render geral ---------- */
function render(){
  var d=new Date();
  document.body.classList.toggle('is-reading',!!state.reading);
  if(window.Fundos)Fundos.tema(state.layer==='leituras'&&state.lsec?state.lsec:'Contos');
  
  updateDateline();
  document.querySelectorAll('.layer').forEach(function(b){b.setAttribute('aria-selected',String(b.dataset.v===state.layer))});
  $('#view-autor').hidden=state.layer!=='autor';
  $('#view-capa').hidden=state.layer!=='capa';
  $('#view-leituras').hidden=state.layer!=='leituras';
  $('#view-envios').hidden=state.layer!=='envios';
  $('#view-assinatura').hidden=state.layer!=='assinatura';
  $('#view-perfil').hidden=state.layer!=='perfil';
  $('#btnDemo').textContent=state.demo?'Sair dos exemplos':'Ver exemplos de envios';
  syncOptions(); renderTools(); renderWeeklySubmissionHint(); renderHonorRoll();
  if(state.layer==='autor')renderAutor(); else if(state.layer==='leituras')renderLeituras(); else if(state.layer==='envios')renderEnvios(); else if(state.layer==='assinatura')renderSubscription(); else if(state.layer==='perfil')renderProfile(); else renderCapa();
}
export 
function renderCurio(){
  var box=$('#curioBody'); if(!box)return;
  var d=new Date(), n=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(2026,0,1))/864e5);
  var L=CURIOS.length, g=function(a,b){return b?g(b,a%b):a}, k=[11,13,17,19,23].filter(function(x){return g(x,L)===1})[0]||1;
  var c=CURIOS[(((n*k)%L)+L)%L];
  box.innerHTML='<div class="curio"><p class="obra">'+esc(c[0])+'</p><span class="autor">'+esc(c[1])+'</span><p>'+esc(c[2])+'</p></div>';
}
export 
function renderNews(){
  var box=$('#newsBody'); if(!box)return;
  var d=new Date(), t=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  var dow=(t.getDay()+6)%7, ab=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  var wk='<div class="wk" aria-label="Semana atual">'+ab.map(function(a,i){
    var c=new Date(t.getFullYear(),t.getMonth(),t.getDate()-dow+i);
    return '<span'+(i===dow?' class="hoje"':'')+'>'+a+'<em>'+c.getDate()+'</em></span>';
  }).join('')+'</div>';
  var best=null;
  DATES.forEach(function(x){
    var c=new Date(t.getFullYear(),x[1]-1,x[0]); if(c<t)c=new Date(t.getFullYear()+1,x[1]-1,x[0]);
    var n=Math.round((c-t)/864e5); if(!best||n<best.n)best={n:n,name:x[2],d:x[0],m:x[1]};
  });
  var pad=function(n){return String(n).padStart(2,'0')};
  var next=best.n===0?'Hoje é '+best.name+'.':'Em '+best.n+' '+plural(best.n,'dia','dias')+': '+best.name+' ('+pad(best.d)+'/'+pad(best.m)+').';
  var wd=new Date(WEATHER.date[0],WEATHER.date[1]-1,WEATHER.date[2]);
  var age=Math.round((t-wd)/864e5), stale=age>6;
  var wdate=pad(WEATHER.date[2])+'/'+pad(WEATHER.date[1])+'/'+WEATHER.date[0];
  box.innerHTML=wk+'<ul class="news-lines">'+
    '<li><b>Calendário</b>'+esc(next)+'</li>'+
    '<li><b>Campanha do mês</b>'+esc(CAMPAIGNS[t.getMonth()])+'</li>'+
    '<li><b>Tempo no Brasil</b>'+(stale?'Esta previsão já passou. A previsão da semana ainda não chegou à gráfica.':WEATHER.items.map(esc).join('<br>'))+
    '<p class="news-src">'+esc(WEATHER.src)+', '+wdate+(stale?' (edição anterior)':'')+'</p></li></ul>';
}
export 
function updateDateline(){
  var d=new Date(), t0=new Date(2026,9,1), t1=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  var n=Math.max(1,Math.round((t1-t0)/864e5)+1), y=Math.floor((n-1)/365)+1;
  var rom=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
  var el=$('#dl-date'); if(el)el.textContent=d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  el=$('#dl-n'); if(el)el.textContent=n;
  el=$('#dl-y'); if(el)el.textContent=rom[y-1]||y;
  renderNews(); renderCurio();
}
export 
function tickMidnight(){
  var n=new Date(), next=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1,0,0,1);
  setTimeout(function(){updateDateline();render();tickMidnight()},next-n);
}
export 
function updateClock(){
  var el=$('#dl-clock'); if(!el)return;
  var d=new Date(), p=function(n){return String(n).padStart(2,'0')};
  var s=p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());
  if(el.dataset.v===s)return; el.dataset.v=s;
  var h=''; for(var i=0;i<6;i++){h+='<i>'+s.charAt(i)+'</i>'; if(i===1||i===3)h+='<b>:</b>'}
  el.innerHTML=h;
}
export 
function schedule(){if(raf)return; raf=requestAnimationFrame(function(){raf=0;render()})}
export 
function toTop(){var el=document.querySelector('.layers'); if(el&&el.scrollIntoView)el.scrollIntoView({block:'start'})}

export function init(){

/* data e edição do cabeçalho: seguem o dia local e viram à meia-noite, mesmo com a página aberta */
/* Notícias da semana: a faixa da semana, a próxima data e a campanha do mês mudam sozinhas a cada dia; a previsão do tempo é um retrato datado e avisa quando fica antiga */
WEATHER={date:[2026,10,19],src:'Climatempo',items:[
  'Centro-Sul: a semana começou com ar frio e tempo firme; a partir de quarta (21) a instabilidade volta.',
  'Sul: nova onda de temporais de quinta (22) até domingo (25).',
  'Norte e Nordeste: a frente fria se afasta e voltam o calor perto de 40 °C e o ar seco.'
]};

DATES=[[1,1,'Confraternização Universal'],[21,4,'Tiradentes'],[1,5,'Dia do Trabalho'],[7,9,'Independência do Brasil'],[12,10,'Nossa Senhora Aparecida'],[15,10,'Dia do Professor'],[31,10,'Dia do Saci'],[2,11,'Finados'],[15,11,'Proclamação da República'],[20,11,'Dia da Consciência Negra'],[25,12,'Natal'],[31,12,'Réveillon']];

CAMPAIGNS=['Janeiro Branco: cuidado com a saúde mental.','Fevereiro Roxo e Laranja: lúpus, Alzheimer e leucemia.','Março Lilás: prevenção do câncer de colo do útero.','Abril Azul: conscientização sobre o autismo.','Maio Amarelo: segurança no trânsito.','Junho Vermelho: doação de sangue.','Julho Amarelo: combate às hepatites virais.','Agosto Dourado: incentivo à amamentação.','Setembro Amarelo: prevenção do suicídio.','Outubro Rosa: prevenção do câncer de mama.','Novembro Azul: saúde do homem e câncer de próstata.','Dezembro Laranja: prevenção do câncer de pele.'];

/* Curiosidade do dia: uma curiosidade sobre um livro de ficção por dia, em rodízio pelo calendário */
CURIOS=[
['Dom Quixote','Miguel de Cervantes','Publicado em 1605, é apontado por muitos como o primeiro romance moderno. O fidalgo que enlouquece de tanto ler romances de cavalaria é, ele próprio, um leitor apaixonado.'],
['Frankenstein','Mary Shelley','Nasceu de um desafio entre amigos, numa temporada na Suíça em 1816: cada um deveria inventar uma história de terror. Mary tinha 18 anos.'],
['Memórias Póstumas de Brás Cubas','Machado de Assis','O narrador é um morto que decide contar a vida depois de enterrado, o que o transforma num dos narradores mais inusitados da literatura em português.'],
['O Pequeno Príncipe','Antoine de Saint-Exupéry','As ilustrações do livro, publicado em 1943, são do próprio autor. Ele é um dos livros mais traduzidos do mundo.'],
['Drácula','Bram Stoker','O romance é contado por cartas, diários e recortes de jornal, e não por um narrador único. Isso dá à história um ar de dossiê.'],
['Harry Potter e a Pedra Filosofal','J. K. Rowling','O primeiro livro da série foi recusado por várias editoras antes de encontrar quem o publicasse, em 1997.'],
['Vinte Mil Léguas Submarinas','Júlio Verne','O submarino Nautilus, do livro de 1870, deu nome ao primeiro submarino nuclear da Marinha dos Estados Unidos, lançado em 1954.'],
['O Hobbit','J. R. R. Tolkien','Segundo o próprio Tolkien, a história começou com uma frase rabiscada numa folha em branco, enquanto ele corrigia provas de alunos.'],
['Alice no País das Maravilhas','Lewis Carroll','A história nasceu de um passeio de barco, em 1862, quando Carroll a contou para três irmãs, entre elas a menina Alice Liddell.'],
['As Aventuras de Sherlock Holmes','Arthur Conan Doyle','Conan Doyle fez Holmes morrer em 1893, mas a pressão dos leitores foi tanta que o detetive acabou voltando.'],
['Moby Dick','Herman Melville','Vendeu pouco quando saiu, em 1851, e só foi reconhecido como obra-prima décadas depois da morte do autor.'],
['O Senhor dos Anéis','J. R. R. Tolkien','Tolkien criou idiomas, como o quenya e o sindarin, e as histórias da Terra-média cresceram para dar um mundo a essas línguas.'],
['Dom Casmurro','Machado de Assis','Mais de um século depois, leitores ainda discutem se Capitu realmente traiu Bentinho ou se tudo é ciúme de um narrador nada confiável.'],
['Fahrenheit 451','Ray Bradbury','O título é a temperatura em que o papel pega fogo. Bradbury escreveu o livro numa máquina alugada, por moedas, no porão de uma biblioteca.'],
['Orgulho e Preconceito','Jane Austen','O título provisório do livro era Primeiras Impressões, o que combina bem com o tema de julgamentos rápidos demais.'],
['O Jogador','Fiódor Dostoiévski','Dostoiévski ditou o romance em cerca de um mês para cumprir um contrato apertado com o editor.'],
['O Guia do Mochileiro das Galáxias','Douglas Adams','A resposta para a vida, o universo e tudo mais é 42. O autor disse que o número foi uma escolha qualquer, feita de brincadeira.'],
['A Hora da Estrela','Clarice Lispector','Foi lançado em 1977, pouco antes da morte da autora, e traz um narrador que se questiona o tempo todo sobre como contar a história.'],
['O Alquimista','Paulo Coelho','Entrou para o recorde mundial de livro mais traduzido de um autor vivo, reconhecido pelo Guinness em 2009.'],
['O Morro dos Ventos Uivantes','Emily Brontë','Foi publicado em 1847 com o pseudônimo Ellis Bell, porque mulheres escritoras ainda eram vistas com desconfiança.'],
['A Metamorfose','Franz Kafka','O inseto em que Gregor Samsa se transforma nunca é descrito com exatidão. Kafka chegou a pedir que a capa não o mostrasse.'],
['Neuromancer','William Gibson','Lançado em 1984, ajudou a popularizar a palavra ciberespaço e inspirou muita da ficção científica que veio depois.'],
['Duna','Frank Herbert','O livro foi recusado por dezenas de editoras antes de sair, em 1965, e depois se tornou um clássico da ficção científica.'],
['Ensaio sobre a Cegueira','José Saramago','Nenhum dos personagens principais tem nome. São chamados por traos, como a mulher do médico ou o primeiro cego.'],
['Grande Sertão: Veredas','Guimarães Rosa','O romance de 1956 é um longo monlógo de Riobaldo, sem divisão em capítulos, e inventa palavras para contar o sertão.'],
['Os Crimes da Rua Morgue','Edgar Allan Poe','Publicado em 1841, é apontado como o primeiro conto policial moderno e abriu caminho para detetives como Holmes.'],
['O Conde de Monte Cristo','Alexandre Dumas','Saiu em capítulos num jornal, entre 1844 e 1846, e os leitores esperavam cada novo trecho com ansiedade.'],
['Vidas Secas','Graciliano Ramos','Os capítulos podem ser lidos quase como contos separados, e o da cachorra Baleia é um dos mais lembrados da literatura brasileira.'],
['Carrie, a Estranha','Stephen King','King jogou as primeiras páginas no lixo, e foi a esposa, Tabitha, quem as recuperou e o incentivou a continuar.'],
['A Menina que Roubava Livros','Markus Zusak','A narradora é a própria Morte, que acompanha a história de Liesel e conta tudo com um olhar curiosamente humano.'],
['Cem Anos de Solidão','Gabriel García Márquez','A história se passa em Macondo, cidade imaginada que se tornou um dos lugares mais famosos da literatura.'],
['Jane Eyre','Charlotte Brontë','Foi publicado em 1847 com o pseudônimo Currer Bell, e o nome verdadeiro da autora só apareceu depois do sucesso.'],
['Macunaíma','Mário de Andrade','O livro de 1928 mistura lendas indígenas, falas de várias regiões e humor, e seu herói é apresentado como alguém sem nenhum caráter. Mário escreveu a primeira versão em poucos dias.'],
['Reinações de Narizinho','Monteiro Lobato','A boneca de pano Emília ganha voz ao tomar uma pílula falante, e desde então vira a personagem mais irreverente do Sítio do Picapau Amarelo.'],
['O Tempo e o Vento','Erico Verissimo','A saga acompanha as famílias Terra e Cambará por cerca de dois séculos, de meados do século XVIII até os anos 1940, no Rio Grande do Sul.'],
['Torto Arado','Itamar Vieira Junior','Antes de virar livro, o manuscrito ganhou o Prêmio LeYa, em 2018. O romance conta a vida de duas irmãs numa fazenda da Chapada Diamantina.'],
['O Livro do Desassossego','Fernando Pessoa','Pessoa deixou o livro em papéis soltos, e a primeira edição completa só saiu quase meio século depois da morte dele. O autor fictício é o ajudante de guarda-livros Bernardo Soares.'],
['Pedro Páramo','Juan Rulfo','O romance mexicano de 1955 se passa numa cidade fantasma, e grande parte das vozes que o contam são de mortos, o que embaralha passado e presente.'],
['Ficções','Jorge Luis Borges','O livro de contos de 1944 reúne histórias sobre bibliotecas infinitas, labirintos e espelhos, e é um dos pontos mais altos da literatura fantástica em espanhol.'],
['A Casa dos Espíritos','Isabel Allende','Em 1981, Isabel começou a escrever o livro como uma carta ao avô doente, quando morava longe do Chile e não podia visitá-lo.'],
['Como Água para Chocolate','Laura Esquivel','Cada capítulo começa com uma receita, e os pratos se misturam aos sentimentos da protagonista, Tita.'],
['O Mundo se Despedaça','Chinua Achebe','O título vem de um poema de W. B. Yeats. O romance de 1958, passado na Nigéria, é um dos livros africanos mais lidos do mundo.'],
['As Mil e Uma Noites','Autoria coletiva','Aladim e Ali Babá não constam dos manuscritos árabes mais antigos. Eles entraram na coletânea pela tradução do francês Antoine Galland, no início do século XVIII.'],
['Genji Monogatari','Murasaki Shikibu','Escrito por volta do ano 1000 por uma dama da corte japonesa, é frequentemente apontado como um dos primeiros romances da história.'],
['Sonho da Câmara Vermelha','Cao Xueqin','Um dos quatro grandes romances clássicos da China, do século XVIII, tem centenas de personagens e é tão estudado que ganhou um campo de pesquisa só seu, a Redologia.'],
['Jornada ao Oeste','Wu Cheng’en','O Rei Macaco, Sun Wukong, personagem deste clássico chinês do século XVI, inspirou o Goku de Dragon Ball.'],
['O Mestre e Margarida','Mikhail Bulgákov','Bulgákov queimou a primeira versão e reescreveu a história de memória. Nela, o diabo e sua comitiva, com um gato preto falante, chegam a Moscou.'],
['Guerra e Paz','Liev Tolstói','A esposa de Tolstói, Sofia, copiou o manuscrito à mão várias vezes, porque a letra do marido era difícil de ler.'],
['O Nome da Rosa','Umberto Eco','Eco contou que a ideia nasceu de um desejo simples: ele queria envenenar um monge. Dali saiu um romance policial numa abadia medieval.'],
['Os Moomins','Tove Jansson','O primeiro troll Moomin, rabugento, foi desenhado por Tove na parede de um banheiro, antes de virar protagonista de livros infantis finlandeses.'],
['Píppi Meia-Longa','Astrid Lindgren','A história nasceu quando Astrid contou aventuras para a filha, Karin, que estava doente na cama. O nome Pippi foi inventado pela própria menina.'],
['A Fantástica Fábrica de Chocolate','Roald Dahl','Dahl se inspirou nos tempos de escola, quando a Cadbury mandava caixas de chocolate para os alunos provarem e darem opinião.'],
['O Mágico de Oz','L. Frank Baum','No livro de 1900, os sapatinhos de Dorothy são de prata. Eles viraram vermelhos no filme de 1939, para brilhar mais no cinema colorido.'],
['O Leão, a Feiticeira e o Guarda-Roupa','C. S. Lewis','Lewis disse que tudo começou com uma imagem que o acompanhava desde os 16 anos: um fauno carregando um guarda-chuva e pacotes numa floresta nevada.'],
['Fundação','Isaac Asimov','Asimov se inspirou na queda do Império Romano para imaginar a queda de um império galáctico. As primeiras histórias saíram em revista, nos anos 1940.'],
['Eu, Robô','Isaac Asimov','O livro de 1950 apresentou ao grande público as Três Leis da Robótica, que até hoje inspiram debates e outras histórias.'],
['Solaris','Stanisław Lem','O planeta é coberto por um oceano que parece pensar, e os humanos nunca conseguem entendê-lo. Lem criticou as adaptações do livro para o cinema.'],
['Jogos Vorazes','Suzanne Collins','Suzanne contou que a ideia surgiu ao zapear canais de TV, e que o livro também bebe do mito grego de Teseu e do Minotauro.'],
['Crepúsculo','Stephenie Meyer','Stephenie disse que a história começou com um sonho, em 2003, em que uma garota conversava com um vampiro numa clareira.'],
['E Não Sobrou Nenhum','Agatha Christie','Agatha disse que este livro de 1939 foi o mais difícil de escrever. Ele está entre os romances policiais mais vendidos de todos os tempos.'],
['O Chamado de Cthulhu','H. P. Lovecraft','Publicado em 1928 numa revista de histórias estranhas, o conto ficou tão famoso que seus monstros ganharam vida própria na obra de outros autores.'],
['Mulherzinhas','Louisa May Alcott','Louisa não queria escrever um livro para meninas, mas aceitou o pedido do editor, em 1868, e usou a própria família como inspiração.'],
['O Grande Gatsby','F. Scott Fitzgerald','Fitzgerald cogitou outros títulos, como Trimalquião em West Egg, antes de escolher O Grande Gatsby.'],
['Percy Jackson e o Ladrão de Raios','Rick Riordan','Rick inventou o herói ao contar mitos gregos para o filho na hora de dormir, antes de transformar tudo em livro.'],
['Coraline','Neil Gaiman','O nome nasceu de um erro de digitação: Neil escreveu Coraline sem querer ao digitar Caroline e gostou do resultado.'],
['Eragon','Christopher Paolini','Christopher começou a escrever aos 15 anos, e a família publicou o livro por conta própria antes de uma grande editora assumir.'],
['A Ilha do Tesouro','Robert Louis Stevenson','Stevenson começou a história ao desenhar o mapa de uma ilha imaginária, e o enredo foi crescendo a partir dele.'],
['O Livro da Selva','Rudyard Kipling','Os contos de 1894 seguem Mowgli, um menino criado por lobos na Índia. Kipling ganharia o Nobel de Literatura em 1907, aos 41 anos, o laureado mais jovem até hoje.'],
['Contos de Fadas','Irmãos Grimm','Os Grimm reuniram histórias ouvidas de contadores, e as primeiras edições eram bem mais cruas. Com os anos, eles foram suavizando os textos.'],
['Anne de Green Gables','L. M. Montgomery','Recusado por várias editoras, o manuscrito ficou guardado numa caixa de chapéu até L. M. Montgomery tentar de novo. O livro saiu em 1908.'],
['Ulisses','James Joyce','Toda a história se passa em um único dia, 16 de junho de 1904, que virou o Bloomsday, celebrado por leitores de Joyce em várias cidades.'],
['O Retrato de Dorian Gray','Oscar Wilde','Saiu primeiro numa revista, em 1890. Na versão em livro, em 1891, Wilde acrescentou capítulos e um prefácio.']
];

tickMidnight();

updateClock();
 setInterval(updateClock,1000);

document.addEventListener('visibilitychange',function(){if(!document.hidden){updateDateline();updateClock()}});

raf=0;
}
