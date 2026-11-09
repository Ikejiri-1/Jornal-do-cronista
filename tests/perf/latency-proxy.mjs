// Proxy TCP que atrasa cada pacote, para simular o banco longe do servidor (ex.: Vercel nos EUA, Supabase em São Paulo).
// Uso: node tests/perf/latency-proxy.mjs <porta-local> <porta-do-postgres> <atraso-ms-por-sentido>
import net from 'node:net';
const [listen, target, delay] = [Number(process.argv[2]), Number(process.argv[3]), Number(process.argv[4] || 50)];
if (!listen || !target) throw new Error('uso: latency-proxy.mjs <porta-local> <porta-postgres> <atraso-ms>');

const later = (fn) => setTimeout(fn, delay); // mesmo atraso para todos os pacotes: a ordem é preservada
net.createServer((client) => {
  const upstream = net.connect(target, '127.0.0.1');
  client.on('data', (chunk) => later(() => upstream.writable && upstream.write(chunk)));
  upstream.on('data', (chunk) => later(() => client.writable && client.write(chunk)));
  const close = () => { later(() => { client.destroy(); upstream.destroy(); }); };
  client.on('close', close); upstream.on('close', close);
  client.on('error', () => {}); upstream.on('error', () => {});
}).listen(listen, '127.0.0.1', () => console.log(`proxy ${listen} -> ${target}, +${delay} ms por sentido (ida e volta ~${delay * 2} ms)`));
