// A fonte da máquina de escrever (Special Elite, var(--f-type)) tem o espaço estreito e as palavras ficam coladas.
// Este script (re)gera, no fim do CSS, um bloco que dá `word-spacing` a toda regra que usa essa fonte.
// Rodar de novo sempre que surgirem regras novas com var(--f-type):  node scripts/espaco-entre-palavras.mjs <arquivo.css|arquivo.html>...
// Em .html o bloco entra antes do </style> que precede o <link ... surreal.css>.
// Não normaliza o arquivo: só troca o bloco gerado, para o Git não ver o arquivo inteiro como alterado.
import fs from 'node:fs';

const ESPACO = '.2em'; // medido na tela "Enviados da semana": .12em ainda é curto, .3em quebra linhas demais
const INI = '/* palavras-espaco:inicio */', FIM = '/* palavras-espaco:fim */';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

for (const file of process.argv.slice(2)) {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(new RegExp(`(\\r?\\n)?${esc(INI)}[\\s\\S]*?${esc(FIM)}(\\r?\\n)?`), ''); // tira o bloco anterior
  const alvo = file.endsWith('.html') ? text.search(/<\/style>\s*<link rel="stylesheet" href="\/surreal\.css">/) : text.length;
  if (alvo < 0) throw new Error(`${file}: não achei onde inserir`);
  const eol = /\r\n/.test(text.slice(Math.max(0, alvo - 400), alvo)) ? '\r\n' : '\n'; // fim de linha do trecho onde o bloco entra
  // sem comentários (grudariam no seletor) e sem imagens embutidas em base64 (centenas de KB que travam a expressão regular)
  const css = text.slice(0, alvo).replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\((["']?)data:[^)]*\)/g, 'url()');
  const seletores = new Set();
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*var\(--f-type\)[^{}]*)\}/g)) {
    const sel = m[1].trim();
    if (sel && !sel.startsWith('@')) seletores.add(sel);
  }
  if (!seletores.size) throw new Error(`${file}: nenhuma regra com var(--f-type)`);
  const bloco = [INI, '/* gerado por scripts/espaco-entre-palavras.mjs: não editar à mão */', `${[...seletores].join(',' + eol)}{word-spacing:${ESPACO}}`, FIM].join(eol) + eol;
  const antes = text.slice(0, alvo), depois = text.slice(alvo);
  fs.writeFileSync(file, antes + (/\n$/.test(antes) ? '' : eol) + bloco + depois);
  console.log(`${file}: ${seletores.size} regras`);
}
